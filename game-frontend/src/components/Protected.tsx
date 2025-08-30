import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuth(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

