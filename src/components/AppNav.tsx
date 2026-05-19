import { BookOpen, Briefcase, Building2, Sparkles, DollarSign, TrendingUp, LayoutDashboard } from "lucide-react";

export type AppView = "home" | "dashboard" | "playbook" | "operacao" | "financeiro" | "pipeline" | "central";

interface AppNavProps {
  active: AppView;
  onChange: (v: AppView) => void;
}

const TABS: { view: AppView; label: string; icon: React.ReactNode; sub: string }[] = [
  { view: "home",       label: "M5 AI",      icon: <Sparkles size={14} />,      sub: "Assistente" },
  { view: "dashboard",  label: "Dashboard",  icon: <LayoutDashboard size={14} />, sub: "Visão geral" },
  { view: "operacao",   label: "Operação",   icon: <Briefcase size={14} />,     sub: "Tarefas & clientes" },
  { view: "financeiro", label: "Financeiro", icon: <DollarSign size={14} />,    sub: "MRR & pagamentos" },
  { view: "pipeline",   label: "Pipeline",   icon: <TrendingUp size={14} />,    sub: "Comercial" },
  { view: "playbook",   label: "Playbook",   icon: <BookOpen size={14} />,      sub: "Metodologia M5" },
  { view: "central",    label: "Central",    icon: <Building2 size={14} />,     sub: "Processos & docs" },
];

export function AppNav({ active, onChange }: AppNavProps) {
  return (
    <nav className="bg-black border-b px-6 flex-shrink-0" style={{ borderColor: "#1a1a1a" }}>
      <div className="max-w-screen-xl mx-auto flex items-end gap-1">
        {TABS.map(({ view, label, icon, sub }) => {
          const isActive = active === view;
          return (
            <button
              key={view}
              onClick={() => onChange(view)}
              className="group relative flex items-center gap-2 px-4 py-3 text-sm transition-all duration-150 border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FCE4A] focus-visible:ring-inset rounded-t"
              style={{
                borderBottomColor: isActive ? "#1FCE4A" : "transparent",
                color: isActive ? "#ffffff" : "#6B7280",
                backgroundColor: isActive ? "#080808" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "#A3A3A3";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#080808";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span style={{ color: isActive ? "#1FCE4A" : "inherit" }} className="transition-colors duration-150">
                {icon}
              </span>
              <div className="text-left">
                <span className="font-semibold block leading-tight text-xs">{label}</span>
                <span className="text-[10px] leading-tight hidden sm:block" style={{ color: "#3a3a3a" }}>{sub}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
