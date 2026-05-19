import { useState } from "react";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { OPERATIONAL_PHASES } from "../data/m5os";
import type { Phase } from "../data/m5os";
import { TasksView } from "./tasks/TasksView";
import { ClientesSection } from "./ClientesSection";
import { Footer } from "./Footer";

// Default to "Operação Recorrente" (F7)
const DEFAULT_PHASE_ID = 7;

function PipelineStep({
  phase,
  isActive,
  isLast,
  onClick,
}: {
  phase: Phase;
  isActive: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center flex-1 min-w-0">
      <button
        onClick={onClick}
        className="group flex-1 min-w-0 text-left rounded-xl p-4 transition-all duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FCE4A]"
        style={{
          backgroundColor: isActive ? "#0d1f14" : "#0a0a0a",
          borderColor: isActive ? "#1FCE4A" : "#1a1a1a",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "#1FCE4A44";
            el.style.backgroundColor = "#0d0d0d";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "#1a1a1a";
            el.style.backgroundColor = "#0a0a0a";
          }
        }}
        aria-pressed={isActive}
      >
        {/* Phase number */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={
              isActive
                ? { backgroundColor: "#1FCE4A", color: "#000" }
                : { backgroundColor: "#1a1a1a", color: "#555" }
            }
          >
            {phase.label}
          </span>
          {isActive && (
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#1FCE4A" }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Phase name */}
        <p
          className="text-sm font-semibold leading-snug mb-1 transition-colors duration-150"
          style={{ color: isActive ? "#fff" : "#6B7280" }}
        >
          {phase.name}
        </p>

        {/* Meta */}
        <p className="text-[11px]" style={{ color: isActive ? "#1FCE4A" : "#3a3a3a" }}>
          {phase.meta}
        </p>
      </button>

      {/* Connector arrow */}
      {!isLast && (
        <ChevronRight
          size={16}
          className="flex-shrink-0 mx-2"
          style={{ color: "#2a2a2a" }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function PhaseDetail({ phase }: { phase: Phase }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}
    >
      {/* Detail header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b"
        style={{ borderBottomColor: "#1a1a1a" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded"
            style={{ backgroundColor: "#0d1f14", color: "#1FCE4A", border: "1px solid #1FCE4A33" }}
          >
            {phase.label}
          </span>
          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">{phase.name}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#1FCE4A" }}>{phase.meta}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Em breve")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FCE4A]"
            style={{ borderColor: "#262626", color: "#A3A3A3" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "#1FCE4A";
              el.style.color = "#1FCE4A";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "#262626";
              el.style.color = "#A3A3A3";
            }}
          >
            Detalhar fase
          </button>
          <button
            onClick={() => alert("Em breve")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FCE4A]"
            style={{ borderColor: "#1FCE4A", color: "#1FCE4A" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = "#1FCE4A";
              el.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = "transparent";
              el.style.color = "#1FCE4A";
            }}
          >
            Plano de IA
          </button>
        </div>
      </div>

      {/* Why quote */}
      <div
        className="mx-6 mt-4 mb-0 px-4 py-3 rounded-xl italic text-sm leading-relaxed"
        style={{
          borderLeft: "3px solid #1FCE4A",
          backgroundColor: "#060f09",
          color: "#d4d4d4",
        }}
      >
        &ldquo;{phase.why}&rdquo;
      </div>

      {/* Items */}
      <ul className="px-6 py-4 space-y-2.5" role="list">
        {phase.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2
              size={14}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#1FCE4A" }}
              aria-hidden="true"
            />
            <span className="text-sm text-white leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OperacaoView() {
  const [activePhaseId, setActivePhaseId] = useState<number>(DEFAULT_PHASE_ID);
  const activePhase =
    OPERATIONAL_PHASES.find((p) => p.id === activePhaseId) ?? OPERATIONAL_PHASES[2];

  return (
    <div className="flex flex-col min-h-0">
      <div className="max-w-screen-xl mx-auto w-full px-6 py-8 space-y-8">

        {/* ── Pipeline operacional ────────────────────────────────────────── */}
        <section aria-labelledby="pipeline-title">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p
                className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                style={{ color: "#1FCE4A" }}
              >
                Pipeline Operacional
              </p>
              <h2
                id="pipeline-title"
                className="text-white font-bold text-lg leading-tight"
              >
                Jornada pós-venda do cliente
              </h2>
            </div>
            <p className="text-[#333] text-xs hidden sm:block">
              Selecione uma fase para ver o checklist
            </p>
          </div>

          {/* Steps */}
          <div className="flex items-stretch gap-0 mb-5">
            {OPERATIONAL_PHASES.map((phase, idx) => (
              <PipelineStep
                key={phase.id}
                phase={phase}
                isActive={phase.id === activePhaseId}
                isLast={idx === OPERATIONAL_PHASES.length - 1}
                onClick={() => setActivePhaseId(phase.id)}
              />
            ))}
          </div>

          {/* Detail */}
          <PhaseDetail phase={activePhase} />
        </section>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "#1a1a1a" }} />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#333" }}>
            Gestão de entregas
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#1a1a1a" }} />
        </div>

        {/* ── Tarefas ─────────────────────────────────────────────────────── */}
        <TasksView />

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "#1a1a1a" }} />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#333" }}>
            Carteira de clientes
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#1a1a1a" }} />
        </div>

        {/* ── Clientes ────────────────────────────────────────────────────── */}
        <ClientesSection compact={false} />
      </div>

      <Footer />
    </div>
  );
}
