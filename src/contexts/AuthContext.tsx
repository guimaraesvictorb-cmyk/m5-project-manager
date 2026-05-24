import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/database.types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'login' | 'logout'>>({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      setState((s) => s.isLoading ? { ...s, isLoading: false } : s)
    }, 6000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (session) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, session, profile, isAuthenticated: true, isLoading: false })
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }).catch(() => {
      clearTimeout(timeout)
      setState((s) => ({ ...s, isLoading: false }))
    })

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

  async function login(email: string, password: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
