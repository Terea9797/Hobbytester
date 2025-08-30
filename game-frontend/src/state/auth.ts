import { create } from 'zustand'
import { api } from '../lib/api'

export type Profile = {
  display_name: string
  avatar_url?: string
  cash: number
  heat: number
  health: number
  turf_id?: number | null
}

type AuthState = {
  token: string | null
  profile: Profile | null
  setToken: (t: string | null) => void
  fetchProfile: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  profile: null,
  setToken: (t) => {
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
    set({ token: t })
  },
  fetchProfile: async () => {
    const data = await api<Profile>('/profile/')
    set({ profile: data })
  },
}))


