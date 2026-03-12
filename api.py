#!/usr/bin/env python3
"""
P2P Dispute AI Analysis API
FastAPI server that streams Claude's AI analysis of a P2P dispute.
"""

import os
import json
import anthropic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="P2P Dispute AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are an automated P2P dispute analysis AI for a crypto trading platform.
Given a P2P dispute case, analyze it and return a structured JSON response only — no markdown, no prose.

Return exactly this JSON structure:
{
  "ocr": {
    "merchant_name": "string",
    "transaction_date": "string",
    "amount": "string",
    "reference_id": "string",
    "bank": "string",
    "status": "SUCCESSFUL | FAILED | PENDING",
    "confidence": number (0-100),
    "verified": true | false
  },
  "three_way_match": {
    "checks": [
      { "field": "string", "expected": "string", "found": "string", "passed": true | false, "warning": true | false }
    ],
    "passed_count": number,
    "total_count": number,
    "verdict": "string (one sentence)",
    "payment_legitimate": true | false
  },
  "sentiment": {
    "urgency": number (0-100),
    "frustration": number (0-100),
    "trust": number (0-100),
    "risk_flags": ["string"],
    "summary": "string"
  },
  "triage": {
    "risk_score": number (0.00-1.00),
    "priority": "HIGH | MEDIUM | LOW",
    "claim_validity_pct": number (0-100),
    "urgency_level": "string",
    "seller_risk_score": number (0.00-1.00),
    "buyer_history": "string",
    "similar_cases_pct": number (0-100),
    "recommended_action": "string",
    "auto_resolve_eligible": true | false,
    "auto_resolve_reason": "string"
  },
  "summary": "string (2-3 sentence overall case summary for moderator)"
}"""


class DisputeData(BaseModel):
    order_id: str
    buyer: str
    seller: str
    amount_usd: float
    amount_local: float
    local_currency: str
    reason: str
    description: Optional[str] = ""
    ocr_extracted: Optional[dict] = None
    chat_summary: Optional[str] = ""
    # Tier context
    buyer_tier: Optional[str] = None           # Bronze | Silver | Gold | Diamond
    seller_tier: Optional[str] = None
    buyer_join_days: Optional[int] = None
    seller_join_days: Optional[int] = None
    seller_lifetime_orders: Optional[int] = None
    seller_dispute_free_days: Optional[int] = None
    buyer_lifetime_orders: Optional[int] = None
    buyer_dispute_free_days: Optional[int] = None


TIER_RULES = """
Platform Tier System (V2 Proposed):
| Tier    | Daily Buy | Daily Sell | Min Join Days | Min 30D Completion | Min Dispute-Free Days | Min Lifetime Orders |
|---------|-----------|------------|---------------|--------------------|-----------------------|---------------------|
| Bronze  | $200      | $200       | 0             | —                  | 0                     | <1,000              |
| Silver  | $500      | $500       | 45            | 80%                | 30                    | 1,000               |
| Gold    | $5,000    | $2,000     | 90            | 90%                | 45                    | 5,000               |
| Diamond | $10,000   | $10,000    | 180           | 98%                | 60                    | 15,000              |

Rules:
- Market Makers are auto-assigned Diamond regardless of criteria
- An at-fault dispute resets the dispute-free clock
- Limits reset on a rolling 24-hour basis
- Tier mismatch signals: Bronze buyer vs Diamond seller = elevated fraud risk
- High seller_risk_score + high tier = stronger escalation signal (trusted user abusing position)
"""


def _build_tier_context(d: DisputeData) -> str:
    if not d.buyer_tier and not d.seller_tier:
        return ""

    lines = ["\n--- Tier Context ---", TIER_RULES]

    if d.buyer_tier:
        b = f"Buyer tier: {d.buyer_tier}"
        if d.buyer_join_days is not None:
            b += f" | Joined {d.buyer_join_days} days ago"
        if d.buyer_lifetime_orders is not None:
            b += f" | {d.buyer_lifetime_orders} lifetime orders"
        if d.buyer_dispute_free_days is not None:
            b += f" | {d.buyer_dispute_free_days} dispute-free days"
        lines.append(b)

    if d.seller_tier:
        s = f"Seller tier: {d.seller_tier}"
        if d.seller_join_days is not None:
            s += f" | Joined {d.seller_join_days} days ago"
        if d.seller_lifetime_orders is not None:
            s += f" | {d.seller_lifetime_orders} lifetime orders"
        if d.seller_dispute_free_days is not None:
            s += f" | {d.seller_dispute_free_days} dispute-free days"
        lines.append(s)

    # Tier mismatch signal
    tier_rank = {"Bronze": 1, "Silver": 2, "Gold": 3, "Diamond": 4}
    b_rank = tier_rank.get(d.buyer_tier or "", 0)
    s_rank = tier_rank.get(d.seller_tier or "", 0)
    if s_rank - b_rank >= 2:
        lines.append(
            f"⚠ TIER MISMATCH: {d.buyer_tier} buyer vs {d.seller_tier} seller — "
            "elevated fraud risk; factor this into triage risk_score and recommended_action."
        )
    elif b_rank > s_rank and b_rank >= 3:
        lines.append(
            f"Note: Higher-tier buyer ({d.buyer_tier}) disputing lower-tier seller ({d.seller_tier}) — "
            "lower inherent fraud risk but still review carefully."
        )

    lines.append("--- End Tier Context ---\n")
    return "\n".join(lines)


def build_prompt(d: DisputeData) -> str:
    ocr_info = ""
    if d.ocr_extracted:
        ocr_info = f"""
OCR data extracted from uploaded receipt:
- Merchant: {d.ocr_extracted.get('merchant', 'N/A')}
- Amount: {d.ocr_extracted.get('amount', 'N/A')}
- Date: {d.ocr_extracted.get('date', 'N/A')}
- Reference: {d.ocr_extracted.get('reference', 'N/A')}
- Bank: {d.ocr_extracted.get('bank', 'N/A')}"""

    tier_info = _build_tier_context(d)

    return f"""Analyze this P2P crypto trading dispute:

Order ID: {d.order_id}
Buyer (initiating dispute): {d.buyer}
Seller (counterparty): {d.seller}
Amount: {d.amount_usd} USD / {d.amount_local} {d.local_currency}
Dispute reason: {d.reason}
Description: {d.description or 'Not provided'}
{ocr_info}
Chat summary: {d.chat_summary or 'P2P in-app chat available. Buyer reports seller was unresponsive after payment, suggested moving to WhatsApp, and sent messages asking buyer to cancel the order before payment was confirmed.'}
{tier_info}
Provide the full structured JSON analysis. Be realistic and data-driven. For the triage score, weigh: OCR match quality, 3-way match result, sentiment risk flags, dispute reason severity, AND tier context (tier mismatch, seller tenure, dispute-free history)."""


async def stream_analysis(dispute: DisputeData):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        yield f"data: {json.dumps({'error': 'ANTHROPIC_API_KEY not set'})}\n\n"
        return

    client = anthropic.Anthropic(api_key=api_key)

    # Send start event
    yield f"data: {json.dumps({'type': 'start'})}\n\n"

    full_text = ""
    try:
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=4096,
            thinking={"type": "enabled", "budget_tokens": 2000},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_prompt(dispute)}],
        ) as stream:
            for event in stream:
                # Stream thinking blocks so UI can show "thinking..."
                if hasattr(event, "type"):
                    if event.type == "content_block_start":
                        if hasattr(event, "content_block") and event.content_block.type == "thinking":
                            yield f"data: {json.dumps({'type': 'thinking_start'})}\n\n"
                    elif event.type == "content_block_delta":
                        delta = event.delta
                        if hasattr(delta, "type"):
                            if delta.type == "thinking_delta":
                                yield f"data: {json.dumps({'type': 'thinking', 'text': delta.thinking})}\n\n"
                            elif delta.type == "text_delta":
                                full_text += delta.text
                                yield f"data: {json.dumps({'type': 'text', 'text': delta.text})}\n\n"
                    elif event.type == "content_block_stop":
                        pass

        # Parse and emit final result
        # Extract JSON from the response (strip any accidental markdown fences)
        clean = full_text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip().rstrip("`").strip()

        try:
            result = json.loads(clean)
            yield f"data: {json.dumps({'type': 'result', 'data': result})}\n\n"
        except json.JSONDecodeError:
            yield f"data: {json.dumps({'type': 'raw', 'text': full_text})}\n\n"

    except anthropic.AuthenticationError:
        yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid API key'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@app.post("/api/analyze")
async def analyze_dispute(dispute: DisputeData):
    return StreamingResponse(
        stream_analysis(dispute),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "model": "claude-opus-4-6"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
