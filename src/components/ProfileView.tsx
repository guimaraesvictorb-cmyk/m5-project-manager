import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/database.types";
import { ShieldCheck, Save, KeyRound, User } from "lucide-react";
import { Footer } from "./Footer";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador", coordenador: "Coordenador", gt: "Gestor de Tráfego", gp: "Gestor de Projetos",
};

interface ProfileViewProps { profile: Profile | null }

export function ProfileView({ profile }: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState(false);

  const [, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function handleSaveName() {
    if (!profile || !displayName.trim()) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", profile.id);
    setSaving(false);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) { setPwError("As senhas não coincidem."); return; }
    if (newPw.length < 6) { setPwError("Mínimo 6 caracteres."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 3000);
  }

  const inputClass = "w-full bg-black border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#1FCE4A] transition-colors";
  const inputStyle = { borderColor: "#262626" };

  return (
    <div className="flex flex-col min-h-0">
      <div className="max-w-lg mx-auto w-full px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#1FCE4A" }}>
            Configurações
          </p>
          <h2 className="text-white font-bold text-lg leading-tight">Minha conta</h2>
        </div>

        {/* Profile info */}
        <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-3">
            <User size={16} style={{ color: "#1FCE4A" }} />
            <p className="text-sm font-semibold text-white">Informações pessoais</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Email</label>
            <p className="text-sm px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#060606", color: "#555", border: "1px solid #1a1a1a" }}>
              {profile?.email ?? "—"}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Função</label>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: "#060606", border: "1px solid #1a1a1a" }}
            >
              {profile?.role === "admin" && <ShieldCheck size={13} style={{ color: "#1FCE4A" }} />}
              <p className="text-sm" style={{ color: "#555" }}>
                {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: "#555" }}>
              Nome de exibição
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="Seu nome"
            />
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving || !displayName.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              backgroundColor: savedName ? "#0d2016" : "#1FCE4A",
              color: savedName ? "#1FCE4A" : "#000",
            }}
          >
            <Save size={13} />
            {saving ? "Salvando..." : savedName ? "Salvo!" : "Salvar nome"}
          </button>
        </div>

        {/* Password */}
        <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-3">
            <KeyRound size={16} style={{ color: "#1FCE4A" }} />
            <p className="text-sm font-semibold text-white">Alterar senha</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: "#555" }}>
                Nova senha
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: "#555" }}>
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repita a senha"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {pwError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#1a0505", color: "#ef4444", border: "1px solid #ef444433" }}>
                {pwError}
              </p>
            )}
            {pwSuccess && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#0d1f14", color: "#1FCE4A", border: "1px solid #1FCE4A33" }}>
                Senha alterada com sucesso!
              </p>
            )}

            <button
              type="submit"
              disabled={savingPw || !newPw || !confirmPw}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: "#1FCE4A", color: "#000" }}
            >
              <KeyRound size={13} />
              {savingPw ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        </div>

      </div>
      <Footer />
    </div>
  );
}
