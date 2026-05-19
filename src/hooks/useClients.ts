import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../lib/database.types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .order('name')

    if (error) setError(error.message)
    else setClients(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function createClient(input: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'data_source'>) {
    const { data, error } = await supabase.from('clients').insert({ ...input, data_source: 'manual' }).select().single()
    if (error) return { error: error.message }
    setClients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data }
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error) return { error: error.message }
    setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
    return { data }
  }

  async function deleteClient(id: string) {
    const { error } = await supabase.from('clients').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    setClients((prev) => prev.filter((c) => c.id !== id))
    return {}
  }

  async function updateHealthFlag(id: string, health_flag: Client['health_flag']) {
    return updateClient(id, { health_flag })
  }

  async function updateStatus(id: string, status: Client['status']) {
    return updateClient(id, { status })
  }

  return { clients, loading, error, fetchClients, createClient, updateClient, deleteClient, updateHealthFlag, updateStatus }
}
