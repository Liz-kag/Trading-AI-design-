/**
 * DisputeFlowDemo — Full 5-step P2P Dispute flow for presentation
 * Based on Figma: https://www.figma.com/design/BRGt30RbFxWto4LXpiW8wW/P2P-Dispute-Flow
 */

import { useState, useEffect, useCallback } from "react";

// ─── Shared dispute state ─────────────────────────────────────────────────────
interface DisputeState {
  orderId: string;
  buyer: string;
  seller: string;
  amountUsd: number;
  amountLocal: number;
  localCurrency: string;
  reason: string;
  description: string;
}

const DEFAULT_DISPUTE: DisputeState = {
  orderId: "1270078",
  buyer: "user_7821",
  seller: "Rahul12",
  amountUsd: 5.0,
  amountLocal: 443.87,
  localCurrency: "INR",
  reason: "seller_no_release",
  description: "I transferred full amount on 4 Mar 16:18 IST but seller has not released crypto.",
};

// ─── AI Analysis types ────────────────────────────────────────────────────────
interface OcrResult {
  merchant_name: string; transaction_date: string; amount: string;
  reference_id: string; bank: string; status: string;
  confidence: number; verified: boolean;
}
interface MatchCheck { field: string; expected: string; found: string; passed: boolean; warning: boolean; }
interface ThreeWayResult {
  checks: MatchCheck[]; passed_count: number; total_count: number;
  verdict: string; payment_legitimate: boolean;
}
interface SentimentResult {
  urgency: number; frustration: number; trust: number;
  risk_flags: string[]; summary: string;
}
interface TriageResult {
  risk_score: number; priority: string; claim_validity_pct: number;
  urgency_level: string; seller_risk_score: number; buyer_history: string;
  similar_cases_pct: number; recommended_action: string;
  auto_resolve_eligible: boolean; auto_resolve_reason: string;
}
interface AnalysisResult {
  ocr: OcrResult; three_way_match: ThreeWayResult;
  sentiment: SentimentResult; triage: TriageResult; summary: string;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  coral: "#ff444f",
  coralLight: "#ff444f14",
  buy: "#00c390",
  sell: "#de0040",
  dark: "#181c25",
  surface: "#ffffff",
  frame: "#f6f7f8",
  border: "#00000014",
  borderMid: "#0000001f",
  text: "#181c25",
  textSub: "#0000007a",
  textMid: "#000000b8",
  textOnDark: "#ffffffb8",
  white: "#ffffff",
  overlay: "#00000066",
  green: "#00c390",
  greenBg: "#00883214",
  greenText: "#007a22",
  orangeBg: "#ff9c1314",
  orangeText: "#c47d00",
  redBg: "#ff444f14",
  redText: "#ff444f",
  blueBg: "#2c9aff14",
  blueText: "#0777c4",
  aiPurple: "#7c3aed",
  aiPurpleBg: "#7c3aed14",
};

const font = "Inter, -apple-system, sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, background: bg, color, fontSize: 11, fontWeight: 700, fontFamily: font }}>
      {label}
    </span>
  );
}


function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 16px 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? C.coral : C.borderMid, transition: "background 0.3s" }} />
      ))}
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 4px", fontSize: 12, fontWeight: 600, color: C.dark, fontFamily: font }}>
      <span>16:20</span>
      <span style={{ letterSpacing: 1 }}>▲▲▲ WiFi 🔋</span>
    </div>
  );
}

function PhoneShell({ children, step, totalSteps }: { children: React.ReactNode; step: number; totalSteps: number }) {
  return (
    <div style={{ width: 375, minHeight: 750, background: C.surface, borderRadius: 40, boxShadow: "0 24px 80px #0000003a, 0 0 0 8px #181c25", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Notch */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, background: C.dark, borderRadius: "0 0 16px 16px", zIndex: 10 }} />
      <div style={{ height: 28 }} />
      <StatusBar />
      <ProgressBar step={step} total={totalSteps} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─── STEP 1: Dispute Trigger ──────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const [timer, setTimer] = useState(5);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (timer <= 0) { setExpired(true); return; }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const fmt = (s: number) => `00:00:${String(s).padStart(2, "0")}`;

  const orders = [
    { type: "Buy", amount: "5.00 USD", local: "83,833.75 IDR", user: "Farid07", status: "Complete payment", timer: "00:59:59", disputable: false },
    { type: "Sell", amount: "5.00 USD", local: "14,500.00 IDR", user: "Jackson", status: "Confirm payment", timer: "00:20:58", disputable: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: font }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 24, padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, borderBottom: `2px solid ${C.coral}`, paddingBottom: 6 }}>Active</span>
        <span style={{ fontSize: 14, color: C.textSub, paddingBottom: 6 }}>Past</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Normal orders */}
        {orders.map((o, i) => (
          <div key={i} style={{ margin: "8px 12px", background: C.frame, borderRadius: 8, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Tag label={o.status} color={C.orangeText} bg={C.orangeBg} />
              <span style={{ fontSize: 12, color: C.textSub }}>{o.timer}</span>
            </div>
            <p style={{ margin: "4px 0", fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: o.type === "Buy" ? C.buy : C.sell }}>{o.type} </span>
              <span style={{ color: C.text }}>{o.amount}</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>You {o.type === "Buy" ? "pay" : "receive"}: {o.local} · {o.user}</p>
          </div>
        ))}

        {/* Disputable order */}
        <div style={{
          margin: "8px 12px", borderRadius: 8, padding: "12px 14px",
          background: expired ? "#fff5f5" : C.frame,
          border: `1px solid ${expired ? C.coral : C.border}`,
          boxShadow: expired ? `0 0 0 3px #ff444f22` : "none",
          transition: "all 0.4s ease"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Tag label="Waiting seller's confirmation" color={C.orangeText} bg={C.orangeBg} />
            <span style={{ fontSize: 12, fontWeight: 700, color: expired ? C.coral : C.textSub, transition: "color 0.3s" }}>
              {expired ? "00:00:00" : fmt(timer)}
            </span>
          </div>
          <p style={{ margin: "4px 0", fontSize: 15, fontWeight: 700 }}>
            <span style={{ color: C.buy }}>Buy </span>
            <span style={{ color: C.text }}>5.00 USD</span>
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textSub }}>You pay: 443.87 INR · Rahul12</p>

          {expired ? (
            <button onClick={onNext} style={{ width: "100%", height: 36, borderRadius: 12, background: "transparent", border: `1.5px solid ${C.coral}`, color: C.coral, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, animation: "pulse 1.5s infinite" }}>
              🚨 Raise a Dispute
            </button>
          ) : (
            <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: C.textSub }}>Timer expiring… dispute button unlocks at 0</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav bar */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 0", display: "flex", justifyContent: "space-around" }}>
        {["🏠 Home", "📊 Market", "📋 Orders", "📢 My ads", "👤 Profile"].map((label, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: i === 2 ? 1 : 0.4 }}>
            <span style={{ fontSize: 18 }}>{label.split(" ")[0]}</span>
            <span style={{ fontSize: 9, color: i === 2 ? C.coral : C.textSub, fontWeight: i === 2 ? 700 : 400 }}>{label.split(" ")[1]}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 #ff444f44} 50%{box-shadow:0 0 0 6px #ff444f00} }`}</style>
    </div>
  );
}

// ─── STEP 2: Evidence Form ────────────────────────────────────────────────────
function Step2({ onNext }: { onNext: () => void }) {
  const [reason, setReason] = useState<string | null>(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fileAdded, setFileAdded] = useState(false);

  const reasons = [
    { id: "seller_no_release", label: "Seller didn't release crypto", desc: "I've paid but seller hasn't released" },
    { id: "payment_not_received", label: "Payment not received", desc: "Buyer hasn't sent payment" },
    { id: "wrong_amount", label: "Wrong payment amount", desc: "Amount doesn't match agreed order" },
  ];

  function simulateUpload() {
    setFileAdded(true);
    setScanning(true);
    setTimeout(() => { setScanning(false); setOcrDone(true); }, 2200);
  }

  const canSubmit = reason !== null && ocrDone;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: font }}>
      {/* Dark header */}
      <div style={{ background: C.dark, padding: "14px 16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.white }}>Raise a Dispute</span>
          <Tag label="Under Dispute" color={C.orangeText} bg={C.orangeBg} />
        </div>
        <div style={{ background: "#ffffff0a", borderRadius: 8, padding: "10px 12px" }}>
          <span style={{ color: C.buy, fontWeight: 700, fontSize: 14 }}>Buy </span>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>5.00 USD</span>
          <span style={{ color: C.textOnDark, fontSize: 12 }}> · ID: 1270078</span>
          <div style={{ fontSize: 12, color: C.textOnDark, marginTop: 4 }}>You pay: <b style={{ color: "#ffffffcc" }}>443.87 INR</b> · Counterparty: <b style={{ color: "#ffffffcc" }}>Rahul12</b></div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: C.text }}>Select reason</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reasons.map(r => (
            <button key={r.id} onClick={() => setReason(r.id)} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
              background: reason === r.id ? C.coralLight : C.frame,
              border: `1.5px solid ${reason === r.id ? C.coral : C.border}`,
              borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: font, transition: "all 0.15s"
            }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${reason === r.id ? C.coral : C.borderMid}`, background: reason === r.id ? C.coral : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {reason === r.id && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.white }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.label}</div>
                <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <p style={{ margin: "14px 0 8px", fontSize: 13, fontWeight: 700, color: C.text }}>Upload evidence</p>

        {!fileAdded ? (
          <button onClick={simulateUpload} style={{ width: "100%", padding: "14px", border: `1.5px dashed ${C.coral}`, borderRadius: 8, background: C.coralLight, color: C.coral, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 20 }}>📎</span>
            <span>Tap to upload</span>
            <span style={{ fontSize: 11, color: C.textSub, fontWeight: 400 }}>Receipt, screenshot, bank statement · PDF, PNG, JPG</span>
          </button>
        ) : (
          <div style={{ border: `1.5px solid ${ocrDone ? C.green : C.border}`, borderRadius: 8, padding: "10px 12px", background: ocrDone ? C.greenBg : C.frame, transition: "all 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>payment_receipt.pdf</div>
                  <div style={{ fontSize: 11, color: C.textSub }}>249 KB</div>
                </div>
              </div>
              {scanning && <span style={{ fontSize: 11, color: C.blueText, fontWeight: 600, animation: "blink 0.8s infinite" }}>⏳ Scanning OCR…</span>}
              {ocrDone && <span style={{ fontSize: 11, color: C.greenText, fontWeight: 700 }}>✓ OCR Scanned</span>}
            </div>
            {ocrDone && (
              <div style={{ marginTop: 8, padding: "6px 8px", background: "#00883214", borderRadius: 4, fontSize: 11, color: C.greenText }}>
                ✓ Extracted: Rahul Kumar · ₹443.87 · 4 Mar 2026 · UTR4892761833
              </div>
            )}
          </div>
        )}

        <textarea placeholder="Describe the issue in detail…" rows={3} style={{ width: "100%", marginTop: 12, padding: "10px 12px", fontSize: 13, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, background: "#00000008", resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} defaultValue="I transferred full amount on 4 Mar 16:18 IST but seller has not released crypto." />

        <p style={{ fontSize: 11, color: C.textSub, margin: "6px 0 0" }}>Reviewed by our P2P team within 24 hrs.</p>
      </div>

      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
        <button style={{ flex: 1, height: 44, borderRadius: 22, border: `1px solid ${C.borderMid}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>Cancel</button>
        <button onClick={canSubmit ? onNext : undefined} style={{ flex: 1, height: 44, borderRadius: 22, border: "none", background: canSubmit ? C.coral : "#0000001f", color: canSubmit ? C.white : C.textSub, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: canSubmit ? "pointer" : "not-allowed", transition: "background 0.2s" }}>
          Submit Dispute
        </button>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─── STEP 3: Backend API + System Ticket ──────────────────────────────────────
function Step3({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<"loading" | "done">("loading");
  const steps = [
    { label: "User taps Submit", done: true },
    { label: "POST /dispute", done: true },
    { label: "Ticket Created", done: phase === "done" },
    { label: "OCR + Matching", done: false },
    { label: "Notifications Sent", done: false },
    { label: "Moderator Review", done: false },
  ];

  useEffect(() => {
    const t = setTimeout(() => setPhase("done"), 2000);
    return () => clearTimeout(t);
  }, []);

  if (phase === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: font, padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: `4px solid ${C.border}`, borderTop: `4px solid ${C.coral}`, animation: "spin 0.8s linear infinite" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Submitting dispute…</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSub }}>POST /v1/p2p/order/dispute/create</p>
        </div>
        <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", fontFamily: font, padding: "14px 16px" }}>
      {/* Pipeline */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <div style={{ padding: "4px 10px", borderRadius: 20, background: s.done ? C.coral : C.frame, border: `1px solid ${s.done ? C.coral : C.border}`, fontSize: 12, fontWeight: 700, color: s.done ? C.white : C.textSub, whiteSpace: "nowrap" }}>
              {i + 1} {s.label}
            </div>
            {i < steps.length - 1 && <span style={{ color: C.textSub, fontSize: 12 }}>→</span>}
          </div>
        ))}
      </div>

      {/* Success banner */}
      <div style={{ background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.greenText }}>Dispute submitted — TKT-89421</div>
          <div style={{ fontSize: 11, color: C.greenText }}>201 Created · DSP-2026-001270078</div>
        </div>
      </div>

      {/* Ticket */}
      <div style={{ border: `1px solid ${C.borderMid}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ background: C.dark, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>TKT-89421</span>
          <Tag label="Under Review" color={C.orangeText} bg={C.orangeBg} />
        </div>
        {[
          ["Dispute ID", "DSP-2026-001270078"],
          ["Order ID", "#1270078"],
          ["Initiated by", "Buyer — user_7821"],
          ["Counterparty", "Rahul12 — user_3340"],
          ["Amount", "5.00 USD / 443.87 INR"],
          ["Reason", "Seller didn't release crypto"],
          ["Evidence", "1 file · OCR ✓"],
          ["Triage score", "0.87 — High risk"],
          ["SLA deadline", "2026-03-05 16:20 UTC"],
          ["Assigned to", "P2P Disputes Team"],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.frame }}>
            <span style={{ fontSize: 11, color: C.textSub }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: k === "Triage score" ? C.coral : C.text, textAlign: "right", maxWidth: "60%" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: C.text }}>⚡ Notifications dispatched</p>
        {[
          { icon: "📧", to: "Buyer (user_7821)", msg: "Your dispute has been submitted", status: "Sent", color: C.greenText },
          { icon: "📧", to: "Seller (Rahul12)", msg: "Dispute raised. Respond within 24 hrs.", status: "Sent", color: C.greenText },
          { icon: "📱", to: "Buyer in-app", msg: "Dispute raised successfully · TKT-89421", status: "Sent", color: C.greenText },
          { icon: "💬", to: "P2P Disputes Team", msg: "HIGH priority triage score 0.87", status: "Queued", color: C.orangeText },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{n.to}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{n.msg}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: n.color }}>{n.status}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={{ width: "100%", height: 44, borderRadius: 22, border: "none", background: C.coral, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>
        View AI Analysis →
      </button>
    </div>
  );
}

// ─── STEP 4: AI Analysis (live) ───────────────────────────────────────────────
function Step4({ onNext, dispute }: { onNext: () => void; dispute: DisputeState }) {
  type Phase = "idle" | "thinking" | "streaming" | "done" | "error";
  const [phase, setPhase] = useState<Phase>("idle");
  const [thinkingText, setThinkingText] = useState("");
  const [rawBuffer, setRawBuffer] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"ocr" | "match" | "sentiment" | "triage">("ocr");

  // Editable fields before running
  const [desc, setDesc] = useState(dispute.description);
  const [chatHint, setChatHint] = useState(
    "Seller suggested moving to WhatsApp. Sent 3 messages asking buyer to cancel. Response time jumped from 2 min to 18 min."
  );

  const runAnalysis = useCallback(async () => {
    setPhase("thinking");
    setThinkingText("");
    setRawBuffer("");
    setResult(null);
    setErrMsg("");

    const payload = {
      order_id: dispute.orderId,
      buyer: dispute.buyer,
      seller: dispute.seller,
      amount_usd: dispute.amountUsd,
      amount_local: dispute.amountLocal,
      local_currency: dispute.localCurrency,
      reason: dispute.reason,
      description: desc,
      ocr_extracted: {
        merchant: dispute.seller,
        amount: `₹${dispute.amountLocal}`,
        date: "4 Mar 2026",
        reference: "UTR4892761833",
        bank: "HDFC Bank Ltd.",
      },
      chat_summary: chatHint,
      // Tier context — demo values matching the example case
      buyer_tier: "Bronze",
      seller_tier: "Gold",
      buyer_join_days: 12,
      seller_join_days: 210,
      buyer_lifetime_orders: 4,
      seller_lifetime_orders: 7340,
      buyer_dispute_free_days: 12,
      seller_dispute_free_days: 45,
    };

    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "thinking_start") setPhase("thinking");
            else if (ev.type === "thinking") setThinkingText(t => t + ev.text);
            else if (ev.type === "text") { setPhase("streaming"); setRawBuffer(b => b + ev.text); }
            else if (ev.type === "result") { setResult(ev.data); setPhase("done"); }
            else if (ev.type === "error") { setErrMsg(ev.message); setPhase("error"); }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Connection failed — is the API server running?");
      setPhase("error");
    }
  }, [dispute, desc, chatHint]);

  const priorityColor = (p: string) =>
    p === "HIGH" ? C.coral : p === "MEDIUM" ? C.orangeText : C.greenText;

  // ── Idle: input form ────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div style={{ flex: 1, overflowY: "auto", fontFamily: font, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>🤖</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>AI Analysis Pipeline</div>
            <div style={{ fontSize: 11, color: C.textSub }}>Powered by Claude claude-opus-4-6 · Extended Thinking</div>
          </div>
        </div>

        {/* Case summary */}
        <div style={{ background: C.frame, borderRadius: 10, padding: "12px 14px", marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Case Summary</div>
          {[
            ["Order", `#${dispute.orderId}`],
            ["Buyer", dispute.buyer],
            ["Seller", dispute.seller],
            ["Amount", `${dispute.amountUsd} USD / ${dispute.amountLocal} ${dispute.localCurrency}`],
            ["Reason", dispute.reason.replace(/_/g, " ")],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 11, color: C.textSub }}>{k}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Editable context */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.text, display: "block", marginBottom: 4 }}>Dispute description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, background: "#00000008", resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.text, display: "block", marginBottom: 4 }}>Chat context (for sentiment)</label>
          <textarea value={chatHint} onChange={e => setChatHint(e.target.value)} rows={2}
            style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, background: "#00000008", resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} />
        </div>

        <div style={{ padding: "10px 12px", background: C.aiPurpleBg, borderRadius: 8, marginBottom: 16, fontSize: 11, color: C.aiPurple, fontWeight: 600 }}>
          ✨ Claude will run OCR verification, 3-way matching, sentiment analysis, and predictive triage on this dispute.
        </div>

        <button onClick={runAnalysis} style={{ width: "100%", height: 48, borderRadius: 24, border: "none", background: `linear-gradient(135deg, ${C.aiPurple}, ${C.coral})`, color: C.white, fontSize: 15, fontWeight: 800, fontFamily: font, cursor: "pointer", letterSpacing: 0.3 }}>
          🤖 Run AI Analysis
        </button>
      </div>
    );
  }

  // ── Thinking / streaming ────────────────────────────────────────────────────
  if (phase === "thinking" || phase === "streaming") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: font, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.aiPurple}, ${C.coral})`, display: "flex", alignItems: "center", justifyContent: "center", animation: "spin 2s linear infinite" }}>
            <span style={{ fontSize: 18 }}>🤖</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
              {phase === "thinking" ? "Claude is thinking…" : "Generating analysis…"}
            </div>
            <div style={{ fontSize: 11, color: C.textSub }}>Extended thinking enabled · claude-opus-4-6</div>
          </div>
        </div>

        {phase === "thinking" && thinkingText && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", background: C.aiPurpleBg, borderRadius: 10, border: `1px solid ${C.aiPurple}33`, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.aiPurple, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>💭 Thinking</div>
            <div style={{ fontSize: 12, color: C.aiPurple, lineHeight: 1.6, whiteSpace: "pre-wrap", opacity: 0.85 }}>{thinkingText}</div>
          </div>
        )}

        {phase === "streaming" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", background: C.frame, borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>📋 Building result…</div>
            <pre style={{ fontSize: 9, color: C.textSub, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{rawBuffer}</pre>
          </div>
        )}

        {/* Pipeline progress indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { icon: "📄", label: "OCR Receipt Verification" },
            { icon: "⚖️", label: "Three-Way Matching" },
            { icon: "💬", label: "Chat Sentiment Analysis" },
            { icon: "🎯", label: "Predictive Triage Engine" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.frame, borderRadius: 8, opacity: phase === "streaming" ? 1 : 0.5, transition: "opacity 0.3s" }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 11, color: C.text, flex: 1 }}>{item.label}</span>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C.border}`, borderTop: `2px solid ${C.aiPurple}`, animation: "spin 0.8s linear infinite" }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: font, gap: 12 }}>
        <span style={{ fontSize: 36 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.coral, textAlign: "center" }}>Analysis failed</div>
        <div style={{ fontSize: 12, color: C.textSub, textAlign: "center", padding: "0 8px" }}>{errMsg}</div>
        <div style={{ fontSize: 11, color: C.textSub, background: C.frame, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          Make sure the API server is running:<br />
          <code style={{ color: C.coral, fontSize: 12 }}>python3 api.py</code>
        </div>
        <button onClick={() => setPhase("idle")} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: C.coral, color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>
          Try Again
        </button>
      </div>
    );
  }

  // ── Done: show results ───────────────────────────────────────────────────────
  const r = result!;
  const tabs = [
    { id: "ocr" as const, icon: "📄", label: "OCR" },
    { id: "match" as const, icon: "⚖️", label: "Match" },
    { id: "sentiment" as const, icon: "💬", label: "Sentiment" },
    { id: "triage" as const, icon: "🎯", label: "Triage" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: font }}>
      {/* Summary banner */}
      <div style={{ padding: "10px 14px", background: r.triage.priority === "HIGH" ? C.coralLight : C.greenBg, borderBottom: `1px solid ${r.triage.priority === "HIGH" ? C.coral : C.green}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${r.triage.priority === "HIGH" ? C.coral : C.green}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: r.triage.priority === "HIGH" ? C.coral : C.green, lineHeight: 1 }}>{r.triage.risk_score.toFixed(2)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: priorityColor(r.triage.priority) }}>{r.triage.priority} PRIORITY · {r.triage.claim_validity_pct}% valid</div>
          <div style={{ fontSize: 12, color: C.textSub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.summary}</div>
        </div>
        <Tag label={r.triage.priority} color={priorityColor(r.triage.priority)} bg={r.triage.priority === "HIGH" ? C.coralLight : C.greenBg} />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, border: "none", background: activeTab === t.id ? C.coralLight : "transparent", color: activeTab === t.id ? C.coral : C.textSub, borderBottom: activeTab === t.id ? `2px solid ${C.coral}` : "2px solid transparent", cursor: "pointer", fontFamily: font }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {/* OCR tab */}
        {activeTab === "ocr" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>📄 OCR Receipt Verification</span>
              <Tag label="Auto" color={C.blueText} bg={C.blueBg} />
            </div>
            {[
              ["Merchant name", r.ocr.merchant_name],
              ["Transaction date", r.ocr.transaction_date],
              ["Amount", r.ocr.amount],
              ["Reference ID", r.ocr.reference_id],
              ["Bank", r.ocr.bank],
              ["Status", r.ocr.status],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 11, color: C.textSub }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: k === "Status" && v === "SUCCESSFUL" ? C.greenText : C.text }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: "8px 10px", background: r.ocr.verified ? C.greenBg : C.redBg, borderRadius: 8, fontSize: 11, fontWeight: 700, color: r.ocr.verified ? C.greenText : C.redText }}>
              {r.ocr.verified ? "✓" : "✗"} OCR confidence: {r.ocr.confidence}% — {r.ocr.verified ? "All required fields extracted" : "Some fields missing"}
            </div>
          </div>
        )}

        {/* 3-Way Match tab */}
        {activeTab === "match" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>⚖️ Three-Way Matching</span>
              <Tag label="Auto" color={C.blueText} bg={C.blueBg} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 4, marginBottom: 8 }}>
              {["Field", "Expected", "Found", ""].map((h, i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>{h}</span>)}
            </div>
            {r.three_way_match.checks.map((ch, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 4, padding: "5px 0", borderBottom: i < r.three_way_match.checks.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 12, color: C.textSub }}>{ch.field}</span>
                <span style={{ fontSize: 12, color: C.text }}>{ch.expected}</span>
                <span style={{ fontSize: 12, color: C.text }}>{ch.found}</span>
                <span style={{ fontSize: 12 }}>{ch.passed ? "✓" : ch.warning ? "⚠️" : "✗"}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: "8px 10px", background: r.three_way_match.payment_legitimate ? C.greenBg : C.redBg, borderRadius: 8, fontSize: 11, fontWeight: 700, color: r.three_way_match.payment_legitimate ? C.greenText : C.redText }}>
              {r.three_way_match.passed_count}/{r.three_way_match.total_count} checks passed — {r.three_way_match.verdict}
            </div>
          </div>
        )}

        {/* Sentiment tab */}
        {activeTab === "sentiment" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>💬 Chat Sentiment Analysis</span>
              <Tag label="AI" color={C.aiPurple} bg={C.aiPurpleBg} />
            </div>
            {[
              ["Urgency", r.sentiment.urgency, C.coral],
              ["Frustration", r.sentiment.frustration, C.orangeText],
              ["Trust", r.sentiment.trust, C.green],
            ].map(([label, val, color], i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.textSub }}>{label as string}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: color as string }}>{val as number}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                  <div style={{ height: "100%", width: `${val}%`, borderRadius: 3, background: color as string, transition: "width 1s ease" }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 11, color: C.textMid, marginBottom: 8 }}>{r.sentiment.summary}</div>
            {r.sentiment.risk_flags.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.coral, marginBottom: 6 }}>🚩 Risk Flags Detected</div>
                {r.sentiment.risk_flags.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.textMid, padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: C.coral, flexShrink: 0 }}>●</span>{f}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Triage tab */}
        {activeTab === "triage" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: priorityColor(r.triage.priority) }}>🎯 Predictive Triage Engine</span>
              <Tag label="AI" color={C.aiPurple} bg={C.aiPurpleBg} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", border: `4px solid ${priorityColor(r.triage.priority)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: priorityColor(r.triage.priority), lineHeight: 1 }}>{r.triage.risk_score.toFixed(2)}</span>
                <span style={{ fontSize: 7, color: C.textSub }}>Risk Score</span>
              </div>
              <div>
                <Tag label={`${r.triage.priority} PRIORITY`} color={priorityColor(r.triage.priority)} bg={r.triage.priority === "HIGH" ? C.coralLight : C.greenBg} />
                <p style={{ margin: "6px 0 0", fontSize: 11, color: C.textSub }}>{r.triage.claim_validity_pct}% probability this claim is valid</p>
              </div>
            </div>
            {[
              ["Urgency level", r.triage.urgency_level, C.coral],
              ["Seller risk score", r.triage.seller_risk_score.toFixed(2), r.triage.seller_risk_score > 0.7 ? C.coral : C.orangeText],
              ["Buyer history", r.triage.buyer_history, C.greenText],
              ["Similar cases in buyer's favour", `${r.triage.similar_cases_pct}%`, C.greenText],
              ["Recommended action", r.triage.recommended_action, C.coral],
              ["Auto-resolve eligible", r.triage.auto_resolve_eligible ? "Yes" : "No — " + r.triage.auto_resolve_reason, r.triage.auto_resolve_eligible ? C.greenText : C.orangeText],
            ].map(([k, v, color], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none", gap: 8 }}>
                <span style={{ fontSize: 12, color: C.textSub, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: color as string, textAlign: "right" }}>{v as string}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={() => setPhase("idle")} style={{ height: 40, padding: "0 14px", borderRadius: 20, border: `1px solid ${C.border}`, background: "transparent", fontSize: 11, fontWeight: 700, color: C.textSub, fontFamily: font, cursor: "pointer" }}>
          ↺ Re-run
        </button>
        <button onClick={onNext} style={{ flex: 1, height: 40, borderRadius: 20, border: "none", background: C.coral, color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>
          Open AI Dashboard →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 5: Moderator Review + Notification ──────────────────────────────────
function Step5({ onRestart }: { onRestart: () => void }) {
  const [view, setView] = useState<"app" | "email">("app");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: font }}>
      {/* View switcher */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {(["app", "email"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "9px 0", fontSize: 11, fontWeight: 700, border: "none", background: view === v ? C.coralLight : "transparent", color: view === v ? C.coral : C.textSub, borderBottom: view === v ? `2px solid ${C.coral}` : "2px solid transparent", cursor: "pointer", fontFamily: font, textTransform: "capitalize" }}>
            {v === "app" ? "📱 In-App" : "📧 Email"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* In-app view */}
        {view === "app" && (
          <div style={{ padding: "12px 16px" }}>
            {/* In-app toast */}
            <div style={{ background: C.dark, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Dispute submitted — TKT-89421</div>
                <div style={{ fontSize: 11, color: "#ffffff99", marginTop: 2 }}>Our P2P team is reviewing your case. You'll hear back within 24 hours.</div>
                <div style={{ fontSize: 12, color: "#ffffff55", marginTop: 4 }}>Just now</div>
              </div>
            </div>

            {/* Updated order card */}
            <div style={{ background: "#fff5f5", border: `1px solid ${C.coral}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Tag label="Under Dispute" color={C.redText} bg={C.redBg} />
                <span style={{ fontSize: 11, color: C.textSub }}>TKT-89421</span>
              </div>
              <p style={{ margin: "4px 0", fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: C.buy }}>Buy </span>
                <span style={{ color: C.text }}>5.00 USD</span>
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textSub }}>You pay: 443.87 INR · Rahul12</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: C.coralLight, borderRadius: 6 }}>
                <span style={{ fontSize: 14 }}>🔍</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.coral }}>Under moderator review</div>
                  <div style={{ fontSize: 12, color: C.textSub }}>Expected decision: within 24 hrs</div>
                </div>
              </div>
              <button style={{ width: "100%", marginTop: 10, height: 36, borderRadius: 10, border: `1px solid ${C.borderMid}`, background: "transparent", fontSize: 12, fontWeight: 700, color: C.text, fontFamily: font, cursor: "pointer" }}>
                View Dispute Details →
              </button>
            </div>

            <button onClick={onRestart} style={{ width: "100%", height: 40, borderRadius: 20, border: `1px solid ${C.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: C.textSub, fontFamily: font, cursor: "pointer" }}>
              Restart from Step 1
            </button>
          </div>
        )}

        {/* Email */}
        {view === "email" && (
          <div style={{ padding: "12px 16px", fontSize: 12, fontFamily: font }}>
            <div style={{ background: C.frame, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              <div style={{ color: C.textSub, marginBottom: 2 }}>From: <span style={{ color: C.text }}>disputes@deriv.com</span></div>
              <div style={{ color: C.textSub, marginBottom: 2 }}>To: <span style={{ color: C.text }}>buyer@email.com</span></div>
              <div style={{ color: C.textSub, fontWeight: 700 }}>Your dispute has been submitted — Ref: TKT-89421</div>
            </div>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: C.coral, padding: "16px 20px" }}>
                <div style={{ color: C.white, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>derivP2P</div>
              </div>
              <div style={{ padding: "20px", background: C.surface }}>
                <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: C.text }}>Dispute Submitted</h2>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: C.textSub }}>Hi <b style={{ color: C.text }}>user_7821</b>, your dispute for Order <b style={{ color: C.text }}>#1270078</b> has been received and is now under review by our P2P team.</p>
                {[
                  ["Ticket ID", "TKT-89421"],
                  ["Order", "#1270078 · Buy 5.00 USD"],
                  ["Reason", "Seller didn't release crypto"],
                  ["Submitted", "4 Mar 2026, 16:20 UTC"],
                  ["Expected resolution", "Within 24 hours"],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 11, color: C.textSub }}>{k}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: i === 4 ? C.greenText : C.text }}>{v}</span>
                  </div>
                ))}
                <p style={{ margin: "12px 0", fontSize: 11, color: C.textSub }}>Our moderators are reviewing the evidence and chat logs. You may be contacted if additional information is required. <b>Do not cancel the order</b> while the dispute is active.</p>
                <button style={{ width: "100%", height: 40, borderRadius: 20, border: "none", background: C.coral, color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>Track Dispute Status →</button>
              </div>
              <div style={{ background: C.frame, padding: "10px 20px", textAlign: "center", fontSize: 12, color: C.textSub }}>
                © 2026 Deriv P2P · disputes@deriv.com · Unsubscribe
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Dispute Trigger" },
  { num: 2, label: "Evidence Form" },
  { num: 3, label: "Ticket Created" },
  { num: 4, label: "AI Analysis" },
  { num: 5, label: "Moderator Review" },
];

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DisputeFlowDemo() {
  const [step, setStep] = useState(1);

  const goTo = (n: number) => setStep(n);
  const next = () => setStep(s => Math.min(s + 1, 5));
  const restart = () => setStep(1);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 16px 48px", fontFamily: font }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: -0.5 }}>P2P Dispute Flow</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#ffffff55" }}>Interactive demo — step through the full process</p>
      </div>

      {/* Step nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {STEPS.map(s => (
          <button key={s.num} onClick={() => goTo(s.num)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${step === s.num ? C.coral : "#ffffff22"}`, background: step === s.num ? C.coral : step > s.num ? "#ffffff11" : "transparent", color: step >= s.num ? C.white : "#ffffff44", fontSize: 11, fontWeight: 700, fontFamily: font, cursor: "pointer", transition: "all 0.2s" }}>
            {s.num}. {s.label}
          </button>
        ))}
      </div>

      {/* Phone */}
      <PhoneShell step={step} totalSteps={5}>
        {step === 1 && <Step1 onNext={next} />}
        {step === 2 && <Step2 onNext={next} />}
        {step === 3 && <Step3 onNext={next} />}
        {step === 4 && <Step4 onNext={next} dispute={DEFAULT_DISPUTE} />}
        {step === 5 && <Step5 onRestart={restart} />}
      </PhoneShell>

      <p style={{ marginTop: 20, fontSize: 11, color: "#ffffff33" }}>
        Step {step} of 5 — {STEPS[step - 1].label}
      </p>
    </div>
  );
}
