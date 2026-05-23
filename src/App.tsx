import { useState } from "react";
import "./index.css";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./components/LoginPage";
import { AppNav, type AppView } from "./components/AppNav";
import { HomeView } from "./components/HomeView";
import { DashboardView } from "./components/DashboardView";
import { TarefasView } from "./components/TarefasView";
import { ClientesView } from "./components/ClientesView";
import { FinanceiroView } from "./components/FinanceiroView";
import { PipelineView } from "./components/PipelineView";
import { PlaybookView } from "./components/PlaybookView";
import { CentralView } from "./components/central/CentralView";
import { ProfileView } from "./components/ProfileView";
import { SettingsView } from "./components/SettingsView";
import { RastreamentoView } from "./components/RastreamentoView";
import { SuperAgenteView } from "./components/SuperAgenteView";
import { CopyIAView } from "./components/CopyIAView";
import { RelatoriosView } from "./components/RelatoriosView";
import { WhatsAppView } from "./components/WhatsAppView";
import { IntegracoesView } from "./components/IntegracoesView";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2 } from "lucide-react";

function App() {
  const { user, profile, isAuthenticated, isLoading, logout } = useAuth();
  const [view, setView] = useState<AppView>("home");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "#1FCE4A" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => {}} />;
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
        <AppNav active={view} onChange={setView} profile={profile} onLogout={logout} />

        <main className="flex-1 overflow-y-auto min-h-0">
          {view === "home"       && <HomeView profile={profile} onNavigate={setView} />}
          {view === "dashboard"  && <DashboardView />}
          {view === "tarefas"    && <TarefasView />}
          {view === "clientes"   && <ClientesView />}
          {view === "financeiro" && <FinanceiroView />}
          {view === "pipeline"   && <PipelineView />}
          {view === "processos"     && <PlaybookView />}
          {view === "central"       && <CentralView />}
          {view === "rastreamento"  && <RastreamentoView />}
          {view === "super-agente" && <SuperAgenteView />}
          {view === "copy-ia"      && <CopyIAView />}
          {view === "relatorios"   && <RelatoriosView />}
          {view === "whatsapp"     && <WhatsAppView />}
          {view === "integracoes"  && <IntegracoesView />}
          {view === "profile"    && <ProfileView profile={profile} userEmail={user?.email ?? ""} />}
          {view === "settings"   && <SettingsView profile={profile} />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
