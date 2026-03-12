/**
 * DisputeScreen — Deriv P2P Dispute UI
 * Matches the P2P Enhancements design system (Figma: gyWjGmORjKZeefgNnLC6E3)
 *
 * Renders a bottom sheet on mobile and a centred modal on desktop.
 * Drop this inside the Orders page when an order qualifies for dispute.
 */

import { useState } from "react";

// ─── Design tokens (from Figma variable defs) ────────────────────────────────
const tokens = {
  color: {
    surface: "#ffffff",
    surfaceFrame: "#f6f7f8",
    surfaceDark: "#181c25",
    coral: "#ff444f",
    buy: "#00c390",
    sell: "#de0040",
    border: "#00000014",
    borderMid: "#0000001f",
    textDefault: "#000000b8",
    textHighest: "#181c25",
    textSubtle: "#0000007a",
    textStatic: "#ffffff",
    tagWarningBg: "#ff9c1314",
    tagWarningText: "#c47d00",
    tagInfoBg: "#2c9aff14",
    tagInfoText: "#0777c4",
    tagSuccessBg: "#00883214",
    tagSuccessText: "#007a22",
    tagDangerBg: "#ff444f14",
    tagDangerText: "#ff444f",
    fieldBg: "#00000008",
    overlay: "#00000066",
  },
  radius: {
    chip: 96,
    buttonMd: 16,
    buttonLg: 24,
    card: 8,
    field: 8,
    bottomSheet: 16,
    modal: 16,
    handle: 96,
    tag: 4,
  },
  font: {
    family: "Inter, sans-serif",
    captionRegular: { size: 12, weight: 400, lineHeight: 20 },
    bodySmRegular: { size: 14, weight: 400, lineHeight: 20 },
    bodySmBold: { size: 14, weight: 700, lineHeight: 20 },
    bodyMdRegular: { size: 16, weight: 400, lineHeight: 24 },
    bodyMdBold: { size: 16, weight: 700, lineHeight: 24 },
    h5: { size: 20, weight: 800, lineHeight: 28 },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DisputeReason =
  | "seller_no_release"
  | "payment_not_received"
  | "wrong_amount"
  | "other";

interface Order {
  id: string;
  type: "Buy" | "Sell";
  amount: string;
  currency: string;
  localAmount: string;
  localCurrency: string;
  counterparty: string;
}

interface DisputeScreenProps {
  order: Order;
  onClose: () => void;
  onSubmit: (reason: DisputeReason, description: string) => void;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Tag({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "info" | "warning" | "success" | "danger" | "default";
}) {
  const styles: Record<string, { bg: string; color: string }> = {
    info: { bg: tokens.color.tagInfoBg, color: tokens.color.tagInfoText },
    warning: { bg: tokens.color.tagWarningBg, color: tokens.color.tagWarningText },
    success: { bg: tokens.color.tagSuccessBg, color: tokens.color.tagSuccessText },
    danger: { bg: tokens.color.tagDangerBg, color: tokens.color.tagDangerText },
    default: { bg: "#0000000a", color: tokens.color.textDefault },
  };
  const s = styles[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: tokens.radius.tag,
        backgroundColor: s.bg,
        color: s.color,
        fontSize: tokens.font.captionRegular.size,
        fontWeight: 700,
        lineHeight: `${tokens.font.captionRegular.lineHeight}px`,
        fontFamily: tokens.font.family,
      }}
    >
      {label}
    </span>
  );
}

function ReasonOption({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: DisputeReason;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (id: DisputeReason) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        padding: "12px 16px",
        background: selected ? "#ff444f0a" : tokens.color.surfaceFrame,
        border: `1px solid ${selected ? tokens.color.coral : tokens.color.border}`,
        borderRadius: tokens.radius.card,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
      }}
    >
      {/* Radio circle */}
      <span
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${selected ? tokens.color.coral : tokens.color.borderMid}`,
          backgroundColor: selected ? tokens.color.coral : "transparent",
          marginTop: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
            }}
          />
        )}
      </span>
      <span>
        <span
          style={{
            display: "block",
            fontSize: tokens.font.bodySmBold.size,
            fontWeight: tokens.font.bodySmBold.weight,
            lineHeight: `${tokens.font.bodySmBold.lineHeight}px`,
            color: tokens.color.textHighest,
            fontFamily: tokens.font.family,
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontSize: tokens.font.captionRegular.size,
            fontWeight: tokens.font.captionRegular.weight,
            lineHeight: `${tokens.font.captionRegular.lineHeight}px`,
            color: tokens.color.textSubtle,
            fontFamily: tokens.font.family,
            marginTop: 2,
          }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

function DisputeForm({ order, onClose, onSubmit }: DisputeScreenProps) {
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons: { id: DisputeReason; label: string; description: string }[] = [
    {
      id: "seller_no_release",
      label: "Seller didn't release crypto",
      description: "I've made the payment but seller hasn't released the funds",
    },
    {
      id: "payment_not_received",
      label: "Payment not received",
      description: "I haven't received the payment from the buyer",
    },
    {
      id: "wrong_amount",
      label: "Wrong payment amount",
      description: "The amount paid doesn't match the agreed order amount",
    },
    {
      id: "other",
      label: "Other",
      description: "Describe your issue in the field below",
    },
  ];

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    await onSubmit(reason, description);
    setSubmitting(false);
  }

  const canSubmit = reason !== null && (reason !== "other" || description.trim().length > 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: tokens.font.family,
      }}
    >
      {/* Handle bar (mobile only, hidden on desktop via parent) */}
      <div
        className="dispute-handle"
        style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}
      >
        <div
          style={{
            width: 48,
            height: 4,
            borderRadius: tokens.radius.handle,
            backgroundColor: "#0000003d",
          }}
        />
      </div>

      {/* Dark header */}
      <div
        style={{
          backgroundColor: tokens.color.surfaceDark,
          padding: "16px 24px 20px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: tokens.font.h5.size,
              fontWeight: tokens.font.h5.weight,
              lineHeight: `${tokens.font.h5.lineHeight}px`,
              color: tokens.color.textStatic,
            }}
          >
            Raise a Dispute
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: tokens.color.textStatic,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              opacity: 0.7,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Order summary */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            backgroundColor: "#ffffff0a",
            borderRadius: tokens.radius.card,
          }}
        >
          <span
            style={{
              fontSize: tokens.font.bodyMdBold.size,
              fontWeight: tokens.font.bodyMdBold.weight,
              color: order.type === "Buy" ? tokens.color.buy : tokens.color.sell,
            }}
          >
            {order.type}
          </span>
          <span
            style={{
              fontSize: tokens.font.bodyMdBold.size,
              fontWeight: tokens.font.bodyMdBold.weight,
              color: tokens.color.textStatic,
            }}
          >
            {order.amount} {order.currency}
          </span>
          <span
            style={{
              fontSize: tokens.font.bodySmRegular.size,
              color: "#ffffff7a",
              marginLeft: "auto",
            }}
          >
            ID: {order.id}
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: tokens.font.bodySmRegular.size,
            color: "#ffffff7a",
          }}
        >
          {order.type === "Buy" ? "You pay:" : "You receive:"}{" "}
          <span style={{ color: "#ffffffb8", fontWeight: 700 }}>
            {order.localAmount} {order.localCurrency}
          </span>{" "}
          · Counterparty:{" "}
          <span style={{ color: "#ffffffb8" }}>{order.counterparty}</span>
        </div>

        <Tag label="Under Dispute" variant="warning" />
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          backgroundColor: tokens.color.surface,
        }}
      >
        <p
          style={{
            margin: "0 0 16px",
            fontSize: tokens.font.bodySmBold.size,
            fontWeight: tokens.font.bodySmBold.weight,
            color: tokens.color.textHighest,
          }}
        >
          What is your reason for raising a dispute?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reasons.map((r) => (
            <ReasonOption
              key={r.id}
              id={r.id}
              label={r.label}
              description={r.description}
              selected={reason === r.id}
              onSelect={setReason}
            />
          ))}
        </div>

        {/* Description */}
        <div style={{ marginTop: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: tokens.font.bodySmBold.size,
              fontWeight: tokens.font.bodySmBold.weight,
              color: tokens.color.textHighest,
              marginBottom: 8,
            }}
          >
            Additional details{reason !== "other" && " (optional)"}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail…"
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: tokens.font.bodySmRegular.size,
              lineHeight: `${tokens.font.bodySmRegular.lineHeight}px`,
              fontFamily: tokens.font.family,
              color: tokens.color.textDefault,
              backgroundColor: tokens.color.fieldBg,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.field,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <p
            style={{
              margin: "6px 0 0",
              fontSize: tokens.font.captionRegular.size,
              color: tokens.color.textSubtle,
            }}
          >
            Your dispute will be reviewed by our P2P team within 24 hours.
          </p>
        </div>
      </div>

      {/* Footer buttons */}
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: tokens.color.surface,
          borderTop: `1px solid ${tokens.color.border}`,
          display: "flex",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            flex: 1,
            height: 48,
            borderRadius: tokens.radius.buttonLg,
            border: `1px solid ${tokens.color.borderMid}`,
            backgroundColor: "transparent",
            color: tokens.color.textHighest,
            fontSize: tokens.font.bodyMdBold.size,
            fontWeight: tokens.font.bodyMdBold.weight,
            fontFamily: tokens.font.family,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            flex: 1,
            height: 48,
            borderRadius: tokens.radius.buttonLg,
            border: "none",
            backgroundColor: canSubmit ? tokens.color.coral : "#0000001f",
            color: canSubmit ? "#ffffff" : tokens.color.textSubtle,
            fontSize: tokens.font.bodyMdBold.size,
            fontWeight: tokens.font.bodyMdBold.weight,
            fontFamily: tokens.font.family,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "background 0.15s ease",
          }}
        >
          {submitting ? "Submitting…" : "Raise Dispute"}
        </button>
      </div>
    </div>
  );
}

// ─── Mobile bottom sheet ──────────────────────────────────────────────────────

export function DisputeBottomSheet(props: DisputeScreenProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={props.onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: tokens.color.overlay,
          zIndex: 100,
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          backgroundColor: tokens.color.surface,
          borderRadius: `${tokens.radius.bottomSheet}px ${tokens.radius.bottomSheet}px 0 0`,
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -4px 24px #0000001a",
        }}
      >
        <DisputeForm {...props} />
      </div>
    </>
  );
}

// ─── Desktop modal ────────────────────────────────────────────────────────────

export function DisputeModal(props: DisputeScreenProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={props.onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: tokens.color.overlay,
          zIndex: 100,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.modal,
          width: 480,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 16px 48px #00000033",
        }}
      >
        {/* Hide handle bar on desktop */}
        <style>{`.dispute-handle { display: none; }`}</style>
        <DisputeForm {...props} />
      </div>
    </>
  );
}

// ─── Responsive wrapper ───────────────────────────────────────────────────────

export function DisputeScreen(props: DisputeScreenProps) {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;
  return isMobile ? (
    <DisputeBottomSheet {...props} />
  ) : (
    <DisputeModal {...props} />
  );
}

// ─── Demo / usage example ─────────────────────────────────────────────────────

export default function App() {
  const [open, setOpen] = useState(false);

  const mockOrder: Order = {
    id: "0987329",
    type: "Buy",
    amount: "5.00",
    currency: "USD",
    localAmount: "83,833.75",
    localCurrency: "IDR",
    counterparty: "Farid07",
  };

  return (
    <div
      style={{
        fontFamily: tokens.font.family,
        padding: 24,
        backgroundColor: tokens.color.surfaceFrame,
        minHeight: "100vh",
      }}
    >
      <h2
        style={{
          fontSize: tokens.font.h5.size,
          fontWeight: tokens.font.h5.weight,
          color: tokens.color.textHighest,
          marginBottom: 16,
        }}
      >
        Active Orders
      </h2>

      {/* Sample order card */}
      <div
        style={{
          backgroundColor: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.card,
          padding: "16px",
          maxWidth: 390,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Tag label="Waiting seller's confirmation" variant="warning" />
          <span
            style={{
              fontSize: tokens.font.captionRegular.size,
              color: tokens.color.textSubtle,
            }}
          >
            00:00:30
          </span>
        </div>
        <p
          style={{
            margin: "4px 0",
            fontSize: tokens.font.bodyMdBold.size,
            fontWeight: tokens.font.bodyMdBold.weight,
          }}
        >
          <span style={{ color: tokens.color.buy }}>Buy </span>
          <span style={{ color: tokens.color.textHighest }}>5.00 USD</span>
        </p>
        <p
          style={{
            margin: "0 0 12px",
            fontSize: tokens.font.bodySmRegular.size,
            color: tokens.color.textSubtle,
          }}
        >
          You pay: 83,833.75 IDR · {mockOrder.counterparty}
        </p>
        <button
          onClick={() => setOpen(true)}
          style={{
            width: "100%",
            height: 40,
            borderRadius: tokens.radius.buttonMd,
            border: `1px solid ${tokens.color.coral}`,
            backgroundColor: "transparent",
            color: tokens.color.coral,
            fontSize: tokens.font.bodySmBold.size,
            fontWeight: tokens.font.bodySmBold.weight,
            fontFamily: tokens.font.family,
            cursor: "pointer",
          }}
        >
          Raise a Dispute
        </button>
      </div>

      {open && (
        <DisputeScreen
          order={mockOrder}
          onClose={() => setOpen(false)}
          onSubmit={async (reason, desc) => {
            console.log("Dispute submitted:", { reason, desc });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
