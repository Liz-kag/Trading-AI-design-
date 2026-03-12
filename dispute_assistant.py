#!/usr/bin/env python3
"""
Dispute Assistant - Automated Credit/Billing Dispute Handler
Powered by Claude claude-opus-4-6 with adaptive thinking
"""

import os
import sys
import anthropic

SYSTEM_PROMPT = """You are an expert Dispute Assistant specializing in credit and billing disputes.
When given dispute details, provide a comprehensive analysis using this exact format:

## 1. DISPUTE CLASSIFICATION
- **Category**: [e.g., Unauthorized Charge, Billing Error, Duplicate Charge, Subscription Fraud, etc.]
- **Priority**: [High / Medium / Low] — with a one-line reason
- **Route To**: [e.g., Fraud Team, Billing Department, Chargeback Team, Customer Service]
- **Applicable Regulation**: [e.g., FCBA, Reg E, UDAAP, or "None identified"]

## 2. DISPUTE ANALYSIS
Provide a thorough analysis covering:
- Key facts and issues identified
- Strength of the dispute case (Weak / Moderate / Strong) with reasoning
- Any red flags or missing information that could affect the outcome

## 3. SUGGESTED RESOLUTIONS
List 3–5 concrete, numbered action steps the customer should take, in order of priority.
Include specific deadlines where applicable (e.g., "File chargeback within 60 days per FCBA").

## 4. FORMAL DISPUTE LETTER
Generate a professional, ready-to-send dispute letter. Include:
- Date placeholder: [DATE]
- Appropriate salutation and closing
- Reference to relevant consumer protection law where applicable
- Clear demand/request
- Professional tone

---
If information is missing, make reasonable assumptions and note them clearly."""


def collect_dispute_info() -> dict:
    """Collect dispute information interactively from the user."""
    print("\n" + "=" * 62)
    print("   DISPUTE ASSISTANT — Credit/Billing Dispute Analyzer")
    print("=" * 62)
    print("\nEnter dispute details below. Press Ctrl+C to quit.\n")

    info = {}

    info["customer_name"] = input("Customer Name: ").strip()
    info["account_number"] = input("Account/Card Number (last 4 digits only): ").strip()
    info["disputed_amount"] = input("Disputed Amount (e.g. 49.99): $").strip()
    info["merchant_name"] = input("Merchant / Vendor Name: ").strip()
    info["transaction_date"] = input("Transaction Date (MM/DD/YYYY): ").strip()

    print("\nDescribe the dispute in detail.")
    print("(Enter a blank line when finished)\n")
    lines = []
    while True:
        line = input()
        if line == "":
            break
        lines.append(line)
    info["description"] = "\n".join(lines)

    info["previous_contact"] = input(
        "\nHave you already contacted the merchant or bank? (yes / no): "
    ).strip().lower()

    if info["previous_contact"] in ("yes", "y"):
        info["contact_outcome"] = input("What was the outcome of that contact? ").strip()
    else:
        info["contact_outcome"] = ""

    return info


def format_prompt(info: dict) -> str:
    """Build the user-facing prompt from collected dispute info."""
    contact_line = ""
    if info.get("previous_contact") in ("yes", "y"):
        contact_line = (
            f"\n**Previous Contact Outcome:** {info.get('contact_outcome', 'Not specified')}"
        )

    return f"""Please analyze this credit/billing dispute:

**Customer Name:** {info.get('customer_name') or 'Not provided'}
**Account (last 4):** {info.get('account_number') or 'Not provided'}
**Disputed Amount:** ${info.get('disputed_amount') or 'Not provided'}
**Merchant / Vendor:** {info.get('merchant_name') or 'Not provided'}
**Transaction Date:** {info.get('transaction_date') or 'Not provided'}
**Previously Contacted Merchant/Bank:** {info.get('previous_contact', 'no').capitalize()}{contact_line}

**Dispute Description:**
{info.get('description') or 'No description provided.'}
"""


def run():
    """Main entry point for the Dispute Assistant."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\nError: ANTHROPIC_API_KEY is not set.")
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    while True:
        # --- Collect dispute info ---
        try:
            dispute_info = collect_dispute_info()
        except KeyboardInterrupt:
            print("\n\nExiting. Goodbye!")
            sys.exit(0)

        user_prompt = format_prompt(dispute_info)

        print("\n" + "=" * 62)
        print("   ANALYZING DISPUTE  (this may take a moment…)")
        print("=" * 62 + "\n")

        # --- Call Claude with adaptive thinking + streaming ---
        try:
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=8192,
                thinking={"type": "adaptive"},
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            ) as stream:
                for text in stream.text_stream:
                    print(text, end="", flush=True)
                final = stream.get_final_message()

            print(f"\n\n{'=' * 62}")
            print(
                f"Done — {final.usage.input_tokens} input tokens / "
                f"{final.usage.output_tokens} output tokens used."
            )
            print("=" * 62)

        except anthropic.AuthenticationError:
            print("\nError: Invalid API key. Check your ANTHROPIC_API_KEY.")
            sys.exit(1)
        except anthropic.RateLimitError:
            print("\nError: Rate limit reached. Please wait a moment and try again.")
            sys.exit(1)
        except anthropic.APIConnectionError:
            print("\nError: Could not connect to the API. Check your internet connection.")
            sys.exit(1)
        except anthropic.APIStatusError as e:
            print(f"\nAPI error ({e.status_code}): {e.message}")
            sys.exit(1)

        # --- Loop or exit ---
        print()
        try:
            again = input("Analyze another dispute? (yes / no): ").strip().lower()
        except KeyboardInterrupt:
            print("\nGoodbye!")
            sys.exit(0)

        if again not in ("yes", "y"):
            print("Goodbye!")
            break


if __name__ == "__main__":
    run()
