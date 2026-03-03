import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  role: string
  avatar?: string | null
  permissions?: Record<string, boolean>
  branchId?: string | null
  branch?: {
    id: string
    name: string
    address?: string | null
  } | null
  shortcuts?: {
    items: string[]
  } | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
    }),
    {
      name: 'auth-storage'
    }
  )
)
