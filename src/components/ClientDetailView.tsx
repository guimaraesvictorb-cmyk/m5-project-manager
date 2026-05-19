import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft, Globe, User, Phone, Mail, DollarSign, Tag,
  Plus, Check, Trash2, Brain, Send, Loader2, Sparkles,
  BookOpen, X, ChevronDown
} from "lucide-react"
import type { Client } from "../lib/database.types"
import { useClientKnowledge, type KnowledgeEntry } from "../hooks/useClientKnowledge"
import { useAuth } from "../hooks/useAuth"

const GROQ_API_KEY_ENV = import.meta.env.VITE_GROQ_API_KEY as string | undefined

const FLAG_META = {
  green:  { label: "Green",  color: "#1FCE4A", bg: "#0d1f14" },
  yellow: { label: "Yellow", color: "#F59E0B", bg: "#1a1200" },
  red:    { label: "Red",    color: "#EF4444", bg: "#1a0505" },
}

const STATUS_META: Record<Client["status"], { label: string; color: string }> = {
  ativo:       { label: "Ativo",       color: "#1FCE4A" },
  pausado:     { label: "Pausado",     color: "#F59E0B" },
  em_risco:    { label: "Em Risco",    color: "#EF4444" },
  offboarding: { label: "Offboarding", color: "#8B5CF6" },
  churned:     { label: "Churned",     color: "#525252" },
}

const SOURCE_META = {
  manual:       { label: "Manual",     color: "#2563EB", bg: "#0a0f1a" },
  ai_suggested: { label: "IA",         color: "#8B5CF6", bg: "#0f0a1a" },
  web:          { label: "Web",        color: "#F59E0B", bg: "#1a1200" },
}

type Tab = "overview" | "knowledge" | "ai"

interface ChatMessage { role: "user" | "assistant"; content: string }

// ── helpers ──────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-3" style={{ borderBottom: "1px solid #111" }}>
      <p className="text-xs pt-0.5" style={{ color: "#555" }}>{label}</p>
      <div className="text-sm text-white">{value}</div>
    </div>
  )
}

function KnowledgeCard({
  entry,
  onValidate,
  onDelete,
}: {
  entry: KnowledgeEntry
  onValidate?: () => void
  onDelete: () => void
}) {
  const src = SOURCE_META[entry.source]
  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-white leading-snug">{entry.title}</p>
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
              style={{ backgroundColor: src.bg, color: src.color }}
            >
              {src.label}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{entry.content}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onValidate && (
            <button
              onClick={onValidate}
              title="Validar"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#1FCE4A" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0d1f14")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent")}
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={onDelete}
            title="Excluir"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "#444" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#EF4444")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add entry modal ───────────────────────────────────────────────────────────
function AddEntryModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string, content: string) => Promise<void> }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    await onSave(title.trim(), content.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ backgroundColor: "#0d0d0d", border: "1px solid #1e1e1e" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Adicionar Informação</h3>
          <button onClick={onClose} style={{ color: "#555" }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#555" }}>Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto principal, Público-alvo..."
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none"
              style={{ backgroundColor: "#080808", border: "1px solid #1e1e1e" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1FCE4A44")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#555" }}>Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva a informação com detalhes..."
              required
              rows={4}
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none resize-none"
              style={{ backgroundColor: "#080808", border: "1px solid #1e1e1e" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1FCE4A44")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border" style={{ borderColor: "#1e1e1e", color: "#555" }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !content.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1FCE4A", color: "#000", opacity: saving || !title.trim() || !content.trim() ? 0.4 : 1 }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
function ClientAI({ client, validated }: { client: Client; validated: KnowledgeEntry[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  function buildSystemPrompt() {
    const knowledgeText = validated.length
      ? "\n\nBase de conhecimento validada sobre este cliente:\n" +
        validated.map((e) => `- ${e.title}: ${e.content}`).join("\n")
      : ""

    return `Você é o assistente de IA dedicado ao cliente "${client.name}" da agência M5 Marketing.
Responda SEMPRE em português brasileiro. Seja objetivo, profissional e focado em marketing digital.

Dados do cliente:
- Nome: ${client.name}
- Segmento: ${client.segment ?? "não informado"}
- Status: ${STATUS_META[client.status].label}
- Mensalidade: ${client.monthly_fee ? `R$ ${client.monthly_fee.toLocaleString("pt-BR")}` : "não informado"}
- Contato: ${client.primary_contact_name ?? "não informado"}
- Website: ${client.website ?? "não informado"}${knowledgeText}

Use APENAS as informações acima como fonte confiável sobre o cliente. Não invente informações. Se não souber algo sobre o cliente, diga que a informação não foi cadastrada ainda.`
  }

  async function sendMessage(userMsg: string) {
    if (!userMsg.trim() || streaming) return
    const apiKey = GROQ_API_KEY_ENV || localStorage.getItem("m5os_groq_key") || ""
    if (!apiKey) return

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }]
    setMessages(newMessages)
    setInput("")
    setStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          stream: true,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            ...newMessages,
          ],
        }),
      })

      if (!res.ok || !res.body) throw new Error("Falha na requisição")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let assistantText = ""
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          const data = line.replace(/^data: /, "").trim()
          if (!data || data === "[DONE]") continue
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content ?? ""
            if (delta) {
              assistantText += delta
              setMessages((prev) => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: "assistant", content: assistantText }
                return copy
              })
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: "Erro ao conectar com a IA. Tente novamente." }])
      }
    } finally {
      setStreaming(false)
    }
  }

  const apiKey = GROQ_API_KEY_ENV || localStorage.getItem("m5os_groq_key") || ""

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {!apiKey ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <Brain size={32} className="mx-auto mb-3" style={{ color: "#333" }} />
            <p className="text-sm font-semibold text-white mb-1">IA não configurada</p>
            <p className="text-xs" style={{ color: "#555" }}>
              Configure sua chave Groq no assistente principal (aba Home) para ativar a IA por cliente.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Context pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl mb-4" style={{ backgroundColor: "#0a0f0d", border: "1px solid #0d1f14" }}>
            <BookOpen size={12} style={{ color: "#1FCE4A" }} />
            <p className="text-[11px]" style={{ color: "#555" }}>
              IA especializada em <span className="text-white font-medium">{client.name}</span> —{" "}
              {validated.length} {validated.length === 1 ? "informação validada" : "informações validadas"} na base de conhecimento
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Brain size={28} className="mx-auto mb-3" style={{ color: "#222" }} />
                <p className="text-sm font-semibold text-white mb-1">IA do Cliente</p>
                <p className="text-xs" style={{ color: "#444" }}>
                  Pergunte qualquer coisa sobre {client.name}. Eu uso apenas informações validadas.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="rounded-2xl px-4 py-3 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { backgroundColor: "#0d1f14", color: "#fff", borderBottomRightRadius: 4 }
                      : { backgroundColor: "#111", color: "#ddd", borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.content || (streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
            className="flex items-center gap-2 mt-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Pergunte sobre ${client.name}...`}
              disabled={streaming}
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none"
              style={{ backgroundColor: "#0d0d0d", border: "1px solid #1e1e1e" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1FCE4A44")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ backgroundColor: "#1FCE4A", color: "#000" }}
            >
              <Send size={15} />
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface ClientDetailViewProps {
  client: Client
  onBack: () => void
}

export function ClientDetailView({ client, onBack }: ClientDetailViewProps) {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>("overview")
  const [showAddModal, setShowAddModal] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const { validated, pending, addEntry, validateEntry, deleteEntry } = useClientKnowledge(client.id)

  const flag = FLAG_META[client.health_flag]
  const status = STATUS_META[client.status]

  const canEdit = profile?.role === "admin" || profile?.role === "coordenador"

  async function handleAddManual(title: string, content: string) {
    await addEntry({
      client_id: client.id,
      title,
      content,
      source: "manual",
      validated: true,
      created_by: profile?.id ?? null,
    })
  }

  async function handleAISuggest() {
    const apiKey = GROQ_API_KEY_ENV || localStorage.getItem("m5os_groq_key") || ""
    if (!apiKey || suggesting) return
    setSuggesting(true)

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Você é um especialista em marketing digital. Dado o nome e segmento de um cliente de agência, sugira 3 informações relevantes sobre o negócio que ajudariam a criar estratégias de marketing. Responda APENAS em JSON, no formato:
[{"title": "...", "content": "..."}, ...]
Não inclua nenhum texto fora do JSON. Seja específico e útil para uma agência de marketing digital.`,
            },
            {
              role: "user",
              content: `Cliente: ${client.name}\nSegmento: ${client.segment ?? "não informado"}\nWebsite: ${client.website ?? "não informado"}\n\nSugira 3 informações relevantes sobre este cliente para uma agência de marketing.`,
            },
          ],
        }),
      })

      if (!res.ok) throw new Error("Falha na requisição")
      const json = await res.json()
      const text = json.choices?.[0]?.message?.content ?? "[]"

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error("JSON não encontrado")
      const suggestions: Array<{ title: string; content: string }> = JSON.parse(jsonMatch[0])

      for (const s of suggestions) {
        if (s.title && s.content) {
          await addEntry({
            client_id: client.id,
            title: s.title,
            content: s.content,
            source: "ai_suggested",
            validated: false,
            created_by: profile?.id ?? null,
          })
        }
      }
    } catch {}
    setSuggesting(false)
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Visão Geral" },
    { id: "knowledge", label: `Base de Conhecimento${pending.length ? ` (${pending.length})` : ""}` },
    { id: "ai", label: "IA do Cliente" },
  ]

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#060606" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5" style={{ borderBottom: "1px solid #111" }}>
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#555" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#555"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: "#1FCE4A22", border: "1px solid #1FCE4A33" }}
          >
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-base leading-tight truncate">{client.name}</h1>
            {client.segment && <p className="text-xs truncate" style={{ color: "#555" }}>{client.segment}</p>}
          </div>
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: flag.bg, color: flag.color, border: `1px solid ${flag.color}33` }}
          >
            {flag.label}
          </span>
          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-8" style={{ borderBottom: "1px solid #111" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-3 text-xs font-medium transition-colors relative"
            style={{ color: tab === t.id ? "#fff" : "#555" }}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ backgroundColor: "#1FCE4A" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6" style={{ minHeight: 0 }}>

        {/* ── Visão Geral ── */}
        {tab === "overview" && (
          <div className="max-w-2xl">
            <div>
              {client.primary_contact_name && (
                <Field label={<><User size={11} className="inline mr-1" />Contato</>} value={client.primary_contact_name} />
              )}
              {client.primary_contact_email && (
                <Field label={<><Mail size={11} className="inline mr-1" />E-mail</>} value={
                  <a href={`mailto:${client.primary_contact_email}`} className="text-sm" style={{ color: "#1FCE4A" }}>
                    {client.primary_contact_email}
                  </a>
                } />
              )}
              {client.primary_contact_phone && (
                <Field label={<><Phone size={11} className="inline mr-1" />Telefone</>} value={client.primary_contact_phone} />
              )}
              {client.website && (
                <Field label={<><Globe size={11} className="inline mr-1" />Website</>} value={
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1" style={{ color: "#1FCE4A" }}>
                    {client.website.replace(/^https?:\/\//, "")}
                  </a>
                } />
              )}
              {client.segment && (
                <Field label={<><Tag size={11} className="inline mr-1" />Segmento</>} value={client.segment} />
              )}
              {client.monthly_fee && (
                <Field label={<><DollarSign size={11} className="inline mr-1" />Mensalidade</>} value={
                  <span style={{ color: "#1FCE4A" }} className="font-medium">
                    R$ {client.monthly_fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                } />
              )}
              {client.contract_start && (
                <Field label="Início do contrato" value={new Date(client.contract_start).toLocaleDateString("pt-BR")} />
              )}
              {client.notes && (
                <div className="py-4" style={{ borderBottom: "1px solid #111" }}>
                  <p className="text-xs mb-2" style={{ color: "#555" }}>Observações</p>
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>
            {!client.primary_contact_name && !client.website && !client.segment && !client.monthly_fee && !client.notes && (
              <div className="text-center py-12">
                <p className="text-sm font-semibold text-white mb-1">Nenhum dado adicional</p>
                <p className="text-xs" style={{ color: "#444" }}>As informações do cliente aparecerão aqui</p>
              </div>
            )}
          </div>
        )}

        {/* ── Base de Conhecimento ── */}
        {tab === "knowledge" && (
          <div className="max-w-2xl space-y-6">
            {/* Actions */}
            {canEdit && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "#1FCE4A", color: "#000" }}
                >
                  <Plus size={13} />
                  Adicionar informação
                </button>
                <button
                  onClick={handleAISuggest}
                  disabled={suggesting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50"
                  style={{ borderColor: "#8B5CF633", color: "#8B5CF6", backgroundColor: "#0f0a1a" }}
                >
                  {suggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {suggesting ? "Gerando sugestões..." : "Sugerir com IA"}
                </button>
              </div>
            )}

            {/* Pending review */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8B5CF6" }}>
                    Aguardando validação ({pending.length})
                  </p>
                </div>
                <div className="space-y-3">
                  {pending.map((entry) => (
                    <KnowledgeCard
                      key={entry.id}
                      entry={entry}
                      onValidate={canEdit ? () => validateEntry(entry.id) : undefined}
                      onDelete={() => deleteEntry(entry.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Validated */}
            <div>
              {validated.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#1FCE4A" }}>
                    Validado ({validated.length})
                  </p>
                  <div className="space-y-3">
                    {validated.map((entry) => (
                      <KnowledgeCard
                        key={entry.id}
                        entry={entry}
                        onDelete={() => deleteEntry(entry.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              {validated.length === 0 && pending.length === 0 && (
                <div className="text-center py-16 rounded-xl border border-[#1a1a1a]" style={{ backgroundColor: "#0a0a0a" }}>
                  <BookOpen size={28} className="mx-auto mb-3" style={{ color: "#222" }} />
                  <p className="text-sm font-semibold text-white mb-1">Base de conhecimento vazia</p>
                  <p className="text-xs mb-4" style={{ color: "#444" }}>
                    Adicione informações manualmente ou use a IA para sugerir conteúdo relevante
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="text-xs font-semibold px-4 py-2 rounded-lg"
                      style={{ backgroundColor: "#1FCE4A", color: "#000" }}
                    >
                      + Adicionar primeira informação
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── IA do Cliente ── */}
        {tab === "ai" && (
          <div className="max-w-2xl flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
            <ClientAI client={client} validated={validated} />
          </div>
        )}
      </div>

      {showAddModal && (
        <AddEntryModal onClose={() => setShowAddModal(false)} onSave={handleAddManual} />
      )}
    </div>
  )
}
