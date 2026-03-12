/**
 * AIAnalysisDashboard — Kanban board + case drawer layout
 * Main view: dispute queue organised by status (New / In Review / Pending Info / Resolved)
 * Interaction: click any card → full case slides in from the right as a drawer
 */

import { useState, useCallback } from "react";

const font = "Inter, -apple-system, sans-serif";

const C = {
  coral:       "#ff444f",
  coralLight:  "#fff1f1",
  coralBorder: "#ffcdd0",
  green:       "#00c390",
  greenLight:  "#f0fdf4",
  greenBorder: "#86efac",
  greenText:   "#166534",
  orange:      "#f59e0b",
  orangeLight: "#fffbeb",
  orangeText:  "#92400e",
  blue:        "#3b82f6",
  blueLight:   "#eff6ff",
  blueText:    "#1e40af",
  purple:      "#7c3aed",
  purpleLight: "#f5f3ff",
  purpleBorder:"#c4b5fd",
  text:        "#111827",
  textMid:     "#374151",
  textSub:     "#6b7280",
  textLight:   "#9ca3af",
  border:      "#e5e7eb",
  borderMid:   "#d1d5db",
  frame:       "#f9fafb",
  surface:     "#ffffff",
  dark:        "#111827",
  white:       "#ffffff",
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface AnalysisResult {
  ocr: { merchant_name: string; transaction_date: string; amount: string; reference_id: string; bank: string; status: string; confidence: number; verified: boolean };
  three_way_match: { checks: { field: string; expected: string; found: string; passed: boolean; warning: boolean }[]; passed_count: number; total_count: number; verdict: string; payment_legitimate: boolean };
  sentiment: { urgency: number; frustration: number; trust: number; risk_flags: string[]; summary: string };
  triage: { risk_score: number; priority: string; claim_validity_pct: number; urgency_level: string; seller_risk_score: number; buyer_history: string; similar_cases_pct: number; recommended_action: string; auto_resolve_eligible: boolean; auto_resolve_reason: string };
  summary: string;
}

interface Ticket {
  id: string; col: "new" | "review" | "pending" | "resolved";
  priority: "HIGH" | "MED" | "LOW"; score: number;
  amount: string; local: string;
  buyer: string; seller: string;
  buyerTier: string; sellerTier: string;
  reason: string; sla?: string; resolution?: string;
  isLive?: boolean;
}

// ─── Mock queue data ─────────────────────────────────────────────────────────
const TICKETS: Ticket[] = [
  { id: "TKT-89421", col: "new",      priority: "HIGH", score: 0.87, amount: "5.00 USD",   local: "₹443.87",   buyer: "user_7821",  seller: "Rahul12",     buyerTier: "Bronze",  sellerTier: "Gold",    reason: "Seller didn't release crypto", sla: "5 Mar 16:20", isLive: true },
  { id: "TKT-89417", col: "new",      priority: "HIGH", score: 0.91, amount: "500.00 USD", local: "₹41,775",   buyer: "user_1103",  seller: "CryptoKing99",buyerTier: "Bronze",  sellerTier: "Diamond", reason: "Payment not received",         sla: "5 Mar 18:45" },
  { id: "TKT-89419", col: "new",      priority: "MED",  score: 0.64, amount: "120.00 USD", local: "₹10,032",   buyer: "user_4421",  seller: "Priya_T",     buyerTier: "Silver",  sellerTier: "Silver",  reason: "Wrong payment amount",         sla: "6 Mar 09:00" },
  { id: "TKT-89415", col: "review",   priority: "MED",  score: 0.55, amount: "80.00 USD",  local: "₹6,688",    buyer: "user_9012",  seller: "Ajay_M",      buyerTier: "Silver",  sellerTier: "Gold",    reason: "Seller didn't release crypto", sla: "6 Mar 14:00" },
  { id: "TKT-89412", col: "review",   priority: "LOW",  score: 0.38, amount: "25.00 USD",  local: "₹2,089",    buyer: "user_3345",  seller: "trader_99",   buyerTier: "Gold",    sellerTier: "Silver",  reason: "Wrong payment amount",         sla: "7 Mar 10:30" },
  { id: "TKT-89408", col: "pending",  priority: "HIGH", score: 0.79, amount: "300.00 USD", local: "₹25,065",   buyer: "user_7720",  seller: "Vikram_S",    buyerTier: "Bronze",  sellerTier: "Gold",    reason: "Payment not received",         sla: "5 Mar 20:00" },
  { id: "TKT-89405", col: "resolved", priority: "MED",  score: 0.71, amount: "15.00 USD",  local: "₹1,253",    buyer: "user_2211",  seller: "Ravi_K",      buyerTier: "Silver",  sellerTier: "Gold",    reason: "Seller didn't release crypto", resolution: "Buyer" },
  { id: "TKT-89402", col: "resolved", priority: "LOW",  score: 0.32, amount: "10.00 USD",  local: "₹835",      buyer: "user_5544",  seller: "merchant_7",  buyerTier: "Gold",    sellerTier: "Silver",  reason: "Wrong payment amount",         resolution: "Seller" },
];

const COLUMNS: { id: Ticket["col"]; label: string; color: string; dot: string; bg: string }[] = [
  { id: "new",      label: "New",          color: C.coral,     dot: C.coral,   bg: "#fff5f5" },
  { id: "review",   label: "In Review",    color: C.blue,      dot: C.blue,    bg: C.blueLight },
  { id: "pending",  label: "Pending Info", color: C.orange,    dot: C.orange,  bg: C.orangeLight },
  { id: "resolved", label: "Resolved",     color: C.greenText, dot: C.green,   bg: C.greenLight },
];

const TIER_RANK: Record<string, number> = { Bronze: 1, Silver: 2, Gold: 3, Diamond: 4 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 12, mt = 0 }: { w?: string | number; h?: number; mt?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 6, marginTop: mt, background: "linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s infinite" }} />;
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700, border: border ? `1px solid ${border}` : "none", letterSpacing: 0.2 }}>{label}</span>;
}

function SectionHead({ icon, title, badge }: { icon: string; title: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span>
      {badge}
    </div>
  );
}

function AutoBadge() { return <Badge label="Automated" color={C.blueText} bg={C.blueLight} />; }
function AIBadge()   { return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 4, background: C.dark, color: C.white, fontSize: 12, fontWeight: 700 }}>AI</span>; }
function Divider({ my = 16 }: { my?: number }) { return <div style={{ height: 1, background: C.border, margin: `${my}px 0` }} />; }

function priorityStyle(p: string) {
  if (p === "HIGH") return { color: C.coral,     bg: C.coralLight,  border: C.coralBorder };
  if (p === "MED")  return { color: C.orangeText, bg: C.orangeLight, border: "#fcd34d" };
  return                   { color: C.greenText,  bg: C.greenLight,  border: C.greenBorder };
}

// ─── Kanban card ─────────────────────────────────────────────────────────────
function KanbanCard({ ticket, selected, onClick }: { ticket: Ticket; selected: boolean; onClick: () => void }) {
  const ps = priorityStyle(ticket.priority);
  const tierMismatch = (TIER_RANK[ticket.sellerTier] ?? 0) - (TIER_RANK[ticket.buyerTier] ?? 0) >= 2;
  const scoreColor = ticket.score >= 0.75 ? C.coral : ticket.score >= 0.5 ? C.orange : C.green;

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface, borderRadius: 10, padding: "14px 16px",
        border: selected ? `2px solid ${C.coral}` : `1px solid ${C.border}`,
        cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
        boxShadow: selected ? "0 0 0 3px #ff444f22" : "0 1px 4px #0000000a",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Live indicator */}
      {ticket.isLive && (
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 0 2px #00c39033`, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.greenText }}>Live</span>
        </div>
      )}

      {/* Ticket ID + Priority */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{ticket.id}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: ps.color, background: ps.bg, border: `1px solid ${ps.border}`, borderRadius: 20, padding: "1px 8px" }}>{ticket.priority}</span>
      </div>

      {/* Parties */}
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>
        <span style={{ color: C.text, fontWeight: 600 }}>{ticket.buyer}</span>
        <span style={{ margin: "0 6px", color: C.textLight }}>→</span>
        <span style={{ color: C.text, fontWeight: 600 }}>{ticket.seller}</span>
      </div>

      {/* Amount */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
        {ticket.amount} <span style={{ fontWeight: 400, color: C.textSub, fontSize: 12 }}>/ {ticket.local}</span>
      </div>

      {/* Reason */}
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {ticket.reason}
      </div>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {ticket.sla && (
            <span style={{ fontSize: 11, color: C.textSub }}>SLA: {ticket.sla}</span>
          )}
          {ticket.resolution && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.greenText }}>✓ Resolved — {ticket.resolution}</span>
          )}
        </div>
        {tierMismatch && (
          <span style={{ fontSize: 11, fontWeight: 700, color: C.orangeText, background: C.orangeLight, border: "1px solid #fcd34d", borderRadius: 20, padding: "1px 7px" }}>⚠ Tier</span>
        )}
      </div>

      {/* Risk score bar */}
      <div style={{ height: 4, borderRadius: 2, background: C.frame }}>
        <div style={{ height: "100%", width: `${ticket.score * 100}%`, borderRadius: 2, background: scoreColor, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 3 }}>
        <span style={{ fontSize: 11, color: scoreColor, fontWeight: 700 }}>{ticket.score.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({ col, tickets, selectedId, onOpenTicket }: {
  col: typeof COLUMNS[0]; tickets: Ticket[]; selectedId: string | null; onOpenTicket: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 0 12px" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.dot }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{col.label}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: col.color, background: col.bg, borderRadius: 20, padding: "1px 8px" }}>{tickets.length}</span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tickets.map(t => (
          <KanbanCard key={t.id} ticket={t} selected={selectedId === t.id} onClick={() => onOpenTicket(t.id)} />
        ))}
        {tickets.length === 0 && (
          <div style={{ padding: "24px 16px", textAlign: "center", background: C.surface, borderRadius: 10, border: `1px dashed ${C.border}`, fontSize: 12, color: C.textLight }}>
            No cases
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Escalation modal ─────────────────────────────────────────────────────────
const ESCALATION_REASONS = [
  { id: "off_platform",          label: "Off-platform communication attempt",        severity: "critical" },
  { id: "high_seller_risk",      label: "High seller risk score (≥ 0.80)",           severity: "high"     },
  { id: "pattern_fraud",         label: "Matches known fraud pattern",               severity: "critical" },
  { id: "insufficient_evidence", label: "Insufficient evidence for auto-resolution", severity: "medium"   },
  { id: "repeat_offender",       label: "Seller has prior dispute history",          severity: "high"     },
  { id: "large_amount",          label: "High-value transaction requires senior review", severity: "medium" },
];
const ASSIGNEES = [
  { id: "senior_mod", label: "Senior Moderator",       avatar: "👩‍💼" },
  { id: "fraud_team", label: "Fraud Investigation Team", avatar: "🔍" },
  { id: "legal",      label: "Legal & Compliance",     avatar: "⚖️" },
  { id: "risk_ops",   label: "Risk Operations",        avatar: "🛡️" },
];

function EscalationModal({ ticketId, triageScore, onClose }: { ticketId: string; triageScore: number; onClose: () => void }) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>(["off_platform", "high_seller_risk"]);
  const [priority, setPriority] = useState<"critical" | "high" | "medium">("critical");
  const [assignee, setAssignee]     = useState("senior_mod");
  const [notes, setNotes]           = useState("");
  const [phase, setPhase]           = useState<"form" | "submitting" | "done">("form");

  function toggleReason(id: string) { setSelectedReasons(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]); }
  async function submit() { setPhase("submitting"); await new Promise(r => setTimeout(r, 1800)); setPhase("done"); }

  const pm = {
    critical: { color: C.coral,    bg: C.coralLight,  border: C.coralBorder, label: "Critical — SLA 2 hrs"  },
    high:     { color: "#d97706",  bg: C.orangeLight, border: "#fcd34d",     label: "High — SLA 4 hrs"      },
    medium:   { color: C.blueText, bg: C.blueLight,   border: "#93c5fd",     label: "Medium — SLA 24 hrs"   },
  }[priority];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 100 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 101, width: 560, maxHeight: "90vh", background: C.surface, borderRadius: 16, boxShadow: "0 24px 64px #00000033", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}>
        <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 2 }}>Escalate Dispute</div>
            <div style={{ fontSize: 12, color: C.textSub }}>{ticketId} · Risk score {triageScore.toFixed(2)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: C.textSub, cursor: "pointer", padding: "2px 6px", borderRadius: 6 }}>✕</button>
        </div>

        {phase === "done" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.coralLight, border: `2px solid ${C.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>↑</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>Escalated successfully</div>
              <div style={{ fontSize: 13, color: C.textSub }}>Ticket {ticketId} has been escalated to <b style={{ color: C.text }}>{ASSIGNEES.find(a => a.id === assignee)?.label}</b></div>
            </div>
            <div style={{ width: "100%", background: C.frame, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
              {[["Escalation ID", `ESC-${Date.now().toString().slice(-6)}`], ["Priority", pm.label], ["Assigned to", ASSIGNEES.find(a => a.id === assignee)?.label ?? ""], ["SLA deadline", priority === "critical" ? "Within 2 hours" : priority === "high" ? "Within 4 hours" : "Within 24 hours"]].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.textSub }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ width: "100%", height: 42, borderRadius: 10, border: "none", background: C.coral, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Escalation reasons</div>
              {ESCALATION_REASONS.map(r => {
                const checked = selectedReasons.includes(r.id);
                return (
                  <div key={r.id} onClick={() => toggleReason(r.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${checked ? C.coral : C.border}`, background: checked ? C.coralLight : "transparent", cursor: "pointer", marginBottom: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? C.coral : C.borderMid}`, background: checked ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {checked && <span style={{ color: C.white, fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{r.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: r.severity === "critical" ? C.coralLight : r.severity === "high" ? C.orangeLight : C.blueLight, color: r.severity === "critical" ? C.coral : r.severity === "high" ? C.orangeText : C.blueText }}>{r.severity}</span>
                  </div>
                );
              })}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Priority</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["critical", "high", "medium"] as const).map(p => {
                  const m = { critical: { color: C.coral, bg: C.coralLight, border: C.coralBorder, label: "Critical — SLA 2 hrs" }, high: { color: "#d97706", bg: C.orangeLight, border: "#fcd34d", label: "High — SLA 4 hrs" }, medium: { color: C.blueText, bg: C.blueLight, border: "#93c5fd", label: "Medium — SLA 24 hrs" } }[p];
                  const sel = priority === p;
                  return (
                    <div key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${sel ? m.color : C.border}`, background: sel ? m.bg : "transparent", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? m.color : C.textSub }}>{p.charAt(0).toUpperCase() + p.slice(1)}</div>
                      <div style={{ fontSize: 12, color: sel ? m.color : C.textLight, marginTop: 2 }}>{p === "critical" ? "SLA 2 hrs" : p === "high" ? "SLA 4 hrs" : "SLA 24 hrs"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Assign to</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ASSIGNEES.map(a => {
                  const sel = assignee === a.id;
                  return (
                    <div key={a.id} onClick={() => setAssignee(a.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `2px solid ${sel ? C.purple : C.border}`, background: sel ? C.purpleLight : "transparent", cursor: "pointer" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: sel ? C.purple : C.border, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.avatar}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: sel ? C.purple : C.text }}>{a.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Notes <span style={{ fontWeight: 400, color: C.textSub }}>(optional)</span></div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add context for the assignee…"
                style={{ width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} />
            </div>
          </div>
        )}

        {phase !== "done" && (
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", fontSize: 14, fontWeight: 700, color: C.textSub, fontFamily: font, cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} disabled={phase === "submitting" || selectedReasons.length === 0}
              style={{ flex: 2, height: 42, borderRadius: 10, border: "none", background: selectedReasons.length > 0 ? C.coral : C.border, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: selectedReasons.length > 0 ? "pointer" : "default", opacity: phase === "submitting" ? 0.7 : 1 }}>
              {phase === "submitting" ? "Escalating…" : `Escalate to ${ASSIGNEES.find(a => a.id === assignee)?.label}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────
const TEAM_MEMBERS = [
  { id: "amara", name: "Amara Osei",    role: "Senior Moderator",   avatar: "AO", color: "#7c3aed" },
  { id: "dev",   name: "Dev Patel",     role: "Fraud Investigator", avatar: "DP", color: "#0777c4" },
  { id: "sara",  name: "Sara Kimani",   role: "Risk Operations",    avatar: "SK", color: "#166534" },
  { id: "james", name: "James Thornton",role: "Legal & Compliance", avatar: "JT", color: "#92400e" },
  { id: "priya", name: "Priya Nair",    role: "P2P Team Lead",      avatar: "PN", color: "#be185d" },
];
const CHANNELS = [
  { id: "slack_disputes", icon: "💬", label: "#p2p-disputes",     platform: "Slack"  },
  { id: "slack_fraud",    icon: "🚨", label: "#fraud-alerts",     platform: "Slack"  },
  { id: "email",          icon: "📧", label: "Email notification",platform: "Email"  },
  { id: "whatsapp",       icon: "📱", label: "WhatsApp group",    platform: "Mobile" },
];

function ShareModal({ onClose }: { result?: AnalysisResult | null; onClose: () => void }) {
  const [tab, setTab]                 = useState<"team" | "channel" | "export">("team");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["amara", "dev"]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["slack_disputes"]);
  const [message, setMessage]         = useState("FYI — Dispute TKT-89421 needs urgent review. Risk score 0.87 (HIGH). AI recommends escalation.");
  const [phase, setPhase]             = useState<"idle" | "sending" | "done">("idle");
  const [copied, setCopied]           = useState(false);

  function toggleMember(id: string) { setSelectedMembers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleChannel(id: string) { setSelectedChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  async function send() { setPhase("sending"); await new Promise(r => setTimeout(r, 1600)); setPhase("done"); }
  async function copyLink() { setCopied(true); await new Promise(r => setTimeout(r, 2000)); setCopied(false); }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 100 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 101, width: 520, maxHeight: "90vh", background: C.surface, borderRadius: 16, boxShadow: "0 24px 64px #00000033", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font }}>
        <div style={{ padding: "18px 24px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Share Case</div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: C.textSub, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {(["team", "channel", "export"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 700, border: "none", background: "transparent", color: tab === t ? C.text : C.textSub, borderBottom: tab === t ? `2px solid ${C.coral}` : "2px solid transparent", cursor: "pointer", fontFamily: font, textTransform: "capitalize" }}>
                {t === "team" ? "Team Members" : t === "channel" ? "Channels" : "Export"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {phase === "done" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✓</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Sent successfully</div>
                <div style={{ fontSize: 13, color: C.textSub }}>Case shared with {selectedMembers.length} team member{selectedMembers.length !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={onClose} style={{ width: "100%", height: 42, borderRadius: 10, border: "none", background: C.green, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>Done</button>
            </div>
          ) : tab === "team" ? (
            <>
              <div style={{ padding: "10px 14px", background: C.frame, borderRadius: 10, marginBottom: 16, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["TKT-89421", C.coral], ["Risk 0.87", C.orangeText], ["HIGH", C.coral]].map(([l, c], i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 700, color: c as string, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px" }}>{l}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 8 }}>Seller didn't release crypto · Bronze vs Gold · OCR match</div>
              </div>
              {TEAM_MEMBERS.map(m => {
                const sel = selectedMembers.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggleMember(m.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: `1px solid ${sel ? C.purple : C.border}`, background: sel ? C.purpleLight : "transparent", cursor: "pointer", marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.color, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? C.purple : C.text }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: C.textSub }}>{m.role}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel ? C.purple : C.borderMid}`, background: sel ? C.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <span style={{ color: C.white, fontSize: 12 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                style={{ width: "100%", marginTop: 8, padding: "10px 12px", fontSize: 12, fontFamily: font, borderRadius: 8, border: `1px solid ${C.border}`, resize: "none", outline: "none", boxSizing: "border-box", color: C.text }} />
            </>
          ) : tab === "channel" ? (
            <>
              {CHANNELS.map(ch => {
                const sel = selectedChannels.includes(ch.id);
                return (
                  <div key={ch.id} onClick={() => toggleChannel(ch.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: `1px solid ${sel ? C.coral : C.border}`, background: sel ? C.coralLight : "transparent", cursor: "pointer", marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{ch.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? C.coral : C.text }}>{ch.label}</div>
                      <div style={{ fontSize: 12, color: C.textSub }}>{ch.platform}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${sel ? C.coral : C.borderMid}`, background: sel ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <span style={{ color: C.white, fontSize: 12 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ fmt: "PDF Report", desc: "Full case file with AI analysis", icon: "📄" }, { fmt: "JSON Data", desc: "Structured data for integrations", icon: "📋" }, { fmt: "CSV Summary", desc: "Spreadsheet-friendly format", icon: "📊" }].map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer", background: C.frame }}>
                  <span style={{ fontSize: 24 }}>{e.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{e.fmt}</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>{e.desc}</div>
                  </div>
                  <button style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 700, color: C.text, fontFamily: font, cursor: "pointer" }}>Download</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1, padding: "10px 12px", background: C.frame, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  https://disputeassistant.vercel.app/case/TKT-89421
                </div>
                <button onClick={copyLink} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${copied ? C.green : C.border}`, background: copied ? C.greenLight : C.surface, fontSize: 12, fontWeight: 700, color: copied ? C.greenText : C.text, fontFamily: font, cursor: "pointer", flexShrink: 0 }}>
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          )}
        </div>

        {phase !== "done" && tab !== "export" && (
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", fontSize: 13, fontWeight: 700, color: C.textSub, fontFamily: font, cursor: "pointer" }}>Cancel</button>
            <button onClick={send} disabled={phase === "sending"}
              style={{ flex: 2, height: 40, borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: "pointer", opacity: phase === "sending" ? 0.7 : 1 }}>
              {phase === "sending" ? "Sending…" : `Send to ${tab === "team" ? `${selectedMembers.length} member${selectedMembers.length !== 1 ? "s" : ""}` : `${selectedChannels.length} channel${selectedChannels.length !== 1 ? "s" : ""}`}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Case drawer content — AI findings ────────────────────────────────────────
function FindingsContent({
  triage, match, sentiment, loading, onRun, onRerun, isLive
}: {
  triage: AnalysisResult["triage"] | null;
  match: AnalysisResult["three_way_match"] | null;
  sentiment: AnalysisResult["sentiment"] | null;
  loading: boolean; onRun: () => void; onRerun: () => void; isLive: boolean;
}) {
  const isHigh = triage?.priority === "HIGH";
  const priorityColor = triage?.priority === "HIGH" ? C.coral : triage?.priority === "MEDIUM" ? C.orange : C.green;

  if (!isLive && !triage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 36 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Demo case</div>
        <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>Select <b>TKT-89421</b> to run a live AI analysis with Claude extended thinking.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 24px" }}>
      {/* Run analysis CTA */}
      {!triage && !loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px", background: C.purpleLight, borderRadius: 12, border: `1px solid ${C.purpleBorder}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>AI Analysis Pipeline ready</div>
          <div style={{ fontSize: 12, color: C.textSub, textAlign: "center" }}>OCR · 3-way match · Sentiment · Triage — all run in parallel</div>
          <button onClick={onRun} style={{ padding: "10px 28px", borderRadius: 24, border: "none", background: `linear-gradient(135deg,${C.purple},${C.coral})`, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer", boxShadow: "0 4px 16px #7c3aed33" }}>
            Run AI Analysis
          </button>
        </div>
      )}

      {/* Triage hero */}
      {(loading || triage) && (
        <div style={{ background: C.surface, border: `2px solid ${loading ? C.border : isHigh ? C.coral : C.greenBorder}`, borderRadius: 12, padding: "20px 24px", transition: "border-color 0.4s" }}>
          <SectionHead icon="🎯" title="Triage Verdict" badge={<AIBadge />} />
          {loading ? (
            <div>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
                <Skeleton w={80} h={80} /> <div style={{ flex: 1 }}><Skeleton w={120} h={16} /><Skeleton w="90%" h={11} mt={8} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h={32} />)}
              </div>
            </div>
          ) : triage && (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
                <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: "50%", border: `4px solid ${isHigh ? C.coral : C.green}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: isHigh ? C.coralLight : C.greenLight }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: isHigh ? C.coral : C.greenText, lineHeight: 1 }}>{triage.risk_score.toFixed(2)}</span>
                  <span style={{ fontSize: 9, color: C.textSub, marginTop: 2 }}>RISK</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: priorityColor }}>{triage.priority} PRIORITY</span>
                    <AIBadge />
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                    <b style={{ color: C.coral }}>{triage.claim_validity_pct}% probability</b> the claim is valid.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={triage.urgency_level} color={C.coral} bg={C.coralLight} border={C.coralBorder} />
                    {triage.auto_resolve_eligible && <Badge label="Auto-resolve eligible" color={C.greenText} bg={C.greenLight} border={C.greenBorder} />}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["Claim validity", `${triage.claim_validity_pct}%`, C.coral], ["Seller risk", triage.seller_risk_score.toFixed(2), C.coral], ["Similar cases", `${triage.similar_cases_pct}%`, C.greenText]].map(([l, v, c], i) => (
                  <div key={i} style={{ padding: "10px 12px", background: C.frame, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: c as string }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 14px", background: C.coralLight, borderRadius: 8, border: `1px solid ${C.coralBorder}`, fontSize: 13, fontWeight: 600, color: C.coral }}>{triage.recommended_action}</div>
            </>
          )}
        </div>
      )}

      {/* 3-way match */}
      {(loading || match) && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <SectionHead icon="⚖️" title="Three-Way Matching" badge={<AutoBadge />} />
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 10 }}><Skeleton w="80%" h={11} /><Skeleton w="75%" h={11} /><Skeleton w="70%" h={11} /><Skeleton w={20} h={11} /></div>)}
            </div>
          ) : match && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 10, marginBottom: 8 }}>
                {["Field", "Expected", "Found", ""].map((h, i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase" }}>{h}</span>)}
              </div>
              {match.checks.map((ch, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 10, padding: "8px 0", borderBottom: i < match.checks.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{ch.field}</span>
                  <span style={{ fontSize: 12, color: C.textSub }}>{ch.expected}</span>
                  <span style={{ fontSize: 12, color: C.textSub }}>{ch.found}</span>
                  <span style={{ fontSize: 15, textAlign: "center", color: ch.passed ? C.green : ch.warning ? C.orange : C.coral }}>{ch.passed ? "✓" : ch.warning ? "⚠" : "✕"}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "10px 14px", background: match.payment_legitimate ? C.greenLight : C.coralLight, border: `1px solid ${match.payment_legitimate ? C.greenBorder : C.coralBorder}`, borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: match.payment_legitimate ? C.greenText : C.coral }}>
                  {match.passed_count}/{match.total_count} checks passed — {match.verdict}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sentiment */}
      {(loading || sentiment) && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <SectionHead icon="💬" title="Chat Sentiment Analysis" badge={<AIBadge />} />
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><Skeleton w={60} h={11} /><Skeleton w={30} h={11} /></div><Skeleton w="100%" h={7} /></div>)}
            </div>
          ) : sentiment && (
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                {[["Urgency", sentiment.urgency, "#ef4444", "#fee2e2"], ["Frustration", sentiment.frustration, "#d97706", "#fef3c7"], ["Trust", sentiment.trust, "#16a34a", "#dcfce7"]].map(([label, val, color, track], i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: C.textSub }}>{label as string}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: color as string }}>{val as number}%</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: track as string }}>
                      <div style={{ height: "100%", width: `${val}%`, borderRadius: 4, background: color as string }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6, fontStyle: "italic", marginTop: 4 }}>"{sentiment.summary}"</div>
              </div>
              <div style={{ width: 220, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 13 }}>🚩</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Risk Flags</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: C.white, background: C.coral, borderRadius: 10, padding: "0 6px" }}>{sentiment.risk_flags.length}</span>
                </div>
                {sentiment.risk_flags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: i < 2 ? C.coralLight : C.orangeLight, borderRadius: 8, border: `1px solid ${i < 2 ? C.coralBorder : "#fcd34d"}`, marginBottom: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: i < 2 ? C.coral : C.orange, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tier dispute risk */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
        <SectionHead icon="🏅" title="Tier Dispute Risk" badge={<Badge label="Context" color={C.purple} bg={C.purpleLight} border={C.purpleBorder} />} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#fff7ed", border: "1px solid #fcd34d", borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Tier Mismatch — Elevated Fraud Risk</div>
            <div style={{ fontSize: 12, color: "#b45309", marginTop: 2, lineHeight: 1.5 }}>Bronze buyer (12 days, 4 orders) vs Gold seller (210 days, 7,340 orders).</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[{ role: "Buyer", tier: "Bronze", tc: "#92400e", tbg: "#fef3c7", tb: "#fcd34d", rows: [["Handle","user_7821"],["Joined","12 days ago"],["Orders","4"],["Dispute-free","12 days"]] },
            { role: "Seller", tier: "Gold",   tc: "#166534", tbg: "#dcfce7", tb: "#86efac", rows: [["Handle","Rahul12"],["Joined","210 days ago"],["Orders","7,340"],["Dispute-free","45 days"]] }].map((u, ui) => (
            <div key={ui} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: C.frame, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase" }}>{u.role}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: u.tc, background: u.tbg, border: `1px solid ${u.tb}`, borderRadius: 6, padding: "2px 8px" }}>{u.tier}</span>
              </div>
              <div style={{ padding: "10px 14px" }}>
                {u.rows.map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                    <span style={{ fontSize: 12, color: C.textSub }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {[{ icon: "🔴", label: "2-tier gap: Bronze buyer vs Gold seller", tag: "High risk", tc: C.coral, tbg: C.coralLight },
          { icon: "🔴", label: "Buyer account age 12 days — below Silver threshold (45 days)", tag: "High risk", tc: C.coral, tbg: C.coralLight },
          { icon: "🟡", label: "Seller at dispute-free boundary (45 days min for Gold)", tag: "Watch", tc: "#92400e", tbg: "#fef3c7" },
          { icon: "🟢", label: "Seller lifetime orders 7,340 — well above Gold threshold", tag: "Low risk", tc: C.greenText, tbg: C.greenLight },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.frame, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: C.textMid, flex: 1, lineHeight: 1.4 }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.tc, background: s.tbg, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{s.tag}</span>
          </div>
        ))}
      </div>

      {triage && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
          <button onClick={onRerun} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", fontSize: 12, fontWeight: 600, color: C.textSub, fontFamily: font, cursor: "pointer" }}>
            Re-run AI Analysis
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Case file content ────────────────────────────────────────────────────────
function CaseFileContent({ ticket, ocr, loading }: { ticket: Ticket; ocr: AnalysisResult["ocr"] | null; loading: boolean }) {
  const timelineEvents = [
    { time: "16:05", label: "Seller suggests moving to WhatsApp", flag: true },
    { time: "16:10", label: "Seller sends cancel request ×3",     flag: true },
    { time: "16:18", label: "Buyer confirms payment sent",        flag: false },
    { time: "16:20", label: "Timer expires — dispute unlocked",   flag: false },
    { time: "16:20", label: "Buyer raises dispute",               flag: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "0 0 80px" }}>
      {/* Order summary */}
      <div style={{ background: C.dark, padding: "20px 24px 18px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Case File</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 2 }}>Order #{ticket.id.replace("TKT-", "")}</div>
        <div style={{ fontSize: 12, color: "#ffffff66", marginBottom: 14 }}>{ticket.id} · DSP-2026-001270078</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[["Buyer", ticket.buyer], ["Seller", ticket.seller], ["Amount", `${ticket.amount} / ${ticket.local}`], ["Reason", ticket.reason]].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#ffffff55" }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffffcc", textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
          <Badge label="Under Dispute" color={C.orange} bg="#f59e0b22" />
          <Badge label={ticket.priority} color={C.coral} bg="#ff444f22" />
        </div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        {/* OCR */}
        <SectionHead icon="📄" title="Receipt (OCR Verified)" badge={<AutoBadge />} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: C.frame, borderRadius: 8, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ width: 28, height: 28, background: C.border, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>📄</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>payment_receipt.pdf</div>
            <div style={{ fontSize: 12, color: C.textSub }}>248 KB · Scanned 2026-03-04 16:20:03</div>
          </div>
          {loading ? <div style={{ marginLeft: "auto", width: 10, height: 10, borderRadius: "50%", border: `2px solid ${C.border}`, borderTop: `2px solid ${C.blue}`, animation: "spin 0.8s linear infinite" }} />
            : <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: C.greenText }}>✓</span>}
        </div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between" }}><Skeleton w={80} h={11} /><Skeleton w={110} h={11} /></div>)}
          </div>
        ) : ocr ? (
          <div style={{ marginBottom: 16 }}>
            {[["Merchant", ocr.merchant_name, C.coral], ["Date", ocr.transaction_date, C.text], ["Amount", ocr.amount, C.coral], ["Reference", ocr.reference_id, C.text], ["Bank", ocr.bank, C.text], ["Status", ocr.status, ocr.status === "SUCCESSFUL" ? C.greenText : C.coral]].map(([k, v, color], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 12, color: C.textSub }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: color as string }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: "6px 10px", background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 6, fontSize: 12, fontWeight: 700, color: C.greenText }}>
              ✓ {ocr.confidence}% confidence — All fields extracted
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.textLight, textAlign: "center", padding: "12px 0", marginBottom: 16 }}>Run AI analysis to verify receipt</div>
        )}

        <Divider />

        {/* Evidence */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Evidence</div>
          {[{ icon: "📄", name: "payment_receipt.pdf", tag: "OCR ✓",          tagColor: C.greenText, tagBg: C.greenLight },
            { icon: "💬", name: "P2P chat logs",       tag: "Auto-attached",  tagColor: C.blueText,  tagBg: C.blueLight  }].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{f.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.tagColor, background: f.tagBg, padding: "2px 6px", borderRadius: 4 }}>{f.tag}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* Timeline */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Chat Timeline</div>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 1, background: C.border }} />
            {timelineEvents.map((e, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                <div style={{ position: "absolute", left: -20, top: 3, width: 8, height: 8, borderRadius: "50%", background: e.flag ? C.coral : C.border, border: `2px solid ${e.flag ? C.coral : C.borderMid}` }} />
                <div style={{ fontSize: 11, color: C.textLight, marginBottom: 1 }}>{e.time}</div>
                <div style={{ fontSize: 12, color: e.flag ? C.coral : C.textMid, fontWeight: e.flag ? 600 : 400 }}>{e.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Case drawer ──────────────────────────────────────────────────────────────
function CaseDrawer({ open, ticket, onClose, triage, match, sentiment, ocr, loading, thinkingText, phase, errMsg, onRun, onRerun, onShare }: {
  open: boolean; ticket: Ticket | null; onClose: () => void;
  triage: AnalysisResult["triage"] | null; match: AnalysisResult["three_way_match"] | null;
  sentiment: AnalysisResult["sentiment"] | null; ocr: AnalysisResult["ocr"] | null;
  loading: boolean; thinkingText: string; phase: string; errMsg: string;
  onRun: () => void; onRerun: () => void; onShare: () => void;
}) {
  const [tab, setTab]             = useState<"case" | "analysis">("case");
  const [showEscalation, setShowEscalation] = useState(false);

  if (!ticket) return null;

  return (
    <>
      {/* Backdrop */}
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000033", zIndex: 30, transition: "opacity 0.2s" }} />}

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 720, maxWidth: "90vw",
        background: C.surface, boxShadow: "-8px 0 40px #00000022",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 31, display: "flex", flexDirection: "column", fontFamily: font,
      }}>
        {/* Drawer header */}
        <div style={{ padding: "0 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{ticket.id}</div>
              <Badge label={ticket.priority} color={priorityStyle(ticket.priority).color} bg={priorityStyle(ticket.priority).bg} border={priorityStyle(ticket.priority).border} />
              <Badge label={ticket.col === "resolved" ? `Resolved — ${ticket.resolution}` : ticket.col === "review" ? "In Review" : ticket.col === "pending" ? "Pending Info" : "New"} color={ticket.col === "resolved" ? C.greenText : ticket.col === "review" ? C.blueText : ticket.col === "pending" ? C.orangeText : C.coral} bg={ticket.col === "resolved" ? C.greenLight : ticket.col === "review" ? C.blueLight : ticket.col === "pending" ? C.orangeLight : C.coralLight} />
              {ticket.isLive && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: C.greenText }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />Live</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={onShare} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", fontSize: 13, fontWeight: 700, color: C.text, fontFamily: font, cursor: "pointer" }}>Share Case</button>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", fontSize: 16, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {(["case", "analysis"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, border: "none", background: "transparent", color: tab === t ? C.text : C.textSub, borderBottom: tab === t ? `2px solid ${C.coral}` : "2px solid transparent", cursor: "pointer", fontFamily: font }}>
                {t === "case" ? "Case File" : "AI Analysis"}
              </button>
            ))}
            {(phase === "thinking" || phase === "streaming") && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "0 4px 2px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${C.purpleBorder}`, borderTop: `2px solid ${C.purple}`, animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.purple }}>{phase === "thinking" ? "Claude thinking…" : "Building analysis…"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Extended thinking strip */}
        {phase === "thinking" && thinkingText && (
          <div style={{ padding: "8px 20px", background: C.purpleLight, borderBottom: `1px solid ${C.purpleBorder}`, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 2 }}>Claude extended thinking</div>
            <div style={{ fontSize: 12, color: C.purple, opacity: 0.75, lineHeight: 1.5, maxHeight: 40, overflow: "hidden" }}>{thinkingText.slice(-200)}</div>
          </div>
        )}

        {/* Error bar */}
        {phase === "error" && (
          <div style={{ padding: "8px 20px", background: C.coralLight, borderBottom: `1px solid ${C.coralBorder}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ color: C.coral }}>⚠</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.coral, flex: 1 }}>{errMsg}</span>
            <button onClick={onRun} style={{ fontSize: 12, fontWeight: 700, color: C.coral, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: font }}>Retry</button>
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "case"
            ? <CaseFileContent ticket={ticket} ocr={ocr} loading={loading} />
            : <FindingsContent triage={triage} match={match} sentiment={sentiment} loading={loading} onRun={onRun} onRerun={onRerun} isLive={!!ticket.isLive} />
          }
        </div>

        {/* Sticky footer actions */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0, background: C.surface }}>
          <button style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: C.green, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>✓ Resolve — Buyer</button>
          <button onClick={() => setShowEscalation(true)} style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: C.coral, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: font, cursor: "pointer" }}>↑ Escalate</button>
          <button style={{ height: 44, padding: "0 20px", borderRadius: 10, border: `1px solid ${C.borderMid}`, background: "transparent", fontSize: 14, fontWeight: 700, color: C.textSub, fontFamily: font, cursor: "pointer" }}>Request Info</button>
        </div>
      </div>

      {showEscalation && (
        <EscalationModal ticketId={ticket.id} triageScore={triage?.risk_score ?? 0.87} onClose={() => setShowEscalation(false)} />
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props { onBack?: () => void }

export default function AIAnalysisDashboard({ onBack }: Props) {
  type Phase = "idle" | "thinking" | "streaming" | "done" | "error";
  const [phase, setPhase]           = useState<Phase>("idle");
  const [result, setResult]         = useState<AnalysisResult | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [errMsg, setErrMsg]         = useState("");
  const [showShare, setShowShare]   = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const runAnalysis = useCallback(async () => {
    setPhase("thinking"); setThinkingText(""); setResult(null); setErrMsg("");
    const payload = {
      order_id: "1270078", buyer: "user_7821", seller: "Rahul12",
      amount_usd: 5.0, amount_local: 443.87, local_currency: "INR",
      reason: "seller_no_release",
      description: "I transferred full amount on 4 Mar 16:18 IST but seller has not released crypto.",
      ocr_extracted: { merchant: "Rahul Kumar (Rahul12)", amount: "₹443.87", date: "4 Mar 2026, 16:18 IST", reference: "UTR4892761833", bank: "HDFC Bank Ltd." },
      chat_summary: "Seller suggested moving to WhatsApp at 16:05. Sent 3 messages asking buyer to cancel before payment. Response time jumped from 2 min to 18 min.",
      buyer_tier: "Bronze", seller_tier: "Gold",
      buyer_join_days: 12, seller_join_days: 210,
      buyer_lifetime_orders: 4, seller_lifetime_orders: 7340,
      buyer_dispute_free_days: 12, seller_dispute_free_days: 45,
    };
    try {
      const res = await fetch("http://localhost:8000/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "thinking")  setThinkingText(t => t + ev.text);
            else if (ev.type === "text") setPhase("streaming");
            else if (ev.type === "result") { setResult(ev.data); setPhase("done"); }
            else if (ev.type === "error")  { setErrMsg(ev.message); setPhase("error"); }
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Connection failed — is the API server running on port 8000?");
      setPhase("error");
    }
  }, []);

  const loading      = phase === "thinking" || phase === "streaming";
  const selectedTicket = TICKETS.find(t => t.id === selectedId) ?? null;

  function openTicket(id: string) { setSelectedId(id); setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); }

  // Counts for the stats bar
  const counts = { new: TICKETS.filter(t => t.col === "new").length, review: TICKETS.filter(t => t.col === "review").length, pending: TICKETS.filter(t => t.col === "pending").length, resolved: TICKETS.filter(t => t.col === "resolved").length };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: font }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Top bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: C.frame, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.textMid, padding: "7px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontFamily: font }}>
              ← Back to demo
            </button>
          )}
          <div style={{ width: 1, height: 20, background: C.border }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>P2P Disputes</div>
            <div style={{ fontSize: 12, color: C.textSub }}>Moderator queue · {TICKETS.length} total cases</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {[["New", counts.new, C.coral], ["In Review", counts.review, C.blue], ["Pending", counts.pending, C.orange], ["Resolved", counts.resolved, C.greenText]].map(([label, count, color], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: color as string }}>{count as number}</div>
              <div style={{ fontSize: 11, color: C.textSub }}>{label as string}</div>
            </div>
          ))}
          <div style={{ width: 1, height: 28, background: C.border }} />
          <button onClick={() => setShowShare(true)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: font, cursor: "pointer" }}>
            Share Case
          </button>
        </div>
      </div>

      {/* SLA alert banner */}
      <div style={{ background: C.coralLight, borderBottom: `1px solid ${C.coralBorder}`, padding: "8px 28px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>⚠</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.coral }}>2 cases approaching SLA deadline</span>
        <span style={{ fontSize: 12, color: C.textSub }}>TKT-89421 and TKT-89408 expire within 4 hours</span>
      </div>

      {/* Kanban board */}
      <div style={{ padding: "24px 28px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            tickets={TICKETS.filter(t => t.col === col.id)}
            selectedId={selectedId}
            onOpenTicket={openTicket}
          />
        ))}
      </div>

      {/* Case drawer */}
      <CaseDrawer
        open={drawerOpen}
        ticket={selectedTicket}
        onClose={closeDrawer}
        triage={result?.triage ?? null}
        match={result?.three_way_match ?? null}
        sentiment={result?.sentiment ?? null}
        ocr={result?.ocr ?? null}
        loading={loading}
        thinkingText={thinkingText}
        phase={phase}
        errMsg={errMsg}
        onRun={runAnalysis}
        onRerun={runAnalysis}
        onShare={() => setShowShare(true)}
      />

      {showShare && <ShareModal result={result} onClose={() => setShowShare(false)} />}
    </div>
  );
}
