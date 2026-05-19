import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/database.types";
import {
  ShieldCheck, Save, KeyRound, User, CheckCircle2,
  AlertCircle, Monitor, Smartphone, Globe, LogOut
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coordenador: "Coordenador",
  gt: "Gestor de Tráfego",
  gp: "Gestor de Projetos",
};

const NAV_SECTIONS = [
  {
    label: "Conta",
    items: [
      { id: "perfil", label: "Configurações de perfil" },
      { id: "seguranca", label: "Segurança" },
    ],
  },
];

interface ProfileViewProps { profile: Profile | null; userEmail: string }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4 py-4" style={{ borderBottom: "1px solid #111" }}>
      <p className="text-xs pt-2.5 font-medium" style={{ color: "#555" }}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

const inputCls = "w-full bg-black border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#333] focus:outline-none transition-colors max-w-sm";

export function ProfileView({ profile, userEmail }: ProfileViewProps) {
  const email = profile?.email ?? userEmail;
  const [section, setSection] = useState<"perfil" | "seguranca">("perfil");

  // Perfil state
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState(false);

  // Senha state
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  async function handleSaveName() {
    if (!displayName.trim() || !profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", profile.id);
    setSaving(false);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2500);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSuccess(false);
    if (newPw.length < 6) { setPwError("Mínimo 6 caracteres."); return; }
    if (newPw !== confirmPw) { setPwError("As senhas não coincidem."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 3000);
  }

  const inputStyle = { borderColor: "#1e1e1e" };
  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = "#1FCE4A44");
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = "#1e1e1e");

  return (
    <div className="flex h-full" style={{ backgroundColor: "#060606" }}>

      {/* Sub-sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col py-6 overflow-y-auto"
        style={{ width: 200, borderRight: "1px solid #111", backgroundColor: "#060606" }}
      >
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.label} className="mb-4">
            <p
              className="text-[9px] font-bold tracking-widest uppercase px-4 mb-1"
              style={{ color: "#333" }}
            >
              {sec.label}
            </p>
            {sec.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id as "perfil" | "seguranca")}
                className="w-full text-left px-4 py-2 text-xs transition-colors duration-100"
                style={{
                  color: section === item.id ? "#fff" : "#555",
                  backgroundColor: section === item.id ? "#0d1f14" : "transparent",
                  borderLeft: section === item.id ? "2px solid #1FCE4A" : "2px solid transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl px-10 py-8">

          {/* ── Configurações de perfil ── */}
          {section === "perfil" && (
            <>
              {/* Header com botão salvar */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white font-semibold text-base">Configurações de perfil</h2>
                <button
                  onClick={handleSaveName}
                  disabled={saving || !displayName.trim() || displayName.trim() === (profile?.display_name ?? "")}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                  style={{ backgroundColor: savedName ? "#0d1f14" : "#1FCE4A", color: savedName ? "#1FCE4A" : "#000" }}
                >
                  {savedName ? <CheckCircle2 size={13} /> : <Save size={13} />}
                  {saving ? "Salvando..." : savedName ? "Salvo!" : "Salvar"}
                </button>
              </div>

              {/* Avatar row */}
              <div className="flex items-center gap-6 mb-8 pb-6" style={{ borderBottom: "1px solid #111" }}>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold"
                  style={{ backgroundColor: "#0d1f14", color: "#1FCE4A", border: "2px solid #1FCE4A33" }}
                >
                  {(displayName || email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{displayName || "—"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#555" }}>{email}</p>
                  {profile && (
                    <div className="flex items-center gap-1 mt-2">
                      {profile.role === "admin" && <ShieldCheck size={11} style={{ color: "#1FCE4A" }} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ backgroundColor: "#0d1f14", color: "#1FCE4A" }}>
                        {ROLE_LABELS[profile.role] ?? profile.role}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div>
                <Field label="E-mail">
                  <p className="text-sm py-2.5 px-3 rounded-lg" style={{ color: "#555", backgroundColor: "#0a0a0a", border: "1px solid #111" }}>
                    {email}
                  </p>
                </Field>

                <Field label="Nome de exibição">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    placeholder="Seu nome completo"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </Field>

                <Field label="Função">
                  <p className="text-sm py-2.5 px-3 rounded-lg" style={{ color: "#555", backgroundColor: "#0a0a0a", border: "1px solid #111" }}>
                    {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role ?? "—"}
                  </p>
                </Field>

                {profile?.id && (
                  <Field label="ID do usuário">
                    <p className="text-xs py-2.5 font-mono" style={{ color: "#333" }}>{profile.id}</p>
                  </Field>
                )}
              </div>
            </>
          )}

          {/* ── Segurança ── */}
          {section === "seguranca" && (
            <>
              <h2 className="text-white font-semibold text-base mb-8">Segurança</h2>

              {/* Alterar senha */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={14} style={{ color: "#1FCE4A" }} />
                  <p className="text-sm font-semibold text-white">Alterar senha</p>
                </div>
                <p className="text-xs mb-6" style={{ color: "#555" }}>
                  Após alterar, você será desconectado de todos os dispositivos.
                </p>

                <form onSubmit={handleChangePassword}>
                  <div className="space-y-4">
                    <Field label="Nova senha">
                      <input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={inputCls}
                        style={inputStyle}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </Field>
                    <Field label="Confirmar senha">
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Repita a nova senha"
                        className={inputCls}
                        style={inputStyle}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </Field>
                  </div>

                  {pwError && (
                    <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg max-w-sm" style={{ backgroundColor: "#1a0505", border: "1px solid #ef444433" }}>
                      <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                      <p className="text-xs" style={{ color: "#ef4444" }}>{pwError}</p>
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg max-w-sm" style={{ backgroundColor: "#0d1f14", border: "1px solid #1FCE4A33" }}>
                      <CheckCircle2 size={13} style={{ color: "#1FCE4A", flexShrink: 0 }} />
                      <p className="text-xs" style={{ color: "#1FCE4A" }}>Senha alterada com sucesso!</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingPw || !newPw || !confirmPw}
                    className="flex items-center gap-2 mt-6 px-5 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
                    style={{ backgroundColor: "#1FCE4A", color: "#000" }}
                  >
                    <KeyRound size={13} />
                    {savingPw ? "Alterando..." : "Alterar senha"}
                  </button>
                </form>
              </div>

              {/* Sessões */}
              <div style={{ borderTop: "1px solid #111", paddingTop: "2rem" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={14} style={{ color: "#1FCE4A" }} />
                  <p className="text-sm font-semibold text-white">Sessões ativas</p>
                </div>
                <p className="text-xs mb-6" style={{ color: "#555" }}>
                  Dispositivos com acesso à sua conta. As sessões expiram após 7 dias de inatividade.
                </p>

                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#111" }}>
                  {/* Header */}
                  <div className="grid grid-cols-4 px-4 py-2" style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid #111" }}>
                    {["Sessão", "Último acesso", "Região", ""].map((h) => (
                      <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#333" }}>{h}</p>
                    ))}
                  </div>

                  {/* Current session */}
                  <div className="grid grid-cols-4 items-center px-4 py-3 gap-2" style={{ borderBottom: "1px solid #0d0d0d" }}>
                    <div className="flex items-center gap-2">
                      <Monitor size={13} style={{ color: "#1FCE4A" }} />
                      <span className="text-xs text-white">Este dispositivo</span>
                    </div>
                    <span className="text-xs" style={{ color: "#555" }}>Agora</span>
                    <span className="text-xs" style={{ color: "#555" }}>Osasco, Brasil</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                      style={{ backgroundColor: "#0d1f14", color: "#1FCE4A" }}
                    >
                      Atual
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => supabase.auth.signOut({ scope: "others" })}
                  className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-xs border transition-colors"
                  style={{ borderColor: "#1e1e1e", color: "#555" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e1e1e";
                    (e.currentTarget as HTMLButtonElement).style.color = "#555";
                  }}
                >
                  <LogOut size={13} />
                  Encerrar todas as outras sessões
                </button>
              </div>

              {/* 2FA placeholder */}
              <div style={{ borderTop: "1px solid #111", paddingTop: "2rem", marginTop: "2rem" }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={14} style={{ color: "#1FCE4A" }} />
                  <p className="text-sm font-semibold text-white">Verificação em 2 etapas</p>
                </div>
                <p className="text-xs mb-4" style={{ color: "#555" }}>
                  Adicione uma camada extra de segurança à sua conta.
                </p>
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl border"
                  style={{ backgroundColor: "#0a0a0a", borderColor: "#111" }}
                >
                  <div>
                    <p className="text-xs text-white font-medium">Autenticação por aplicativo</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#444" }}>Google Authenticator, Authy, etc.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ backgroundColor: "#111", color: "#444" }}>
                    Em breve
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
