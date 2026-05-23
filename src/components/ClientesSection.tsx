import { useState, useMemo } from "react";
import { ExternalLink, Plus, Search, Loader2, X, Check } from "lucide-react";
import { useClients } from "../hooks/useClients";
import { useAuth } from "../hooks/useAuth";
import type { Client } from "../lib/database.types";
import { FLAG_META, STATUS_META } from "../lib/clientMeta";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#7C3AED","#2563EB","#059669","#D97706","#DC2626","#0891B2","#B45309","#16A34A"];
function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function ClientCard({ client, onHealthChange, onSelect }: { client: Client; onHealthChange: (id: string, flag: Client["health_flag"]) => void; onSelect: (client: Client) => void }) {
  const flag = FLAG_META[client.health_flag];
  const statusMeta = STATUS_META[client.status];
  const [changingFlag, setChangingFlag] = useState(false);

  return (
    <div
      className="rounded-xl p-4 border border-[#1a1a1a] transition-all duration-150 flex flex-col gap-3 cursor-pointer"
      style={{ backgroundColor: "#0a0a0a" }}
      onClick={() => onSelect(client)}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1FCE4A33")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a")}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: avatarColor(client.id) }}
        >
          {initials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white font-semibold text-sm leading-snug truncate">{client.name}</p>
            {/* Health flag — clicável */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setChangingFlag((v) => !v); }}
                className="flex-shrink-0 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase"
                style={{ backgroundColor: flag.bg, color: flag.color, border: `1px solid ${flag.color}33` }}
              >
                {flag.label}
              </button>
              {changingFlag && (
                <div
                  className="absolute right-0 top-6 z-10 rounded-xl p-1 flex flex-col gap-0.5"
                  style={{ backgroundColor: "#111", border: "1px solid #1e1e1e", minWidth: "90px" }}
                >
                  {(["green", "yellow", "red"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={(e) => { e.stopPropagation(); onHealthChange(client.id, f); setChangingFlag(false); }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-left"
                      style={{ color: FLAG_META[f].color }}
                    >
                      {f === client.health_flag && <Check size={10} />}
                      {FLAG_META[f].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>{client.segment ?? "—"}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-[11px]">
        {client.primary_contact_name && (
          <div className="flex justify-between">
            <span style={{ color: "#555" }}>Contato</span>
            <span className="text-white truncate ml-2">{client.primary_contact_name}</span>
          </div>
        )}
        {client.monthly_fee && (
          <div className="flex justify-between">
            <span style={{ color: "#555" }}>Mensalidade</span>
            <span style={{ color: "#1FCE4A" }} className="font-medium">
              R$ {client.monthly_fee.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span style={{ color: "#555" }}>Status</span>
          <span style={{ color: statusMeta.color }} className="font-medium">{statusMeta.label}</span>
        </div>
      </div>

      {client.website && (
        <a
          href={client.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] transition-colors duration-150 mt-auto"
          style={{ color: "#444" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#1FCE4A")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#444")}
        >
          <ExternalLink size={11} />
          <span className="truncate">{client.website.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
    </div>
  );
}

// Modal de criação de cliente
function NewClientModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<Client>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: "", segment: "", monthly_fee: "", primary_contact_name: "",
    primary_contact_email: "", primary_contact_phone: "",
    website: "", tipo_servico: "", origem_lead: "", proxima_reuniao: "",
  });
  const [saving, setSaving] = useState(false);

  function slug(name: string) {
    return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name: form.name,
      slug: slug(form.name),
      segment: form.segment || null,
      monthly_fee: form.monthly_fee ? parseFloat(form.monthly_fee) : null,
      primary_contact_name: form.primary_contact_name || null,
      primary_contact_email: form.primary_contact_email || null,
      primary_contact_phone: form.primary_contact_phone || null,
      website: form.website || null,
      tipo_servico: form.tipo_servico || null,
      origem_lead: form.origem_lead || null,
      proxima_reuniao: form.proxima_reuniao || null,
      status: "ativo",
      health_flag: "green",
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1e1e1e" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Novo Cliente</h3>
          <button onClick={onClose} style={{ color: "#555" }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "name", label: "Nome *", placeholder: "Nome da empresa", required: true },
            { key: "segment", label: "Segmento", placeholder: "ecommerce, saas, serviços..." },
            { key: "tipo_servico", label: "Tipo de serviço", placeholder: "Tráfego pago, Social media..." },
            { key: "monthly_fee", label: "Mensalidade (R$)", placeholder: "5000", type: "number" },
            { key: "primary_contact_name", label: "Contato principal", placeholder: "Nome do responsável" },
            { key: "primary_contact_email", label: "E-mail do contato", placeholder: "email@empresa.com", type: "email" },
            { key: "primary_contact_phone", label: "Telefone do contato", placeholder: "(11) 99999-9999" },
            { key: "website", label: "Website", placeholder: "https://..." },
            { key: "origem_lead", label: "Origem do lead", placeholder: "Indicação, Instagram, Google..." },
            { key: "proxima_reuniao", label: "Próxima reunião", placeholder: "", type: "datetime-local" },
          ].map(({ key, label, placeholder, required, type }) => (
            <div key={key} className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#555" }}>{label}</label>
              <input
                type={type ?? "text"}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-[#333] focus:outline-none transition-colors"
                style={{ backgroundColor: "#080808", border: "1px solid #1e1e1e" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1FCE4A44")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border" style={{ borderColor: "#1e1e1e", color: "#555" }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.name}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: saving || !form.name ? "#0d1f14" : "#1FCE4A", color: saving || !form.name ? "#333" : "#000" }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClientesSectionProps {
  compact?: boolean;
  onSelectClient?: (client: Client) => void;
}

export function ClientesSection({ compact = false, onSelectClient }: ClientesSectionProps) {
  const { clients, loading, createClient, updateHealthFlag } = useClients();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterFlag, setFilterFlag] = useState("todos");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = useMemo(() => clients.filter((c) => {
    if (filterStatus !== "todos" && c.status !== filterStatus) return false;
    if (filterFlag !== "todos" && c.health_flag !== filterFlag) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.segment ?? "").toLowerCase().includes(q) || (c.primary_contact_name ?? "").toLowerCase().includes(q);
    }
    return true;
  }), [clients, filterStatus, filterFlag, search]);

  const selectCls = "bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors appearance-none cursor-pointer";

  async function handleCreate(data: Partial<Client>) {
    if (!profile) return;
    await createClient({ ...data, created_by: profile.id } as never);
  }

  const ativos = useMemo(() => clients.filter((c) => c.status === "ativo").length, [clients]);
  const emRisco = useMemo(() => clients.filter((c) => c.health_flag === "red").length, [clients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={20} className="animate-spin" style={{ color: "#1FCE4A" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-base font-semibold">Carteira de Clientes</h2>
            <p className="text-xs mt-0.5" style={{ color: "#555" }}>
              {ativos} ativos · {emRisco} em risco
            </p>
          </div>
          {profile?.role === "admin" || profile?.role === "coordenador" ? (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ backgroundColor: "#1FCE4A", color: "#000" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#17b83e")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1FCE4A")}
            >
              <Plus size={13} />
              Novo Cliente
            </button>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#555" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, segmento..."
            className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#1FCE4A44] transition-colors"
          />
        </div>
        <select className={selectCls} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="em_risco">Em Risco</option>
          <option value="pausado">Pausado</option>
          <option value="offboarding">Offboarding</option>
        </select>
        <select className={selectCls} value={filterFlag} onChange={(e) => setFilterFlag(e.target.value)}>
          <option value="todos">Todos os flags</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="red">Red</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1a1a1a] py-16 text-center" style={{ backgroundColor: "#0a0a0a" }}>
          <p className="text-white font-semibold text-sm mb-1">Nenhum cliente encontrado</p>
          <p className="text-xs mb-4" style={{ color: "#444" }}>
            {clients.length === 0 ? "Adicione o primeiro cliente da M5" : "Tente ajustar os filtros"}
          </p>
          {clients.length === 0 && (profile?.role === "admin" || profile?.role === "coordenador") && (
            <button
              onClick={() => setShowNewModal(true)}
              className="text-xs font-semibold px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#1FCE4A", color: "#000" }}
            >
              + Adicionar Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} onHealthChange={updateHealthFlag} onSelect={(c) => onSelectClient?.(c)} />
          ))}
        </div>
      )}

      <p className="text-[11px]" style={{ color: "#333" }}>
        Mostrando {filtered.length} de {clients.length} cliente{clients.length !== 1 ? "s" : ""}
      </p>

      {showNewModal && (
        <NewClientModal onClose={() => setShowNewModal(false)} onSave={handleCreate} />
      )}
    </div>
  );
}
