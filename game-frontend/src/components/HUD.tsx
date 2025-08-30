import { useAuth } from '../state/auth'

export default function HUD() {
  const profile = useAuth(s => s.profile)
  if (!profile) return null
  return (
    <div className="fixed top-4 right-4 bg-black/60 text-white rounded-xl px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex gap-4 text-sm">
        <div>ðŸ’µ {profile.cash}</div>
        <div>ðŸ”¥ {profile.heat}</div>
        <div>â¤ï¸ {profile.health}</div>
      </div>
    </div>
  )
}






