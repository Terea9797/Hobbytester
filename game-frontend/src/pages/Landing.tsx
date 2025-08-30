import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white flex items-center justify-center">
      <div className="max-w-xl text-center px-6">
        <h1 className="text-4xl font-extrabold mb-4">City of Shadows</h1>
        <p className="opacity-80 mb-8">A lightweight GTA-RPâ€“inspired browser RPG. Build your turf. Make a name. Try not to get burned.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-white text-black px-5 py-2 rounded-lg">Register</Link>
          <Link to="/login" className="border border-white px-5 py-2 rounded-lg">Login</Link>
        </div>
      </div>
    </div>
  )
}

