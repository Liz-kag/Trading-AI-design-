import { useState } from "react";
import DisputeFlowDemo from "./DisputeFlowDemo";
import AIAnalysisDashboard from "./AIAnalysisDashboard";

export default function App() {
  const [view, setView] = useState<"demo" | "dashboard">("demo");

  if (view === "dashboard") {
    return <AIAnalysisDashboard onBack={() => setView("demo")} />;
  }

  return (
    <div>
      <DisputeFlowDemo />
      {/* Persistent shortcut to the AI dashboard */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
        <button
          onClick={() => setView("dashboard")}
          style={{
            padding: "10px 20px", borderRadius: 24,
            background: "linear-gradient(135deg,#7c3aed,#ff444f)",
            color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
            fontFamily: "Inter, sans-serif", cursor: "pointer",
            boxShadow: "0 4px 20px #7c3aed44",
          }}
        >
          🤖 AI Dashboard
        </button>
      </div>
    </div>
  );
}
