import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/database.types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data } = await Promise.race([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 5000)),
    ])
    return data
  } catch {
    return null
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Timeout global: nunca fica travado
    const timeout = setTimeout(() => {
      setState((s) => s.isLoading ? { ...s, isLoading: false } : s)
    }, 6000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (session) {
        // Autentica imediatamente, busca perfil em paralelo sem bloquear
        setState({ user: session.user, session, profile: null, isAuthenticated: true, isLoading: false })
        fetchProfile(session.user.id).then((profile) => {
          if (profile) setState((s) => ({ ...s, profile }))
        })
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }).catch(() => {
      clearTimeout(timeout)
      setState((s) => ({ ...s, isLoading: false }))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(timeout)
      if (session) {
        setState({ user: session.user, session, profile: null, isAuthenticated: true, isLoading: false })
        fetchProfile(session.user.id).then((profile) => {
          if (profile) setState((s) => ({ ...s, profile }))
        })
      } else {
        setState({ user: null, session: null, profile: null, isAuthenticated: false, isLoading: false })
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function login(email: string, password: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { ...state, login, logout }
}
