import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/database.types";
import { ShieldCheck, Save, KeyRound, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Footer } from "./Footer";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coordenador: "Coordenador",
  gt: "Gestor de Tráfego",
  gp: "Gestor de Projetos",
};

interface ProfileViewProps { profile: Profile | null; userEmail: string }

const inputCls = "w-full bg-black border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#333] focus:outline-none transition-colors";
const inputStyle = { borderColor: "#262626" };
const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = "#1FCE4A44");
const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = "#262626");

export function ProfileView({ profile, userEmail }: ProfileViewProps) {
  const email = profile?.email ?? userEmail;
  // Sync displayName when profile loads asynchronously
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState(false);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Update displayName when profile arrives (auth loads profile async)
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  async function handleSaveName() {
    if (!displayName.trim()) return;
    if (!profile) return; // sem tabela profiles ainda
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) {
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2500);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPw.length < 6) { setPwError("A senha deve ter no mínimo 6 caracteres."); return; }
    if (newPw !== confirmPw) { setPwError("As senhas não coincidem."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 3000);
  }

  return (
    <div className="flex flex-col">
      <div className="max-w-lg mx-auto w-full px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#1FCE4A" }}>
            Configurações
          </p>
          <h2 className="text-white font-bold text-lg leading-tight">Minha conta</h2>
        </div>

        {/* Avatar + info rápida */}
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border"
          style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
            style={{ backgroundColor: "#0d1f14", color: "#1FCE4A", border: "1px solid #1FCE4A33" }}
          >
            {(displayName || email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{displayName || "—"}</p>
            <p className="text-xs truncate" style={{ color: "#555" }}>{email}</p>
            {profile && (
              <div className="flex items-center gap-1 mt-1">
                {profile.role === "admin" && <ShieldCheck size={11} style={{ color: "#1FCE4A" }} />}
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "#0d1f14", color: "#1FCE4A" }}
                >
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Editar nome */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-2">
            <User size={14} style={{ color: "#1FCE4A" }} />
            <p className="text-xs font-semibold text-white uppercase tracking-widest">Informações pessoais</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: "#555" }}>
              Email
            </label>
            <p className="text-sm px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#060606", color: "#444", border: "1px solid #1a1a1a" }}>
              {email}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: "#555" }}>
              Nome de exibição
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className={inputCls}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="Seu nome"
            />
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving || !displayName.trim() || displayName.trim() === (profile?.display_name ?? "")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              backgroundColor: savedName ? "#0d1f14" : "#1FCE4A",
              color: savedName ? "#1FCE4A" : "#000",
            }}
          >
            {savedName ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {saving ? "Salvando..." : savedName ? "Salvo!" : "Salvar nome"}
          </button>
        </div>

        {/* Alterar senha */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-2">
            <KeyRound size={14} style={{ color: "#1FCE4A" }} />
            <p className="text-xs font-semibold text-white uppercase tracking-widest">Alterar senha</p>
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
                className={inputCls}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
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
                className={inputCls}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>

            {pwError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#1a0505", border: "1px solid #ef444433" }}>
                <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "#ef4444" }}>{pwError}</p>
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#0d1f14", border: "1px solid #1FCE4A33" }}>
                <CheckCircle2 size={13} style={{ color: "#1FCE4A", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "#1FCE4A" }}>Senha alterada com sucesso!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPw || !newPw || !confirmPw}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
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
