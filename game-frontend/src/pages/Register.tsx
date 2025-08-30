import { postRegister } from './shared/api';
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


