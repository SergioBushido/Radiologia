import { useEffect, useState } from 'react'
import { parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../lib/useAuth'
import { useRouter } from 'next/router'

import Logo from '../components/Logo'

export default function MisGuardias() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shifts, setShifts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => { if (!loading && !user) router.push('/login'); if (user) fetchShifts(user) }, [loading, user])

  async function fetchShifts(user: any) {
    const month = new Date().toISOString().slice(0, 7)
    const res = await fetch(`/api/shifts?month=${month}`)
    const data = await res.json()
    const my = (data.shifts || []).filter((s: any) => s.slot1UserId === user.id || s.slot2UserId === user.id)
    setShifts(my)
    const statRes = await fetch(`/api/users/${user.id}/stats?month=${month}`)
    setStats(await statRes.json())
  }

  if (loading) return <div className="p-4 bg-[var(--bg-main)] text-white h-screen">Cargando...</div>
  if (!user) return null

  return (
    <div className="p-6 min-h-screen pb-28 bg-[var(--bg-main)]">
      <div className="mb-6">
        <Logo className="w-10 h-10" />
      </div>
      <h1 className="text-xl font-semibold text-slate-400 mb-6">Mis guardias</h1>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="p-4 bg-[var(--bg-surface)] dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col shadow-sm">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Total</span>
          <b className="text-2xl text-[var(--text-main)]">{stats?.total ?? 0}</b>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col shadow-sm">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Puntos</span>
          <b className="text-2xl text-indigo-600 dark:text-indigo-400">{stats?.points ?? 0}</b>
        </div>
        <div className="p-3 bg-[var(--bg-surface)] dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-sm text-[var(--text-main)] shadow-sm">Jueves: <b className="font-bold">{stats?.thursday ?? 0}</b></div>
        <div className="p-3 bg-[var(--bg-surface)] dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-sm text-[var(--text-main)] shadow-sm">Viernes: <b className="font-bold">{stats?.friday ?? 0}</b></div>
        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 col-span-2 text-sm flex justify-between items-center text-indigo-700 dark:text-indigo-300">
          <span>Fines de semana:</span>
          <b className="text-xl font-bold">{stats?.weekend ?? 0}</b>
        </div>
      </div>

      <h2 className="mt-8 font-medium text-[var(--text-muted)] text-sm uppercase tracking-widest">Lista de guardias</h2>
      <div className="mt-4 space-y-3">
        {shifts.map(s => (
          <div key={s.date} className="mobile-card !p-3 flex justify-between items-center border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            <div className="flex flex-col">
              <div className="font-bold text-[var(--text-main)] capitalize text-sm">{format(parseISO(s.date), 'EEEE', { locale: es })}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{format(parseISO(s.date), 'dd MMM yyyy')}</div>
            </div>
            <div className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
              SLOT {s.slot1UserId === user.id ? '1' : '2'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
