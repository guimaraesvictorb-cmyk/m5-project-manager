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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Timeout de segurança: se Supabase não responder em 8s, para de carregar
    const timeout = setTimeout(() => {
      setState((s) => s.isLoading ? { ...s, isLoading: false } : s)
    }, 8000)

    // Pega sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (session) {
        fetchProfile(session.user.id).then((profile) => {
          setState({ user: session.user, session, profile, isAuthenticated: true, isLoading: false })
        })
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }).catch(() => {
      clearTimeout(timeout)
      setState((s) => ({ ...s, isLoading: false }))
    })

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, session, profile, isAuthenticated: true, isLoading: false })
      } else {
        setState({ user: null, session: null, profile: null, isAuthenticated: false, isLoading: false })
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return data
  }

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
