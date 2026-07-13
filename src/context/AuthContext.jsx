import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function init() {
      const { data: { session: current } } = await supabase.auth.getSession()
      if (!active) return

      setSession(current)
      if (current?.user) {
        try {
          const p = await fetchProfile(current.user.id)
          if (active) setProfile(p)
        } catch {
          if (active) setProfile(null)
        }
      }
      if (active) setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession)
        if (nextSession?.user) {
          try {
            const p = await fetchProfile(nextSession.user.id)
            setProfile(p)
          } catch {
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isAdmin = profile?.role === 'admin'
  const displayName = profile?.nama || session?.user?.email || ''

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin,
        displayName,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
