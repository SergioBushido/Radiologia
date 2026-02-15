import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Calendar from '../components/Calendar'
import { useAuth } from '../lib/useAuth'

import Logo from '../components/Logo'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => { if (!loading && !user) router.push('/login') }, [loading, user])

  if (loading) return <div className="p-4 bg-[var(--bg-main)] text-white h-screen">Cargando...</div>

  return (
    <div className="min-h-screen pb-28 bg-[var(--bg-main)]">
      <div className="p-6">
        <div className="mb-4">
          <Logo className="w-10 h-10" />
        </div>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">Calendario y gestión de guardias</p>
      </div>
      <Calendar />
    </div>
  )
}
