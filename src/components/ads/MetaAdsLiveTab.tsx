import { useState, useCallback, useEffect } from 'react'
import { RefreshCw, Loader2, Play, Pause, AlertCircle, Settings2, Check, ChevronDown } from 'lucide-react'
import type { Client } from '../../lib/database.types'
import { fmtCurrency, fmt, fmtPct } from '../../lib/formatters'

const META_STORAGE_KEY = 'm5os_meta_token'
const META_GRAPH = 'https://graph.facebook.com/v18.0'

// ─── types ───────────────────────────────────────────────────────────────────

interface CampaignRow {
  id: string
  name: string
  status: string
  objective: string
  spend: number
  purchaseValue: number
  roas: number
  cpa: number
  ticketMedio: number
  addToCart: number
  purchases: number
  conversations: number
  costPerConversation: number
  leads: number
  costPerLead: number
  impressions: number
  reach: number
  clicks: number
  inlineLinkClicks: number
  ctr: number
  inlineLinkClickCtr: number
  cpm: number
  cpc: number
  cpcLink: number
  videoViews: number
  frequency: number
  pageEngagement: number
  results: number
  costPerResult: number
}

// ─── columns definition ───────────────────────────────────────────────────────

type ColKey = keyof Omit<CampaignRow, 'id' | 'name' | 'status' | 'objective'>
type ColFormat = 'currency' | 'number' | 'pct' | 'decimal'

const COLUMNS: { key: ColKey; label: string; fmt: ColFormat }[] = [
  { key: 'spend',                label: 'Investimento',             fmt: 'currency' },
  { key: 'purchaseValue',        label: 'Valor em Compras',         fmt: 'currency' },
  { key: 'roas',                 label: 'ROAS',                     fmt: 'decimal'  },
  { key: 'cpa',                  label: 'CPA Médio',                fmt: 'currency' },
  { key: 'ticketMedio',          label: 'Ticket Médio',             fmt: 'currency' },
  { key: 'addToCart',            label: 'Adições ao carrinho',      fmt: 'number'   },
  { key: 'purchases',            label: 'Compras',                  fmt: 'number'   },
  { key: 'conversations',        label: 'Conversas',                fmt: 'number'   },
  { key: 'costPerConversation',  label: 'Custo por Conversa',       fmt: 'currency' },
  { key: 'leads',                label: 'Leads',                    fmt: 'number'   },
  { key: 'costPerLead',          label: 'Custo por Lead',           fmt: 'currency' },
  { key: 'impressions',          label: 'Impressões',               fmt: 'number'   },
  { key: 'reach',                label: 'Alcance',                  fmt: 'number'   },
  { key: 'clicks',               label: 'Cliques',                  fmt: 'number'   },
  { key: 'inlineLinkClicks',     label: 'Cliques no link',          fmt: 'number'   },
  { key: 'ctr',                  label: 'CTR (Todos)',              fmt: 'pct'      },
  { key: 'inlineLinkClickCtr',   label: 'CTR (Link)',               fmt: 'pct'      },
  { key: 'cpm',                  label: 'CPM Médio',                fmt: 'currency' },
  { key: 'cpc',                  label: 'CPC Médio',                fmt: 'currency' },
  { key: 'cpcLink',              label: 'CPC Médio (Link)',         fmt: 'currency' },
  { key: 'videoViews',           label: 'Visualizações',            fmt: 'number'   },
  { key: 'frequency',            label: 'Frequência',               fmt: 'decimal'  },
  { key: 'pageEngagement',       label: 'Engajamento da página',    fmt: 'number'   },
  { key: 'results',              label: 'Resultados',               fmt: 'number'   },
  { key: 'costPerResult',        label: 'Custo por Resultado',      fmt: 'currency' },
]

const DEFAULT_COLS: ColKey[] = [
  'spend', 'results', 'costPerResult', 'roas', 'impressions', 'clicks', 'ctr', 'cpm',
]

// ─── periods ─────────────────────────────────────────────────────────────────

function periodRange(p: string): { since: string; until: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (p === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    return { since: fmt(s), until: fmt(now) }
  }
  if (p === 'last_month') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const e = new Date(now.getFullYear(), now.getMonth(), 0)
    return { since: fmt(s), until: fmt(e) }
  }
  if (p === '7d') {
    const s = new Date(now); s.setDate(now.getDate() - 6)
    return { since: fmt(s), until: fmt(now) }
  }
  // 30d default
  const s = new Date(now); s.setDate(now.getDate() - 29)
  return { since: fmt(s), until: fmt(now) }
}

const PERIODS = [
  { value: 'month',      label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: '7d',         label: 'Últimos 7 dias' },
  { value: '30d',        label: 'Últimos 30 dias' },
]

// ─── api helpers ──────────────────────────────────────────────────────────────

async function metaGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${META_GRAPH}${path}`)
  url.searchParams.set('access_token', token)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json
}

async function metaPatch(id: string, token: string, body: Record<string, string>) {
  const url = new URL(`${META_GRAPH}/${id}`)
  url.searchParams.set('access_token', token)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json
}

function findAction(actions: { action_type: string; value: string }[] | undefined, types: string[]): number {
  if (!actions) return 0
  return actions
    .filter(a => types.some(t => a.action_type === t || a.action_type.startsWith(t)))
    .reduce((s, a) => s + parseFloat(a.value || '0'), 0)
}

function buildRow(campaign: { id: string; name: string; status: string; objective: string }, ins?: Record<string, unknown>): CampaignRow {
  if (!ins) {
    return { id: campaign.id, name: campaign.name, status: campaign.status, objective: campaign.objective ?? '', spend: 0, purchaseValue: 0, roas: 0, cpa: 0, ticketMedio: 0, addToCart: 0, purchases: 0, conversations: 0, costPerConversation: 0, leads: 0, costPerLead: 0, impressions: 0, reach: 0, clicks: 0, inlineLinkClicks: 0, ctr: 0, inlineLinkClickCtr: 0, cpm: 0, cpc: 0, cpcLink: 0, videoViews: 0, frequency: 0, pageEngagement: 0, results: 0, costPerResult: 0 }
  }

  const actions = ins.actions as { action_type: string; value: string }[] | undefined
  const actionValues = ins.action_values as { action_type: string; value: string }[] | undefined
  const costPer = ins.cost_per_action_type as { action_type: string; value: string }[] | undefined
  const purchaseRoas = ins.purchase_roas as { action_type: string; value: string }[] | undefined

  const spend = parseFloat(ins.spend as string ?? '0')
  const impressions = parseInt(ins.impressions as string ?? '0')
  const reach = parseInt(ins.reach as string ?? '0')
  const clicks = parseInt(ins.clicks as string ?? '0')
  const inlineLinkClicks = parseInt(ins.inline_link_clicks as string ?? '0')
  const ctr = parseFloat(ins.ctr as string ?? '0')
  const inlineLinkClickCtr = parseFloat(ins.inline_link_click_ctr as string ?? '0')
  const cpm = parseFloat(ins.cpm as string ?? '0')
  const cpc = parseFloat(ins.cpc as string ?? '0')
  const frequency = parseFloat(ins.frequency as string ?? '0')

  const purchases = findAction(actions, ['offsite_conversion.fb_pixel_purchase', 'purchase'])
  const purchaseValue = findAction(actionValues, ['offsite_conversion.fb_pixel_purchase', 'purchase'])
  const roas = purchaseRoas?.find(r => r.action_type === 'omni_purchase')?.value
    ?? purchaseRoas?.[0]?.value ?? (spend > 0 && purchaseValue > 0 ? String(purchaseValue / spend) : '0')
  const leads = findAction(actions, ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped'])
  const conversations = findAction(actions, ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.total_messaging_connection'])
  const addToCart = findAction(actions, ['add_to_cart', 'offsite_conversion.fb_pixel_add_to_cart'])
  const pageEngagement = findAction(actions, ['page_engagement'])
  const videoViews = (() => {
    const vv = ins.video_p100_watched_actions as { action_type: string; value: string }[] | undefined
    return vv ? vv.reduce((s, v) => s + parseFloat(v.value || '0'), 0) : 0
  })()

  const mainResult = leads > 0 ? leads : (purchases > 0 ? purchases : 0)
  const costPerResult = mainResult > 0 ? spend / mainResult : 0

  const findCost = (types: string[]) => {
    if (!costPer) return 0
    const found = costPer.find(c => types.some(t => c.action_type === t || c.action_type.startsWith(t)))
    return found ? parseFloat(found.value || '0') : 0
  }

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective ?? '',
    spend,
    purchaseValue,
    roas: parseFloat(String(roas)),
    cpa: mainResult > 0 ? spend / mainResult : 0,
    ticketMedio: purchases > 0 ? purchaseValue / purchases : 0,
    addToCart,
    purchases,
    conversations,
    costPerConversation: findCost(['onsite_conversion.messaging_conversation_started_7d']),
    leads,
    costPerLead: findCost(['lead', 'offsite_conversion.fb_pixel_lead']),
    impressions,
    reach,
    clicks,
    inlineLinkClicks,
    ctr,
    inlineLinkClickCtr,
    cpm,
    cpc,
    cpcLink: inlineLinkClicks > 0 ? spend / inlineLinkClicks : 0,
    videoViews,
    frequency,
    pageEngagement,
    results: mainResult,
    costPerResult,
  }
}

function fmtVal(v: number, f: ColFormat): string {
  if (f === 'currency') return fmtCurrency(v)
  if (f === 'pct') return fmtPct(v)
  if (f === 'decimal') return v > 0 ? v.toFixed(2) : '—'
  return fmt(v)
}

// ─── component ────────────────────────────────────────────────────────────────

interface Props { client: Client }

export function MetaAdsLiveTab({ client }: Props) {
  const token = localStorage.getItem(META_STORAGE_KEY) ?? ''
  const accountId = client.meta_ads_account_id ?? ''

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('30d')
  const [toggling, setToggling] = useState<Record<string, boolean>>({})
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(DEFAULT_COLS))
  const [showColPicker, setShowColPicker] = useState(false)
  const [showPaused, setShowPaused] = useState(true)

  const load = useCallback(async () => {
    if (!token || !accountId) return
    setLoading(true)
    setError('')
    try {
      const { since, until } = periodRange(period)

      const [campRes, insRes] = await Promise.all([
        metaGet(`/${accountId}/campaigns`, token, {
          fields: 'id,name,status,objective',
          limit: '100',
        }),
        metaGet(`/${accountId}/insights`, token, {
          fields: 'campaign_id,spend,impressions,reach,clicks,ctr,cpm,cpc,frequency,inline_link_clicks,inline_link_click_ctr,actions,action_values,cost_per_action_type,purchase_roas,video_p100_watched_actions',
          time_range: JSON.stringify({ since, until }),
          level: 'campaign',
          limit: '100',
        }),
      ])

      const insightMap: Record<string, Record<string, unknown>> = {}
      for (const ins of (insRes.data ?? [])) {
        insightMap[ins.campaign_id] = ins
      }

      const rows: CampaignRow[] = (campRes.data ?? []).map(
        (c: { id: string; name: string; status: string; objective: string }) =>
          buildRow(c, insightMap[c.id])
      )

      setCampaigns(rows)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token, accountId, period])

  useEffect(() => { load() }, [load])

  async function toggleStatus(row: CampaignRow) {
    const newStatus = row.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setToggling(t => ({ ...t, [row.id]: true }))
    try {
      await metaPatch(row.id, token, { status: newStatus })
      setCampaigns(prev => prev.map(c => c.id === row.id ? { ...c, status: newStatus } : c))
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setToggling(t => ({ ...t, [row.id]: false }))
    }
  }

  function toggleCol(key: ColKey) {
    setVisibleCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const activeCols = COLUMNS.filter(c => visibleCols.has(c.key))
  const displayed = showPaused ? campaigns : campaigns.filter(c => c.status === 'ACTIVE')

  // Totals
  const totals = displayed.reduce((acc, row) => {
    COLUMNS.forEach(col => { acc[col.key] = (acc[col.key] ?? 0) + row[col.key] })
    return acc
  }, {} as Record<ColKey, number>)
  if (totals.roas && displayed.length > 0) {
    const totalSpend = displayed.reduce((s, r) => s + r.spend, 0)
    const totalPurchaseValue = displayed.reduce((s, r) => s + r.purchaseValue, 0)
    totals.roas = totalSpend > 0 && totalPurchaseValue > 0 ? totalPurchaseValue / totalSpend : 0
  }
  if (totals.frequency && displayed.length > 0) totals.frequency = totals.frequency / displayed.length
  if (totals.ctr && displayed.length > 0) totals.ctr = totals.ctr / displayed.length
  if (totals.inlineLinkClickCtr && displayed.length > 0) totals.inlineLinkClickCtr = totals.inlineLinkClickCtr / displayed.length

  // ── no config ──
  if (!token || !accountId) {
    return (
      <div className="rounded-xl border border-[#1a1a1a] py-14 text-center" style={{ backgroundColor: '#0a0a0a' }}>
        <AlertCircle size={24} className="mx-auto mb-3" style={{ color: '#555' }} />
        <p className="text-sm font-semibold text-white mb-1">Conta não conectada</p>
        <p className="text-xs mb-1" style={{ color: '#555' }}>
          {!token ? 'Configure o token Meta em Integrações → Meta Ads.' : 'Vincule uma conta de anúncios a este cliente em Integrações → Meta Ads.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period */}
        <div className="relative">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="appearance-none rounded-lg px-3 py-1.5 text-xs text-white border pr-6 focus:outline-none cursor-pointer"
            style={{ backgroundColor: '#0d0d0d', borderColor: '#1e1e1e' }}
          >
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#555' }} />
        </div>

        {/* Paused toggle */}
        <button
          onClick={() => setShowPaused(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
          style={{ borderColor: showPaused ? '#1FCE4A44' : '#1e1e1e', color: showPaused ? '#1FCE4A' : '#555', backgroundColor: showPaused ? '#0d1f14' : 'transparent' }}
        >
          {showPaused ? <Check size={11} /> : null}
          Exibir pausadas
        </button>

        {/* Columns picker */}
        <div className="relative">
          <button
            onClick={() => setShowColPicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors"
            style={{ borderColor: '#1e1e1e', color: '#888' }}
          >
            <Settings2 size={11} />
            Colunas ({visibleCols.size})
          </button>
          {showColPicker && (
            <div
              className="absolute left-0 top-8 z-30 rounded-xl p-3 grid grid-cols-2 gap-1 w-72 max-h-72 overflow-y-auto"
              style={{ backgroundColor: '#111', border: '1px solid #1e1e1e' }}
            >
              {COLUMNS.map(col => (
                <button
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] transition-colors"
                  style={{ color: visibleCols.has(col.key) ? '#fff' : '#555', backgroundColor: visibleCols.has(col.key) ? '#0d1f14' : 'transparent' }}
                >
                  {visibleCols.has(col.key) && <Check size={9} style={{ color: '#1FCE4A', flexShrink: 0 }} />}
                  {col.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors disabled:opacity-50"
          style={{ borderColor: '#1e1e1e', color: '#888' }}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#1a0808', color: '#EF4444', border: '1px solid #EF444433' }}>
          <AlertCircle size={12} />{error}
        </div>
      )}

      {/* Table */}
      {loading && campaigns.length === 0 ? (
        <div className="flex justify-center py-14"><Loader2 size={18} className="animate-spin" style={{ color: '#1877F2' }} /></div>
      ) : (
        <div className="rounded-xl border overflow-auto" style={{ borderColor: '#1a1a1a' }}>
          <table className="w-full text-xs" style={{ minWidth: `${200 + activeCols.length * 120}px` }}>
            <thead>
              <tr style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #111' }}>
                <th className="text-left px-3 py-2.5 font-bold uppercase tracking-widest text-[10px] sticky left-0" style={{ color: '#444', backgroundColor: '#0a0a0a', minWidth: 200 }}>
                  Campanha
                </th>
                {activeCols.map(col => (
                  <th key={col.key} className="text-right px-3 py-2.5 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap" style={{ color: '#444' }}>
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: '#444' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={activeCols.length + 2} className="text-center py-12" style={{ color: '#444' }}>
                    Nenhuma campanha encontrada para o período
                  </td>
                </tr>
              )}
              {displayed.map(row => {
                const isActive = row.status === 'ACTIVE'
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #0d0d0d' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-3 py-2.5 sticky left-0" style={{ backgroundColor: 'inherit', minWidth: 200 }}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isActive ? '#1FCE4A' : '#444' }} />
                        <div>
                          <p className="text-white font-medium leading-snug truncate" style={{ maxWidth: 180 }}>{row.name}</p>
                          <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: isActive ? '#1FCE4A' : '#555' }}>
                            {isActive ? 'Ativo' : 'Pausado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    {activeCols.map(col => (
                      <td key={col.key} className="px-3 py-2.5 text-right whitespace-nowrap" style={{ color: col.key === 'spend' ? '#fff' : '#aaa' }}>
                        {fmtVal(row[col.key], col.fmt)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => toggleStatus(row)}
                        disabled={toggling[row.id]}
                        title={isActive ? 'Pausar campanha' : 'Ativar campanha'}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: isActive ? '#EF4444' : '#1FCE4A', border: `1px solid ${isActive ? '#EF444433' : '#1FCE4A33'}` }}
                      >
                        {toggling[row.id] ? <Loader2 size={11} className="animate-spin" /> : isActive ? <Pause size={11} /> : <Play size={11} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {displayed.length > 1 && (
              <tfoot>
                <tr style={{ borderTop: '1px solid #1a1a1a', backgroundColor: '#080808' }}>
                  <td className="px-3 py-2.5 text-xs font-bold sticky left-0" style={{ color: '#555', backgroundColor: '#080808' }}>
                    Total ({displayed.length} campanhas)
                  </td>
                  {activeCols.map(col => (
                    <td key={col.key} className="px-3 py-2.5 text-right text-xs font-bold whitespace-nowrap" style={{ color: '#fff' }}>
                      {fmtVal(totals[col.key] ?? 0, col.fmt)}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <p className="text-[10px]" style={{ color: '#333' }}>
        Dados via Meta Graph API · Conta {accountId}
      </p>
    </div>
  )
}
