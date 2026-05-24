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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data ?? null
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
    // Fallback: desbloqueia o app em 4 segundos no máximo
    const timeout = setTimeout(() => {
      setState((s) => s.isLoading ? { ...s, isLoading: false } : s)
    }, 4000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (session) {
        // Autentica imediatamente, perfil carrega em background
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout)
      if (session) {
        setState((s) => ({
          ...s,
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
        }))
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
