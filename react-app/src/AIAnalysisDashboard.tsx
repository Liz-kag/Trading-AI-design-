/**
 * AIAnalysisDashboard — Investigator split-screen layout
 * Left: Case file (order + OCR + evidence + timeline)
 * Right: Triage verdict hero → 3-Way Match table → Sentiment summary
 */

import { useState, useCallback } from "react";

const font = "Inter, -apple-system, sans-serif";

const C = {
  coral:      "#ff444f",
  coralLight: "#fff1f1",
  coralBorder:"#ffcdd0",
  green:      "#00c390",
  greenLight: "#f0fdf4",
  greenBorder:"#86efac",
  greenText:  "#166534",
  orange:     "#f59e0b",
  orangeLight:"#fffbeb",
  orangeText: "#92400e",
  blue:       "#3b82f6",
  blueLight:  "#eff6ff",
  blueText:   "#1e40af",
  purple:     "#7c3aed",
  purpleLight:"#f5f3ff",
  purpleBorder:"#c4b5fd",
  text:       "#111827",
  textMid:    "#374151",
  textSub:    "#6b7280",
  textLight:  "#9ca3af",
  border:     "#e5e7eb",
  borderMid:  "#d1d5db",
  frame:      "#f9fafb",
  surface:    "#ffffff",
  dark:       "#111827",
  white:      "#ffffff",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  ocr: {
    merchant_name: string; transaction_date: string; amount: string;
    reference_id: string; bank: string; status: string;
    confidence: number; verified: boolean;
  };
  three_way_match: {
    checks: { field: string; expected: string; found: string; passed: boolean; warning: boolean }[];
    passed_count: number; total_count: number; verdict: string; payment_legitimate: boolean;
  };
  sentiment: {
    urgency: number; frustration: number; trust: number;
    risk_flags: string[]; summary: string;
  };
  triage: {
    risk_score: number; priority: string; claim_validity_pct: number;
    urgency_level: string; seller_risk_score: number; buyer_history: string;
    similar_cases_pct: number; recommended_action: string;
    auto_resolve_eligible: boolean; auto_resolve_reason: string;
  };
  summary: string;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 12, mt = 0 }: { w?: string | number; h?: number; mt?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, marginTop: mt, background: "linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s infinite" }} />
  );
}

// ─── Pill badge ────────────────────────────────────────────────────────────────
function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700, border: border ? `1px solid ${border}` : "none", letterSpacing: 0.2 }}>
      {label}
    </span>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ icon, title, badge }: { icon: string; title: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span>
      {badge}
    </div>
  );
}

function AutoBadge() {
  return <Badge label="Auto" color={C.blueText} bg={C.blueLight} />;
}
function AIBadge() {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 4, background: C.dark, color: C.white, fontSize: 10, fontWeight: 700 }}>AI</span>;
}

// ─── Divider ───────────────────────────────────────────────────────────────────
function Divider({ my = 16 }: { my?: number }) {
  return <div style={{ height: 1, background: C.border, margin: `${my}px 0` }} />;
}

// ─── Left panel: Case File ─────────────────────────────────────────────────────
function CaseFilePanel({ ocr, loading }: { ocr: AnalysisResult["ocr"] | null; loading: boolean }) {
  const timelineEvents = [
    { time: "16:05", label: "Seller suggests WhatsApp", flag: true },
    { time: "16:10", label: "Seller sends cancel request ×3", flag: true },
    { time: "16:18", label: "Buyer confirms payment sent", flag: false },
    { time: "16:20", label: "Timer expires — dispute unlocked", flag: false },
    { time: "16:20", label: "Buyer raises dispute", flag: false },
  ];

  return (
    <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0 }}>
      {/* ── Order summary ── */}
      <div style={{ background: C.dark, padding: "20px 20px 16px", borderRadius: "12px 12px 0 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Case File</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 2 }}>Order #1270078</div>
        <div style={{ fontSize: 12, color: "#ffffff66", marginBottom: 14 }}>DSP-2026-001270078 · TKT-89421</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["Buyer", "user_7821"],
            ["Seller", "Rahul12 (user_3340)"],
            ["Amount", "5.00 USD / ₹443.87"],
            ["Reason", "Seller didn't release crypto"],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#ffffff55" }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffffcc", textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
          <Badge label="Under Dispute" color={C.orange} bg="#f59e0b22" />
          <Badge label="HIGH" color={C.coral} bg="#ff444f22" />
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "0 0 4px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── OCR receipt data ── */}
        <div style={{ padding: "16px 20px" }}>
          <SectionHead icon="📄" title="Receipt (OCR Verified)" badge={<AutoBadge />} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: C.frame, borderRadius: 8, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ width: 28, height: 28, background: C.border, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>📄</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>payment_receipt.pdf</div>
              <div style={{ fontSize: 10, color: C.textSub }}>248 KB · Scanned 2026-03-04 16:20:03</div>
            </div>
            {loading
              ? <div style={{ marginLeft: "auto", width: 10, height: 10, borderRadius: "50%", border: `2px solid ${C.border}`, borderTop: `2px solid ${C.blue}`, animation: "spin 0.8s linear infinite" }} />
              : <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: C.greenText }}>✓</span>
            }
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <Skeleton w={80} h={10} />
                  <Skeleton w={110} h={10} />
                </div>
              ))}
            </div>
          ) : ocr ? (
            <div>
              {[
                ["Merchant", ocr.merchant_name, C.coral],
                ["Date", ocr.transaction_date, C.text],
                ["Amount", ocr.amount, C.coral],
                ["Reference", ocr.reference_id, C.text],
                ["Bank", ocr.bank, C.text],
                ["Status", ocr.status, ocr.status === "SUCCESSFUL" ? C.greenText : C.coral],
              ].map(([k, v, color], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.textSub }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: color as string }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: "6px 10px", background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: C.greenText }}>
                ✓ {ocr.confidence}% confidence — All fields extracted
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.textLight, textAlign: "center", padding: "12px 0" }}>Run analysis to verify receipt</div>
          )}
        </div>

        <Divider my={0} />

        {/* ── Evidence files ── */}
        <div style={{ padding: "14px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Evidence</div>
          {[
            { icon: "📄", name: "payment_receipt.pdf", tag: "OCR ✓", tagColor: C.greenText, tagBg: C.greenLight },
            { icon: "💬", name: "P2P chat logs", tag: "Auto-attached", tagColor: C.blueText, tagBg: C.blueLight },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{f.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: f.tagColor, background: f.tagBg, padding: "2px 6px", borderRadius: 4 }}>{f.tag}</span>
            </div>
          ))}
        </div>

        <Divider my={0} />

        {/* ── Chat timeline ── */}
        <div style={{ padding: "14px 20px", flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Chat Timeline</div>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 1, background: C.border }} />
            {timelineEvents.map((e, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                <div style={{ position: "absolute", left: -20, top: 3, width: 8, height: 8, borderRadius: "50%", background: e.flag ? C.coral : C.border, border: `2px solid ${e.flag ? C.coral : C.borderMid}` }} />
                <div style={{ fontSize: 10, color: C.textLight, marginBottom: 1 }}>{e.time}</div>
                <div style={{ fontSize: 12, color: e.flag ? C.coral : C.textMid, fontWeight: e.flag ? 600 : 400 }}>{e.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Escalation modal ─────────────────────────────────────────────────────────
const ESCALATION_REASONS = [
  { id: "off_platform", label: "Off-platform communication attempt", severity: "critical" },
  { id: "high_seller_risk", label: "High seller risk score (≥ 0.80)", severity: "high" },
  { id: "pattern_fraud", label: "Matches known fraud pattern", severity: "critical" },
  { id: "insufficient_evidence", label: "Insufficient evidence for auto-resolution", severity: "medium" },
  { id: "repeat_offender", label: "Seller has prior dispute history", severity: "high" },
  { id: "large_amount", label: "High-value transaction requires senior review", severity: "medium" },
];

const ASSIGNEES = [
  { id: "senior_mod", label: "Senior Moderator", avatar: "👩‍💼" },
  { id: "fraud_team", label: "Fraud Investigation Team", avatar: "🔍" },
  { id: "legal", label: "Legal & Compliance", avatar: "⚖️" },
  { id: "risk_ops", label: "Risk Operations", avatar: "🛡️" },
];

function EscalationModal({ ticketId, triageScore, onClose }: {
  ticketId: string;
  triageScore: number;
  onClose: () => void;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>(["off_platform", "high_seller_risk"]);
  const [priority, setPriority] = useState<"critical" | "high" | "medium">("critical");
  const [assignee, setAssignee] = useState("senior_mod");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<"form" | "submitting" | "done">("form");

  function toggleReason(id: string) {
    setSelectedReasons(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }

  async function submit() {
    setPhase("submitting");
    await new Promise(r => setTimeout(r, 1800));
    setPhase("done");
  }

  const priorityMeta = {
    critical: { color: C.coral,  bg: C.coralLight,  border: C.coralBorder,  label: "Critical — SLA 2 hrs"  },
    high:     { color: "#d97706", bg: C.orangeLight, border: "#fcd34d",      label: "High — SLA 4 hrs"      },
    medium:   { color: C.blueText, bg: C.blueLight,  border: "#93c5fd",      label: "Medium — SLA 24 hrs"   },
  };
  const pm = priorityMeta[priority];

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 50 }} />

      {/* Modal */}
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 51, width: 560, maxHeight: "90vh", background: C.surface, borderRadius: 16, boxShadow: "0 24px 64px #00000033", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}>

        {/* Header */}
        <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 2 }}>↑ Escalate Dispute</div>
            <div style={{ fontSize: 12, color: C.textSub }}>{ticketId} · Risk score {triageScore.toFixed(2)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: C.textSub, cursor: "pointer", padding: "2px 6px", borderRadius: 6 }}>✕</button>
        </div>

        {phase === "done" ? (
          /* ── Confirmation ── */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.coralLight, border: `2px solid ${C.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>↑</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>Escalated successfully</div>
              <div style={{ fontSize: 13, color: C.textSub }}>Ticket {ticketId} has been escalated to <b style={{ color: C.text }}>{ASSIGNEES.find(a => a.id === assignee)?.label}</b></div>
            </div>
            <div style={{ width: "100%", background: C.frame, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
              {[
                ["Escalation ID",  `ESC-${Date.now().toString().slice(-6)}`],
                ["Priority",       pm.label],
                ["Assigned to",    ASSIGNEES.find(a => a.id === assignee)?.label ?? ""],
                ["Reasons",        `${selectedReasons.length} selected`],
                ["SLA deadline",   priority === "critical" ? "Within 2 hours" : priority === "high" ? "Within 4 hours" : "Within 24 hours"],
                ["Notification",   "Sent to assignee + Slack alert"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.textSub }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ width: "100%", height: 42, borderRadius: 10, border: "none", background: C.coral, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>
              Done
            </button>
          </div>

        ) : phase === "submitting" ? (
          /* ── Submitting ── */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.coral}`, animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Escalating dispute…</div>
            <div style={{ fontSize: 12, color: C.textSub }}>Notifying {ASSIGNEES.find(a => a.id === assignee)?.label}</div>
          </div>

        ) : (
          /* ── Form ── */
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

            {/* AI context banner */}
            <div style={{ padding: "10px 14px", background: C.coralLight, border: `1px solid ${C.coralBorder}`, borderRadius: 10, marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🤖</span>
              <div style={{ fontSize: 12, color: C.coral, lineHeight: 1.6 }}>
                <b>AI recommends escalation.</b> Risk score {triageScore.toFixed(2)} (HIGH), off-platform communication detected, seller risk 0.82. Auto-resolution not eligible.
              </div>
            </div>

            {/* Reasons */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Escalation reasons <span style={{ color: C.coral }}>*</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {ESCALATION_REASONS.map(r => {
                  const checked = selectedReasons.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => toggleReason(r.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${checked ? C.coral : C.border}`, background: checked ? C.coralLight : C.surface, cursor: "pointer", textAlign: "left", fontFamily: font, transition: "all 0.15s" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? C.coral : C.borderMid}`, background: checked ? C.coral : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {checked && <span style={{ color: C.white, fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{r.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: r.severity === "critical" ? C.coralLight : r.severity === "high" ? C.orangeLight : C.blueLight, color: r.severity === "critical" ? C.coral : r.severity === "high" ? C.orangeText : C.blueText }}>
                        {r.severity}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Escalation priority</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["critical", "high", "medium"] as const).map(p => {
                  const m = priorityMeta[p];
                  const sel = priority === p;
                  return (
                    <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: `1.5px solid ${sel ? m.color : C.border}`, background: sel ? m.bg : C.surface, cursor: "pointer", fontFamily: font, transition: "all 0.15s" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? m.color : C.textSub, textTransform: "capitalize" }}>{p}</div>
                      <div style={{ fontSize: 10, color: sel ? m.color : C.textLight, marginTop: 2 }}>{p === "critical" ? "SLA 2 hrs" : p === "high" ? "SLA 4 hrs" : "SLA 24 hrs"}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignee */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Assign to</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ASSIGNEES.map(a => {
                  const sel = assignee === a.id;
                  return (
                    <button key={a.id} onClick={() => setAssignee(a.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${sel ? C.coral : C.border}`, background: sel ? C.coralLight : C.surface, cursor: "pointer", fontFamily: font, transition: "all 0.15s" }}>
                      <span style={{ fontSize: 18 }}>{a.avatar}</span>
                      <span style={{ fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? C.coral : C.text }}>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Additional notes <span style={{ color: C.textLight, fontWeight: 400 }}>(optional)</span></div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add context for the assigned team…" rows={3}
                style={{ width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, background: C.frame, resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} />
            </div>
          </div>
        )}

        {/* Footer */}
        {phase === "form" && (
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: C.textSub, fontFamily: font, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={submit} disabled={selectedReasons.length === 0} style={{ flex: 2, height: 42, borderRadius: 10, border: "none", background: selectedReasons.length > 0 ? C.coral : "#0000001f", color: selectedReasons.length > 0 ? C.white : C.textSub, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: selectedReasons.length > 0 ? "pointer" : "not-allowed", transition: "background 0.2s" }}>
              ↑ Confirm Escalation
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Right panel: AI Findings ──────────────────────────────────────────────────
function FindingsPanel({
  triage, match, sentiment, loading, onRun, onRerun
}: {
  triage: AnalysisResult["triage"] | null;
  match: AnalysisResult["three_way_match"] | null;
  sentiment: AnalysisResult["sentiment"] | null;
  loading: boolean;
  onRun: () => void;
  onRerun: () => void;
}) {
  const [showEscalation, setShowEscalation] = useState(false);
  const isHigh = triage?.priority === "HIGH";
  const priorityColor = triage?.priority === "HIGH" ? C.coral : triage?.priority === "MEDIUM" ? C.orange : C.green;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

      {/* ── Moderator Ticket ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Moderator Dashboard — New Ticket</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>TKT-89421 <span style={{ fontWeight: 400, fontSize: 13, color: C.textSub }}>DSP-2026-001270078</span></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Badge label="HIGH" color={C.coral} bg={C.coralLight} border={C.coralBorder} />
            <Badge label="Under Review" color="#92400e" bg="#fef3c7" border="#fcd34d" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ padding: "10px 14px", background: C.frame, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textSub, marginBottom: 3 }}>Amount in Dispute</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>5.00 USD / ₹443.87</div>
          </div>
          <div style={{ padding: "10px 14px", background: C.coralLight, borderRadius: 8, border: `1px solid ${C.coralBorder}` }}>
            <div style={{ fontSize: 11, color: C.textSub, marginBottom: 3 }}>SLA Deadline</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.coral }}>5 Mar 2026, 16:20 UTC</div>
          </div>
          <div style={{ padding: "10px 14px", background: C.coralLight, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textSub, marginBottom: 3 }}>Triage Score</div>
            {loading ? <Skeleton w="60%" h={12} mt={2} /> : <div style={{ fontSize: 15, fontWeight: 700, color: C.coral }}>{triage ? `${triage.risk_score.toFixed(2)} — Valid (${triage.claim_validity_pct}%)` : "0.87 — Valid (91%)"}</div>}
          </div>
          <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: `1px solid #fcd34d` }}>
            <div style={{ fontSize: 11, color: C.textSub, marginBottom: 3 }}>Sentiment Flags</div>
            {loading ? <Skeleton w="70%" h={12} mt={2} /> : <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>{sentiment && sentiment.risk_flags.length > 0 ? `${sentiment.risk_flags[0]} ▶` : "Off-platform attempt ▶"}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Evidence Attached</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["📄 payment_receipt.pdf OCR ✓", "💬 Chat logs auto-attached", "⚖️ 3-way match: 3/5 pass"].map((e, i) => (
              <span key={i} style={{ padding: "5px 10px", background: C.frame, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text }}>{e}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: "#00c390", color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>✓ Resolve — Buyer</button>
          <button onClick={() => setShowEscalation(true)} style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: C.coral, color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>↑ Escalate</button>
          <button style={{ height: 42, padding: "0 16px", borderRadius: 10, border: `1px solid ${C.borderMid}`, background: "transparent", fontSize: 13, fontWeight: 700, color: C.textSub, fontFamily: font, cursor: "pointer" }}>Request Info</button>
        </div>
      </div>

      {/* ── Triage hero ── */}
      <div style={{ background: C.surface, border: `2px solid ${loading ? C.border : isHigh ? C.coral : C.greenBorder}`, borderRadius: 12, padding: "20px 24px", transition: "border-color 0.4s" }}>
        {loading ? (
          <div>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
              <Skeleton w={80} h={80} />
              <div style={{ flex: 1 }}>
                <Skeleton w={120} h={16} />
                <Skeleton w="90%" h={11} mt={8} />
                <Skeleton w="70%" h={11} mt={6} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h={32} />)}
            </div>
          </div>
        ) : triage ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
              {/* Score ring */}
              <div style={{ flexShrink: 0, width: 88, height: 88, borderRadius: "50%", border: `4px solid ${isHigh ? C.coral : C.green}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: isHigh ? C.coralLight : C.greenLight }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: isHigh ? C.coral : C.greenText, lineHeight: 1 }}>{triage.risk_score.toFixed(2)}</span>
                <span style={{ fontSize: 9, color: C.textSub, marginTop: 2, letterSpacing: 0.3 }}>RISK SCORE</span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: priorityColor }}>{triage.priority} PRIORITY</span>
                  <AIBadge />
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                  Based on historical patterns, this dispute has a{" "}
                  <b style={{ color: C.coral }}>{triage.claim_validity_pct}% probability</b> of being valid (buyer paid, seller withholding).
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, height: 38, borderRadius: 8, border: "none", background: C.green, color: C.white, fontSize: 12, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>✓ Resolve — Buyer</button>
                  <button onClick={() => setShowEscalation(true)} style={{ flex: 1, height: 38, borderRadius: 8, border: "none", background: C.coral, color: C.white, fontSize: 12, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>↑ Escalate</button>
                  <button style={{ height: 38, padding: "0 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", fontSize: 12, fontWeight: 600, color: C.textSub, fontFamily: font, cursor: "pointer" }}>Request Info</button>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Claim validity", value: `${triage.claim_validity_pct}%`, sub: "Valid", color: C.greenText, bg: C.greenLight },
                { label: "Urgency", value: triage.urgency_level.split("(")[0].trim(), sub: triage.urgency_level.includes("(") ? triage.urgency_level.split("(")[1].replace(")", "") : "", color: C.coral, bg: C.coralLight },
                { label: "Seller risk", value: triage.seller_risk_score.toFixed(2), sub: "High", color: C.coral, bg: C.coralLight },
                { label: "Buyer history", value: "Clean", sub: triage.buyer_history.replace("Clean — ", ""), color: C.greenText, bg: C.greenLight },
                { label: "Similar cases", value: `${triage.similar_cases_pct}%`, sub: "Buyer's favour", color: C.blueText, bg: C.blueLight },
                { label: "Auto-resolve", value: triage.auto_resolve_eligible ? "Yes" : "No", sub: triage.auto_resolve_reason || "Manual review", color: C.orangeText, bg: C.orangeLight },
              ].map((s, i) => (
                <div key={i} style={{ padding: "10px 12px", background: s.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.textSub, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: "8px 12px", background: C.frame, borderRadius: 8, fontSize: 12, color: C.textMid }}>
              <b style={{ color: C.text }}>Recommended:</b> {triage.recommended_action}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "24px 0" }}>
            <div style={{ fontSize: 40 }}>🤖</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>AI Analysis Pipeline</div>
              <div style={{ fontSize: 12, color: C.textSub }}>OCR · 3-way match · Sentiment · Triage<br />all run in parallel on submission</div>
            </div>
            <button onClick={onRun} style={{ padding: "10px 28px", borderRadius: 24, border: "none", background: `linear-gradient(135deg,${C.purple},${C.coral})`, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer", boxShadow: "0 4px 16px #7c3aed33" }}>
              🤖 Run AI Analysis
            </button>
          </div>
        )}
      </div>

      {/* ── 3-Way Match table ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
        <SectionHead icon="⚖️" title="Three-Way Matching" badge={<AutoBadge />} />
        <p style={{ margin: "-8px 0 12px", fontSize: 12, color: C.textSub }}>Compares OCR data against Order ID and Seller's stored bank details</p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px", gap: 12 }}>
              {["FIELD", "EXPECTED (ORDER)", "FOUND (RECEIPT)", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px", gap: 12, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <Skeleton w="70%" h={10} />
                <Skeleton w="80%" h={10} />
                <Skeleton w="75%" h={10} />
                <Skeleton w={20} h={10} />
              </div>
            ))}
          </div>
        ) : match ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px", gap: 12, marginBottom: 8 }}>
              {["FIELD", "EXPECTED (ORDER)", "FOUND (RECEIPT)", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>
            {match.checks.map((ch, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px", gap: 12, padding: "9px 0", borderBottom: i < match.checks.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{ch.field}</span>
                <span style={{ fontSize: 13, color: C.textSub }}>{ch.expected}</span>
                <span style={{ fontSize: 13, color: C.textSub }}>{ch.found}</span>
                <span style={{ fontSize: 16, textAlign: "center", color: ch.passed ? C.green : ch.warning ? C.orange : C.coral }}>
                  {ch.passed ? "✓" : ch.warning ? "⚠" : "✕"}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "10px 14px", background: match.payment_legitimate ? C.greenLight : C.coralLight, border: `1px solid ${match.payment_legitimate ? C.greenBorder : C.coralBorder}`, borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: match.payment_legitimate ? C.greenText : C.coral }}>
                ✓ {match.passed_count}/{match.total_count} checks passed — {match.verdict}
              </div>
              <div style={{ fontSize: 12, color: match.payment_legitimate ? C.greenText : C.coral, marginTop: 2, opacity: 0.8 }}>
                {match.payment_legitimate ? "Buyer likely paid. Seller may be withholding release." : "Payment legitimacy is uncertain."}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: C.textLight, textAlign: "center", padding: "16px 0" }}>Awaiting analysis…</div>
        )}
      </div>

      {/* ── Sentiment summary ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
        <SectionHead icon="💬" title="Chat Sentiment Analysis" badge={<AIBadge />} />
        <p style={{ margin: "-8px 0 14px", fontSize: 12, color: C.textSub }}>Scans P2P in-app chat logs from Order #1270078</p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <Skeleton w={60} h={10} />
                  <Skeleton w={30} h={10} />
                </div>
                <Skeleton w="100%" h={7} />
              </div>
            ))}
            <Skeleton w="100%" h={60} mt={4} />
          </div>
        ) : sentiment ? (
          <div style={{ display: "flex", gap: 24 }}>
            {/* Bars */}
            <div style={{ flex: 1 }}>
              {[
                ["Urgency", sentiment.urgency, "#ef4444", "#fee2e2"],
                ["Frustration", sentiment.frustration, "#d97706", "#fef3c7"],
                ["Trust", sentiment.trust, "#16a34a", "#dcfce7"],
              ].map(([label, val, color, track], i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.textSub }}>{label as string}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: color as string }}>{val as number}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: track as string }}>
                    <div style={{ height: "100%", width: `${val}%`, borderRadius: 4, background: color as string, transition: "width 1.2s ease" }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 4, fontSize: 12, color: C.textMid, lineHeight: 1.6, fontStyle: "italic" }}>"{sentiment.summary}"</div>
            </div>

            {/* Risk flags */}
            <div style={{ width: 240, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 13 }}>🚩</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Risk Flags Detected</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: C.white, background: C.coral, borderRadius: 10, padding: "0 6px" }}>{sentiment.risk_flags.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sentiment.risk_flags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: i === 0 ? C.coralLight : i === 1 ? C.coralLight : C.orangeLight, borderRadius: 8, border: `1px solid ${i < 2 ? C.coralBorder : "#fcd34d"}` }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: i < 2 ? C.coral : C.orange, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 11, color: C.textMid, lineHeight: 1.5 }}>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.textLight, textAlign: "center", padding: "16px 0" }}>Awaiting analysis…</div>
        )}
      </div>

      {/* ── Tier Dispute Risk ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
        <SectionHead icon="🏅" title="Tier Dispute Risk" badge={<Badge label="Context" color={C.purple} bg={C.purpleLight} border={C.purpleBorder} />} />
        <p style={{ margin: "-8px 0 16px", fontSize: 12, color: C.textSub }}>User tier standing vs platform limits — factored into triage risk score</p>

        {/* Tier mismatch alert */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#fff7ed", border: "1px solid #fcd34d", borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Tier Mismatch Detected — Elevated Fraud Risk</div>
            <div style={{ fontSize: 11, color: "#b45309", marginTop: 2, lineHeight: 1.5 }}>
              Bronze buyer (12 days, 4 orders) disputing Gold seller (210 days, 7,340 orders). Inexperienced buyer vs established seller is a common fraud pattern. AI triage weighted this signal.
            </div>
          </div>
        </div>

        {/* Buyer / Seller tier cards side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Buyer card */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>Buyer</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "2px 8px" }}>Bronze</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ["Handle",         "user_7821"],
                ["Joined",         "12 days ago"],
                ["Lifetime orders","4"],
                ["30D completion", "—"],
                ["Dispute-free",   "12 days"],
                ["Daily buy limit","$200"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.textSub }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: i === 1 ? C.orange : C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seller card */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>Seller</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#166534", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 6, padding: "2px 8px" }}>Gold</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ["Handle",         "Rahul12"],
                ["Joined",         "210 days ago"],
                ["Lifetime orders","7,340"],
                ["30D completion", "94%"],
                ["Dispute-free",   "45 days"],
                ["Daily sell limit","$2,000"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.textSub }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tier risk signals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Risk Signals</div>
          {[
            { icon: "🔴", label: "2-tier gap: Bronze buyer vs Gold seller", tag: "High", tagColor: C.coral, tagBg: C.coralLight },
            { icon: "🔴", label: "Buyer account age 12 days — below Silver threshold (45 days)", tag: "High", tagColor: C.coral, tagBg: C.coralLight },
            { icon: "🟡", label: "Seller at dispute-free boundary (45 days — Gold minimum)", tag: "Watch", tagColor: "#92400e", tagBg: "#fef3c7" },
            { icon: "🟢", label: "Seller has 7,340 lifetime orders — well above Gold threshold", tag: "Low risk", tagColor: C.greenText, tagBg: C.greenLight },
            { icon: "🟡", label: "At-fault dispute would reset seller's dispute-free clock — risk of tier demotion", tag: "Note", tagColor: C.blueText, tagBg: C.blueLight },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.frame, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
              <span style={{ fontSize: 12, color: C.textMid, flex: 1, lineHeight: 1.4 }}>{s.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.tagColor, background: s.tagBg, padding: "2px 7px", borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" }}>{s.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Re-run */}
      {triage && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onRerun} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", fontSize: 12, fontWeight: 600, color: C.textSub, fontFamily: font, cursor: "pointer" }}>
            ↺ Re-run Analysis
          </button>
        </div>
      )}

      {showEscalation && triage && (
        <EscalationModal
          ticketId="TKT-89421"
          triageScore={triage.risk_score}
          onClose={() => setShowEscalation(false)}
        />
      )}
    </div>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────
const TEAM_MEMBERS = [
  { id: "amara",   name: "Amara Osei",      role: "Senior Moderator",   avatar: "AO", color: "#7c3aed" },
  { id: "dev",     name: "Dev Patel",        role: "Fraud Investigator", avatar: "DP", color: "#0777c4" },
  { id: "sara",    name: "Sara Kimani",      role: "Risk Operations",    avatar: "SK", color: "#166534" },
  { id: "james",   name: "James Thornton",   role: "Legal & Compliance", avatar: "JT", color: "#92400e" },
  { id: "priya",   name: "Priya Nair",       role: "P2P Team Lead",      avatar: "PN", color: "#be185d" },
];

const CHANNELS = [
  { id: "slack_disputes",  icon: "💬", label: "#p2p-disputes",       platform: "Slack"  },
  { id: "slack_fraud",     icon: "🚨", label: "#fraud-alerts",        platform: "Slack"  },
  { id: "email",           icon: "📧", label: "Email notification",   platform: "Email"  },
  { id: "whatsapp",        icon: "📱", label: "WhatsApp group",       platform: "Mobile" },
];

function ShareModal({ result, onClose }: { result: AnalysisResult | null; onClose: () => void }) {
  const [tab, setTab]                     = useState<"team" | "channel" | "export">("team");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["amara", "dev"]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["slack_disputes"]);
  const [message, setMessage]             = useState("FYI — Dispute TKT-89421 needs urgent review. Risk score 0.87 (HIGH). AI recommends escalation.");
  const [phase, setPhase]                 = useState<"idle" | "sending" | "done">("idle");
  const [copied, setCopied]               = useState(false);

  function toggleMember(id: string) {
    setSelectedMembers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleChannel(id: string) {
    setSelectedChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function send() {
    setPhase("sending");
    await new Promise(r => setTimeout(r, 1600));
    setPhase("done");
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://disputes.deriv.com/case/TKT-89421`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalRecipients = (tab === "team" ? selectedMembers : selectedChannels).length;

  const tabs = [
    { id: "team" as const,    icon: "👥", label: "Team members" },
    { id: "channel" as const, icon: "📢", label: "Channels"     },
    { id: "export" as const,  icon: "📤", label: "Export"       },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 51, width: 500, maxHeight: "88vh", background: C.surface, borderRadius: 16, boxShadow: "0 24px 64px #00000033", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}>

        {/* Header */}
        <div style={{ padding: "18px 24px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Share Case</div>
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>TKT-89421 · DSP-2026-001270078</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: C.textSub, cursor: "pointer", padding: "2px 6px" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 700, border: "none", background: "transparent", color: tab === t.id ? C.coral : C.textSub, borderBottom: `2px solid ${tab === t.id ? C.coral : "transparent"}`, cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {phase === "done" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 32px", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `2px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✓</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>Shared successfully</div>
              <div style={{ fontSize: 13, color: C.textSub }}>
                {tab === "export" ? "Report downloaded." : `Sent to ${totalRecipients} ${tab === "team" ? "team member" : "channel"}${totalRecipients !== 1 ? "s" : ""}`}
              </div>
            </div>
            <div style={{ width: "100%", background: C.frame, borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.border}` }}>
              {tab === "team" && selectedMembers.map(id => {
                const m = TEAM_MEMBERS.find(x => x.id === id)!;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.color, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{m.avatar}</div>
                    <span style={{ fontSize: 12, color: C.text }}>{m.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.greenText, fontWeight: 700 }}>✓ Sent</span>
                  </div>
                );
              })}
              {tab === "channel" && selectedChannels.map(id => {
                const ch = CHANNELS.find(x => x.id === id)!;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                    <span style={{ fontSize: 18 }}>{ch.icon}</span>
                    <span style={{ fontSize: 12, color: C.text }}>{ch.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.greenText, fontWeight: 700 }}>✓ Posted</span>
                  </div>
                );
              })}
            </div>
            <button onClick={onClose} style={{ width: "100%", height: 40, borderRadius: 10, border: "none", background: C.green, color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>Done</button>
          </div>

        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>

              {/* AI summary card */}
              {result && tab !== "export" && (
                <div style={{ padding: "10px 14px", background: C.frame, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Case snapshot</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.coralLight, color: C.coral, fontWeight: 700 }}>Risk {result.triage.risk_score.toFixed(2)}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.coralLight, color: C.coral, fontWeight: 700 }}>{result.triage.priority} PRIORITY</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.greenLight, color: C.greenText, fontWeight: 700 }}>{result.triage.claim_validity_pct}% valid</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.blueLight, color: C.blueText, fontWeight: 700 }}>{result.three_way_match.passed_count}/{result.three_way_match.total_count} match</span>
                  </div>
                </div>
              )}

              {/* Team tab */}
              {tab === "team" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Select team members</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {TEAM_MEMBERS.map(m => {
                      const sel = selectedMembers.includes(m.id);
                      return (
                        <button key={m.id} onClick={() => toggleMember(m.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${sel ? C.coral : C.border}`, background: sel ? C.coralLight : C.surface, cursor: "pointer", fontFamily: font, transition: "all 0.15s" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.color, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{m.avatar}</div>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: sel ? C.coral : C.text }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: C.textSub }}>{m.role}</div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? C.coral : C.borderMid}`, background: sel ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {sel && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Channel tab */}
              {tab === "channel" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Select channels</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                    {CHANNELS.map(ch => {
                      const sel = selectedChannels.includes(ch.id);
                      return (
                        <button key={ch.id} onClick={() => toggleChannel(ch.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${sel ? C.coral : C.border}`, background: sel ? C.coralLight : C.surface, cursor: "pointer", fontFamily: font, transition: "all 0.15s" }}>
                          <span style={{ fontSize: 22 }}>{ch.icon}</span>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: sel ? C.coral : C.text }}>{ch.label}</div>
                            <div style={{ fontSize: 11, color: C.textSub }}>{ch.platform}</div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? C.coral : C.borderMid}`, background: sel ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {sel && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message box (team + channel) */}
              {tab !== "export" && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Message</div>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    style={{ width: "100%", padding: "10px 12px", fontSize: 12, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, background: C.frame, resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} />
                </div>
              )}

              {/* Copy link (always visible on team + channel) */}
              {tab !== "export" && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: C.frame, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.textSub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>disputes.deriv.com/case/TKT-89421</span>
                  <button onClick={copyLink} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${copied ? C.greenBorder : C.border}`, background: copied ? C.greenLight : C.surface, fontSize: 11, fontWeight: 700, color: copied ? C.greenText : C.textSub, cursor: "pointer", fontFamily: font, transition: "all 0.2s", flexShrink: 0 }}>
                    {copied ? "✓ Copied" : "Copy link"}
                  </button>
                </div>
              )}

              {/* Export tab */}
              {tab === "export" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "📄", label: "PDF Report",          desc: "Full case summary with AI analysis", action: "Download PDF" },
                    { icon: "📊", label: "JSON Export",         desc: "Raw analysis data for integrations",  action: "Download JSON" },
                    { icon: "📋", label: "Case Summary (CSV)",  desc: "Spreadsheet-friendly format",         action: "Download CSV"  },
                    { icon: "🔗", label: "Shareable link",      desc: "disputes.deriv.com/case/TKT-89421",   action: copied ? "✓ Copied" : "Copy link" },
                  ].map((e, i) => (
                    <button key={i} onClick={i === 3 ? copyLink : send} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontFamily: font, transition: "background 0.15s", textAlign: "left" }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = C.frame)}
                      onMouseLeave={ev => (ev.currentTarget.style.background = C.surface)}>
                      <span style={{ fontSize: 26 }}>{e.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{e.label}</div>
                        <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{e.desc}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.coral, flexShrink: 0 }}>{e.action}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {tab !== "export" && (
              <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
                <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: C.textSub, fontFamily: font, cursor: "pointer" }}>Cancel</button>
                <button onClick={send} disabled={totalRecipients === 0 || phase === "sending"} style={{ flex: 2, height: 42, borderRadius: 10, border: "none", background: totalRecipients > 0 ? C.coral : "#0000001f", color: totalRecipients > 0 ? C.white : C.textSub, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: totalRecipients > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {phase === "sending"
                    ? <><div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid #ffffff55`, borderTop: `2px solid #fff`, animation: "spin 0.8s linear infinite" }} />Sending…</>
                    : `↗ Share with ${totalRecipients} ${tab === "team" ? "member" : "channel"}${totalRecipients !== 1 ? "s" : ""}`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
interface Props { onBack?: () => void; }

export default function AIAnalysisDashboard({ onBack }: Props) {
  type Phase = "idle" | "thinking" | "streaming" | "done" | "error";
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [showShare, setShowShare] = useState(false);

  const runAnalysis = useCallback(async () => {
    setPhase("thinking");
    setThinkingText("");
    setResult(null);
    setErrMsg("");

    const payload = {
      order_id: "1270078", buyer: "user_7821", seller: "Rahul12",
      amount_usd: 5.0, amount_local: 443.87, local_currency: "INR",
      reason: "seller_no_release",
      description: "I transferred full amount on 4 Mar 16:18 IST but seller has not released crypto.",
      ocr_extracted: { merchant: "Rahul Kumar (Rahul12)", amount: "₹443.87", date: "4 Mar 2026, 16:18 IST", reference: "UTR4892761833", bank: "HDFC Bank Ltd." },
      chat_summary: "Seller suggested moving to WhatsApp at 16:05. Sent 3 messages asking buyer to cancel before payment. Response time jumped from 2 min to 18 min.",
      // Tier context — example case: Bronze buyer vs Gold seller (tier mismatch)
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "thinking") setThinkingText(t => t + ev.text);
            else if (ev.type === "text") setPhase("streaming");
            else if (ev.type === "result") { setResult(ev.data); setPhase("done"); }
            else if (ev.type === "error") { setErrMsg(ev.message); setPhase("error"); }
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Connection failed — is the API server running on port 8000?");
      setPhase("error");
    }
  }, []);

  const loading = phase === "thinking" || phase === "streaming";

  return (
    <div style={{ minHeight: "100vh", background: C.frame, fontFamily: font }}>
      {/* Top bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textSub, padding: "4px 6px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
              ← <span style={{ fontSize: 12, fontWeight: 600 }}>Back to demo</span>
            </button>
          )}
          <div style={{ width: 1, height: 18, background: C.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.coral, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>4</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Automated AI Analysis Pipeline</span>
            <span style={{ fontSize: 12, color: C.textSub }}>· TKT-89421</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowShare(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 700, color: C.text, fontFamily: font, cursor: "pointer" }}>
            ↗ Share
          </button>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 20, background: C.purpleLight, border: `1px solid ${C.purpleBorder}` }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${C.purpleBorder}`, borderTop: `2px solid ${C.purple}`, animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.purple }}>
                {phase === "thinking" ? "Claude thinking…" : "Building analysis…"}
              </span>
            </div>
          )}
          {phase === "error" && <span style={{ fontSize: 12, color: C.coral }}>⚠️ {errMsg}</span>}
        </div>
      </div>

      {/* Thinking strip */}
      {phase === "thinking" && thinkingText && (
        <div style={{ background: C.purpleLight, borderBottom: `1px solid ${C.purpleBorder}`, padding: "8px 28px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.purple, flexShrink: 0, marginTop: 1 }}>💭 Thinking</span>
          <span style={{ fontSize: 11, color: C.purple, opacity: 0.8, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{thinkingText}</span>
        </div>
      )}

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 48px", display: "flex", gap: 20, alignItems: "flex-start" }}>
        <CaseFilePanel ocr={result?.ocr ?? null} loading={loading} />
        <FindingsPanel
          triage={result?.triage ?? null}
          match={result?.three_way_match ?? null}
          sentiment={result?.sentiment ?? null}
          loading={loading}
          onRun={runAnalysis}
          onRerun={() => { setPhase("idle"); setResult(null); }}
        />
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {showShare && (
        <ShareModal result={result} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
