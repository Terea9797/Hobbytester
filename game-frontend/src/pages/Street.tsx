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
        <p className="opacity-80">Make moves â€” but watch the heat.</p>
        <div className="flex gap-3">
          <button onClick={() => act('extort', fetchProfile)} className="bg-white text-black px-4 py-2 rounded">Extort</button>
          <button onClick={() => act('deal', fetchProfile)} className="bg-white text-black px-4 py-2 rounded">Deal</button>
          <button onClick={() => act('lay_low', fetchProfile)} className="border border-white px-4 py-2 rounded">Lay Low</button>
        </div>
      </div>
    </Layout>
  )
}

