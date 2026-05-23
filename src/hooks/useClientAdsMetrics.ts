import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface AdsMetric {
  id: string
  client_id: string
  platform: 'meta' | 'google'
  period: string
  investimento: number | null
  impressoes: number | null
  alcance: number | null
  cliques: number | null
  ctr: number | null
  resultados: number | null
  custo_por_resultado: number | null
  cpc: number | null
  conversoes: number | null
  custo_por_conversao: number | null
  roas: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export type AdsMetricInput = Omit<AdsMetric, 'id' | 'created_at' | 'updated_at'>

export function useClientAdsMetrics(clientId: string) {
  const [metrics, setMetrics] = useState<AdsMetric[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('client_ads_metrics')
      .select('*')
      .eq('client_id', clientId)
      .order('period', { ascending: false })
    setMetrics(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { refetch() }, [refetch])

  async function upsertMetric(input: AdsMetricInput) {
    const { data, error } = await supabase
      .from('client_ads_metrics')
      .upsert(input, { onConflict: 'client_id,platform,period' })
      .select()
      .single()
    if (error) return { error: error.message }
    setMetrics((prev) => {
      const idx = prev.findIndex((m) => m.platform === data.platform && m.period === data.period)
      return idx >= 0 ? prev.map((m, i) => (i === idx ? data : m)) : [data, ...prev]
    })
    return { data }
  }

  async function deleteMetric(id: string) {
    const { error } = await supabase.from('client_ads_metrics').delete().eq('id', id)
    if (error) return { error: error.message }
    setMetrics((prev) => prev.filter((m) => m.id !== id))
    return {}
  }

  const meta = metrics.filter((m) => m.platform === 'meta')
  const google = metrics.filter((m) => m.platform === 'google')

  return { metrics, meta, google, loading, refetch, upsertMetric, deleteMetric }
}
