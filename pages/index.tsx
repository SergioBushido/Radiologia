import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Calendar from '../components/Calendar'
import Board from '../components/Board'
import { useAuth } from '../lib/useAuth'

import Logo from '../components/Logo'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => { if (!loading && !user) router.push('/login') }, [loading, user])

  if (loading) return <div className="p-4 bg-[var(--bg-main)] text-white h-screen">Cargando...</div>

  return (
    <div className="min-h-screen pb-28 bg-[var(--bg-main)]">
      <div className="p-6 flex justify-between items-center">
        <div>
          <div className="mb-2">
            <Logo className="w-10 h-10" />
          </div>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">Calendario y gestión de guardias</p>
        </div>
        <Link href="/preferences" className="flex flex-col items-center gap-1 p-3 bg-[var(--bg-card)] border border-slate-700 rounded-xl hover:bg-slate-700 transition group">
          <svg className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Puntos</span>
        </Link>
      </div>
      <Calendar />
      <div className="mt-8">
        <Board />
      </div>
    </div>
  )
}
