import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() ?? ''

export class AdminAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminAccessError'
  }
}

interface AdminAuthContextValue {
  adminEmail: string
  isReady: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

function isAdminUser(user: User | null) {
  return !!user?.email && !!adminEmail && user.email.toLowerCase() === adminEmail
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setIsReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsReady(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      adminEmail,
      isReady,
      isAuthenticated: !!session,
      isAdmin: isAdminUser(session?.user ?? null),
      session,
      user: session?.user ?? null,
      async signIn(email: string, password: string) {
        if (!adminEmail) {
          throw new AdminAccessError('Missing VITE_ADMIN_EMAIL configuration.')
        }

        const normalizedEmail = email.trim().toLowerCase()
        if (normalizedEmail !== adminEmail) {
          throw new AdminAccessError('This email is not allowed to access admin.')
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (error) throw error

        if (!isAdminUser(data.user)) {
          await supabase.auth.signOut()
          throw new AdminAccessError('This account is not authorized for admin access.')
        }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [isReady, session]
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider.')
  }

  return context
}
