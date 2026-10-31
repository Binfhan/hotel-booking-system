'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthResponse } from '@/types/hotel'

interface AuthContextValue {
  user: AuthResponse | null
  isLoading: boolean
  saveSession: (authData: AuthResponse) => void
  logout: () => void
}

export interface AuthProviderProps {
  children: React.ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({
  children
}: AuthProviderProps): React.JSX.Element => {
  const [user, setUser] = useState<AuthResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const rawUser = window.localStorage.getItem('hotel_auth_user')
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser) as AuthResponse)
      } catch {
        window.localStorage.removeItem('hotel_auth_user')
        window.localStorage.removeItem('hotel_jwt_token')
      }
    }
    setIsLoading(false)
  }, [])

  const saveSession = (authData: AuthResponse): void => {
    window.localStorage.setItem('hotel_jwt_token', authData.token)
    window.localStorage.setItem('hotel_auth_user', JSON.stringify(authData))
    setUser(authData)
  }

  const logout = (): void => {
    window.localStorage.removeItem('hotel_jwt_token')
    window.localStorage.removeItem('hotel_auth_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
