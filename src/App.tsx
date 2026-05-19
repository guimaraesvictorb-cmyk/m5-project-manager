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
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <AppNav active={view} onChange={setView} profile={profile} onLogout={logout} />

      <main className="flex-1 overflow-y-auto min-h-0">
        {view === "home"       && <HomeView profile={profile} onNavigate={setView} />}
        {view === "dashboard"  && <DashboardView />}
        {view === "tarefas"    && <TarefasView />}
        {view === "clientes"   && <ClientesView />}
        {view === "financeiro" && <FinanceiroView />}
        {view === "pipeline"   && <PipelineView />}
        {view === "playbook"   && <PlaybookView />}
        {view === "central"    && <CentralView />}
        {view === "profile"    && <ProfileView profile={profile} userEmail={user?.email ?? ""} />}
      </main>
    </div>
  );
}

export default App;
