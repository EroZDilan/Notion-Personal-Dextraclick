import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { authApi } from '../api/auth'

interface AuthState {
  token: string | null
  email: string
  nombreCompleto: string
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    email: localStorage.getItem('email') ?? '',
    nombreCompleto: localStorage.getItem('nombreCompleto') ?? '',
  }))

  const guardarAuth = useCallback((data: { token: string; email: string; nombreCompleto: string }) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('email', data.email)
    localStorage.setItem('nombreCompleto', data.nombreCompleto)
    setAuth({ token: data.token, email: data.email, nombreCompleto: data.nombreCompleto })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    guardarAuth(data)
  }, [guardarAuth])

  const register = useCallback(async (email: string, password: string, nombre: string) => {
    const data = await authApi.register(email, password, nombre)
    guardarAuth(data)
  }, [guardarAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('nombreCompleto')
    setAuth({ token: null, email: '', nombreCompleto: '' })
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
