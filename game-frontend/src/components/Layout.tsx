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


