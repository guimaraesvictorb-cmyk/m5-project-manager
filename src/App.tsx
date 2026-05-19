import { useState } from "react";
import "./index.css";
import { useAuth } from "./hooks/useAuth";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { AppNav, type AppView } from "./components/AppNav";
import { HomeView } from "./components/HomeView";
import { DashboardView } from "./components/DashboardView";
import { PlaybookView } from "./components/PlaybookView";
import { OperacaoView } from "./components/OperacaoView";
import { FinanceiroView } from "./components/FinanceiroView";
import { PipelineView } from "./components/PipelineView";
import { CentralView } from "./components/central/CentralView";
import { Loader2 } from "lucide-react";

function App() {
  const { profile, isAuthenticated, isLoading, logout } = useAuth();
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
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Header profile={profile} onLogout={logout} />
      <AppNav active={view} onChange={setView} />

      {view === "home"       && <HomeView profile={profile} onNavigate={setView} />}
      {view === "dashboard"  && <DashboardView />}
      {view === "operacao"   && <OperacaoView />}
      {view === "financeiro" && <FinanceiroView />}
      {view === "pipeline"   && <PipelineView />}
      {view === "playbook"   && <PlaybookView />}
      {view === "central"    && <CentralView />}
    </div>
  );
}

export default App;
