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


