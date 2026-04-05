import type { ReactNode } from 'react'
import { createContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabase.ts'

type AuthContextValue = {
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setSession(null)
      } else {
        setSession(data.session)
      }

      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return 'Supabase 환경변수를 먼저 설정해 주세요.'
    }

    const response = await supabase.auth.signInWithPassword({ email, password })
    return response.error?.message ?? null
  }

  async function signUp(email: string, password: string) {
    if (!supabase) {
      return 'Supabase 환경변수를 먼저 설정해 주세요.'
    }

    const response = await supabase.auth.signUp({ email, password })
    return response.error?.message ?? null
  }

  async function signOut() {
    if (!supabase) {
      return 'Supabase 환경변수를 먼저 설정해 주세요.'
    }

    const response = await supabase.auth.signOut()
    return response.error?.message ?? null
  }

  return (
    <AuthContext.Provider
      value={{
        isConfigured: isSupabaseConfigured,
        isLoading,
        session,
        user: session?.user ?? null,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}