<# =====================================================================
  setup-frontend.ps1
  One-shot frontend scaffold for Mafia Game (Vite + React + TS + Tailwind)
  Requirements: Node.js (npm), PowerShell
===================================================================== #>

param(
  [string]$Root = (Get-Location).Path,
  [string]$ProjectName = "mafia-game",
  [string]$FrontendDir = "game-frontend",
  [string]$ApiUrl = "http://127.0.0.1:8000"
)

$ErrorActionPreference = 'Stop'

function Write-Text($Path, $Content) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $Content | Set-Content -Path $Path -Encoding UTF8
}

# --- Paths
$proj = Join-Path $Root $ProjectName
$fe   = Join-Path $proj $FrontendDir

# --- Basic checks
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Node.js not found. Install Node LTS first." -ForegroundColor Red; exit 1
}
if (-not (Test-Path $proj)) {
  New-Item -ItemType Directory -Path $proj | Out-Null
}

# --- Scaffold Vite React+TS app (create if missing)
if (-not (Test-Path $fe)) {
  Push-Location $proj
  npm create vite@latest $FrontendDir -- --template react-ts
  Pop-Location
}

# --- Install dependencies
Push-Location $fe
npm i
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm i react-router-dom zustand framer-motion

# --- Tailwind config & CSS
Write-Text (Join-Path $fe 'tailwind.config.js') @"
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
"@

Write-Text (Join-Path $fe 'src/index.css') @"
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
"@

# --- Env for API URL
Write-Text (Join-Path $fe '.env') "VITE_API_URL=$ApiUrl`n"

# --- Source files
Write-Text (Join-Path $fe 'src/lib/api.ts') @"
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = \`Bearer \${token}\`
  const res = await fetch(\`\${API_URL}\${path}\`, { ...opts, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
"@

Write-Text (Join-Path $fe 'src/state/auth.ts') @"
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
"@

Write-Text (Join-Path $fe 'src/components/Protected.tsx') @"
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuth(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
"@

Write-Text (Join-Path $fe 'src/components/HUD.tsx') @"
import { useAuth } from '../state/auth'

export default function HUD() {
  const profile = useAuth(s => s.profile)
  if (!profile) return null
  return (
    <div className="fixed top-4 right-4 bg-black/60 text-white rounded-xl px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex gap-4 text-sm">
        <div>💵 {profile.cash}</div>
        <div>🔥 {profile.heat}</div>
        <div>❤️ {profile.health}</div>
      </div>
    </div>
  )
}
"@

Write-Text (Join-Path $fe 'src/components/Layout.tsx') @"
import { Link } from 'react-router-dom'
import HUD from './HUD'
import { useAuth } from '../state/auth'

export default function Layout({ bg, children }: { bg: string, children: React.ReactNode }) {
  const { profile } = useAuth()
  return (
    <div className="min-h-screen relative">
      <img src={bg} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
      <div className="relative z-10 min-h-screen bg-black/40 text-white">
        <nav className="p-4 flex gap-4">
          <Link to="/house" className="hover:underline">House</Link>
          <Link to="/street" className="hover:underline">Street</Link>
          <Link to="/turf" className="hover:underline">Turf</Link>
          <div className="ml-auto opacity-80">{profile?.display_name ?? 'Rookie'}</div>
        </nav>
        <main className="p-6">{children}</main>
      </div>
      <HUD />
    </div>
  )
}
"@

Write-Text (Join-Path $fe 'src/pages/Landing.tsx') @"
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white flex items-center justify-center">
      <div className="max-w-xl text-center px-6">
        <h1 className="text-4xl font-extrabold mb-4">City of Shadows</h1>
        <p className="opacity-80 mb-8">A lightweight GTA-RP–inspired browser RPG. Build your turf. Make a name. Try not to get burned.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-white text-black px-5 py-2 rounded-lg">Register</Link>
          <Link to="/login" className="border border-white px-5 py-2 rounded-lg">Login</Link>
        </div>
      </div>
    </div>
  )
}
"@

Write-Text (Join-Path $fe 'src/pages/Register.tsx') @"
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../state/auth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const setToken = useAuth(s => s.setToken)
  const fetchProfile = useAuth(s => s.fetchProfile)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const data = await api<{access_token: string}>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      setToken(data.access_token)
      await fetchProfile()
      nav('/house')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-900 text-white">
      <form onSubmit={onSubmit} className="bg-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Create account</h2>
        <input className="w-full p-2 rounded bg-zinc-700" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full p-2 rounded bg-zinc-700" type="password" placeholder="Password (min 8)" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="w-full bg-white text-black py-2 rounded">Register</button>
      </form>
    </div>
  )
}
"@

Write-Text (Join-Path $fe 'src/pages/Login.tsx') @"
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../state/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const setToken = useAuth(s => s.setToken)
  const fetchProfile = useAuth(s => s.fetchProfile)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null)
    try {
      const data = await api<{access_token: string}>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      setToken(data.access_token); await fetchProfile(); nav('/house')
    } catch (err: any) { setError(err.message) }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-900 text-white">
      <form onSubmit={onSubmit} className="bg-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Welcome back</h2>
        <input className="w-full p-2 rounded bg-zinc-700" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full p-2 rounded bg-zinc-700" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="w-full bg-white text-black py-2 rounded">Login</button>
      </form>
    </div>
  )
}
"@

Write-Text (Join-Path $fe 'src/pages/House.tsx') @"
import Layout from '../components/Layout'
import { useEffect } from 'react'
import { useAuth } from '../state/auth'

export default function House() {
  const fetchProfile = useAuth(s => s.fetchProfile)
  useEffect(() => { fetchProfile() }, [])
  return (
    <Layout bg="/assets/backgrounds/house.jpg">
      <div className="max-w-2xl bg-black/40 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Your Safehouse</h2>
        <p className="opacity-80">Rest, plan, and keep a low profile.</p>
      </div>
    </Layout>
  )
}
"@

Write-Text (Join-Path $fe 'src/pages/Street.tsx') @"
import Layout from '../components/Layout'
import { api } from '../lib/api'
import { useAuth } from '../state/auth'

async function act(type: 'extort' | 'deal' | 'lay_low', fetchProfile: () => Promise<void>) {
  await api('/action/perform', { method: 'POST', body: JSON.stringify({ type }) })
  await fetchProfile()
}

export default function Street() {
  const fetchProfile = useAuth(s => s.fetchProfile)
  return (
    <Layout bg="/assets/backgrounds/street.jpg">
      <div className="max-w-2xl bg-black/40 p-6 rounded-xl space-y-4">
        <h2 className="text-2xl font-bold">The Street</h2>
        <p className="opacity-80">Make moves — but watch the heat.</p>
        <div className="flex gap-3">
          <button onClick={() => act('extort', fetchProfile)} className="bg-white text-black px-4 py-2 rounded">Extort</button>
          <button onClick={() => act('deal', fetchProfile)} className="bg-white text-black px-4 py-2 rounded">Deal</button>
          <button onClick={() => act('lay_low', fetchProfile)} className="border border-white px-4 py-2 rounded">Lay Low</button>
        </div>
      </div>
    </Layout>
  )
}
"@

Write-Text (Join-Path $fe 'src/pages/Turf.tsx') @"
import Layout from '../components/Layout'

export default function Turf() {
  return (
    <Layout bg="/assets/backgrounds/turf.jpg">
      <div className="max-w-2xl bg-black/40 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Your Turf</h2>
        <p className="opacity-80">Expand influence, upgrade blocks, and collect income (coming soon).</p>
      </div>
    </Layout>
  )
}
"@

Write-Text (Join-Path $fe 'src/main.tsx') @"
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import House from './pages/House'
import Street from './pages/Street'
import Turf from './pages/Turf'
import Protected from './components/Protected'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/register', element: <Register /> },
  { path: '/login', element: <Login /> },
  { path: '/house', element: <Protected><House /></Protected> },
  { path: '/street', element: <Protected><Street /></Protected> },
  { path: '/turf', element: <Protected><Turf /></Protected> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
"@

# --- Assets (placeholders)
New-Item -ItemType Directory -Path (Join-Path $fe 'public/assets/backgrounds') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $fe 'public/assets/avatars') -Force | Out-Null
'placeholder' | Set-Content (Join-Path $fe 'public/assets/backgrounds/house.jpg')
'placeholder' | Set-Content (Join-Path $fe 'public/assets/backgrounds/street.jpg')
'placeholder' | Set-Content (Join-Path $fe 'public/assets/backgrounds/turf.jpg')
'placeholder' | Set-Content (Join-Path $fe 'public/assets/avatars/default.png')

Pop-Location

Write-Host "✅ Frontend created at $fe" -ForegroundColor Green
Write-Host "▶️  Starting Vite dev server (http://localhost:5173) ..." -ForegroundColor Yellow
npm run dev --prefix $fe
