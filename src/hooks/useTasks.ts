import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/database.types'

interface UseTasksOptions {
  clientId?: string
  quarterId?: string
  assigneeId?: string
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (options.clientId) query = query.eq('client_id', options.clientId)
    if (options.quarterId) query = query.eq('quarter_id', options.quarterId)
    if (options.assigneeId) query = query.eq('assignee_id', options.assigneeId)

    const { data } = await query
    setTasks(data ?? [])
    setLoading(false)
  }, [options.clientId, options.quarterId, options.assigneeId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(input: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'completed_at'>) {
    const { data, error } = await supabase.from('tasks').insert(input).select().single()
    if (error) return { error: error.message }
    setTasks((prev) => [data, ...prev])
    return { data }
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const extra: Partial<Task> = {}
    if (updates.status === 'concluido') extra.completed_at = new Date().toISOString()
    const { data, error } = await supabase.from('tasks').update({ ...updates, ...extra }).eq('id', id).select().single()
    if (error) return { error: error.message }
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    return { data }
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    setTasks((prev) => prev.filter((t) => t.id !== id))
    return {}
  }

  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask }
}
