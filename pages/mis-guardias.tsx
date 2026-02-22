import { useEffect, useState } from 'react'
import { parseISO, format, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../lib/useAuth'
import { useRouter } from 'next/router'

import Logo from '../components/Logo'

export default function MisGuardias() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shifts, setShifts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user) fetchShifts(user, selectedDate)
  }, [loading, user, selectedDate])

  async function fetchShifts(currentUser: any, date: Date) {
    const monthStr = format(date, 'yyyy-MM')
    const token = localStorage.getItem('token')
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    setIsFetching(true)
    try {
      const res = await fetch(`/api/shifts?month=${monthStr}`, { headers })
      if (!res.ok) throw new Error('Failed to fetch shifts')
      const data = await res.json()

      // Use loose equality (==) or cast to Number to be safe against number-string mismatch
      const my = (data.shifts || []).filter((s: any) =>
        Number(s.slot1UserId) === Number(currentUser.id) ||
        Number(s.slot2UserId) === Number(currentUser.id)
      )
      setShifts(my)

      const statRes = await fetch(`/api/users/${currentUser.id}/stats?month=${monthStr}`, { headers })
      if (statRes.ok) {
        setStats(await statRes.json())
      }
    } catch (e) {
      console.error('Error fetching shifts:', e)
    } finally {
      setIsFetching(false)
    }
  }

  const nextMonth = () => setSelectedDate(prev => addMonths(prev, 1))
  const prevMonth = () => setSelectedDate(prev => subMonths(prev, 1))
  const isCurrentMonth = format(selectedDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  if (loading) return <div className="p-4 bg-[var(--bg-main)] text-white h-screen">Cargando...</div>
  if (!user) return null

  return (
    <div className="p-6 min-h-screen pb-28 bg-[var(--bg-main)]">
      <div className="flex justify-between items-center mb-6">
        <Logo className="w-10 h-10" />
        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-sm font-bold uppercase tracking-widest min-w-[120px] text-center capitalize">
            {format(selectedDate, 'MMMM yyyy', { locale: es })}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold text-slate-400 mb-6 flex items-center gap-2">
        Mis guardias
        {!isCurrentMonth && (
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-[10px] bg-medical-500/10 text-medical-600 dark:text-medical-400 px-2 py-1 rounded-lg border border-medical-500/20 uppercase tracking-widest font-black"
          >
            Hoy
          </button>
        )}
      </h1>

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
        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 col-span-2 text-sm flex justify-between items-center text-indigo-700 dark:text-indigo-300 shadow-sm">
          <span>Fines de semana:</span>
          <b className="text-xl font-bold">{stats?.weekend ?? 0}</b>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm uppercase tracking-widest">Lista de guardias</h2>
        <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 uppercase tracking-tighter">
          {shifts.length} asignadas
        </span>
      </div>

      <div className="space-y-3">
        {shifts.length === 0 ? (
          <div className="p-10 text-center mobile-card border-dashed border-2 border-slate-200 dark:border-white/5 text-slate-400 italic text-sm">
            Sin guardias para este mes
          </div>
        ) : (
          shifts.map(s => (
            <div key={s.date} className="mobile-card !p-3 flex justify-between items-center border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col">
                <div className="font-bold text-[var(--text-main)] capitalize text-sm">{format(parseISO(s.date), 'EEEE', { locale: es })}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{format(parseISO(s.date), 'dd MMM yyyy')}</div>
              </div>
              <div className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-sm">
                SLOT {s.slot1UserId === user.id ? '1' : '2'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
