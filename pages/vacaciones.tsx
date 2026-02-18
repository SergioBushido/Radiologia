import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, parseISO, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/ToastProvider'

type Vacation = {
  id: number
  userId: number
  date: string
  status: string
}

export default function VacationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()

  const [month, setMonth] = useState(() => {
    const d = new Date()
    return format(d, 'yyyy-MM')
  })

  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loadingVac, setLoadingVac] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user])

  useEffect(() => {
    if (user) fetchVacations()
  }, [user, month])

  async function fetchVacations() {
    setLoadingVac(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vacations?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setVacations(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingVac(false)
    }
  }

  async function toggleVacation(date: string) {
    const token = localStorage.getItem('token')
    if (!token) return

    const existing = vacations.find(v => v.date === date)

    try {
      if (existing) {
        const res = await fetch(`/api/vacations?date=${date}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          const d = await res.json().catch(() => null)
          addToast(d?.error || 'No se pudo eliminar la vacaciones', 'error')
          return
        }
        addToast('Vacaciones eliminadas', 'success')
      } else {
        const res = await fetch('/api/vacations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date })
        })
        const d = await res.json().catch(() => null)
        if (!res.ok) {
          addToast(d?.error || 'No se pudo crear la vacaciones', 'error')
          return
        }
        addToast('Día marcado como vacaciones', 'success')
      }
      fetchVacations()
    } catch (e) {
      console.error(e)
      addToast('Error de conexión', 'error')
    }
  }

  if (loading || !user) return null

  const start = startOfMonth(parseISO(month + '-01'))
  const daysInMonth = getDaysInMonth(start)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const firstWeekday = getDay(start)
  const leadingBlanks = (firstWeekday + 6) % 7

  const handlePrev = () => {
    const [y, m] = month.split('-')
    let ny = Number(y)
    let nm = Number(m) - 1
    if (nm < 1) { nm = 12; ny -= 1 }
    const mm = String(nm).padStart(2, '0')
    setMonth(`${ny}-${mm}`)
  }

  const handleNext = () => {
    const [y, m] = month.split('-')
    let ny = Number(y)
    let nm = Number(m) + 1
    if (nm > 12) { nm = 1; ny += 1 }
    const mm = String(nm).padStart(2, '0')
    setMonth(`${ny}-${mm}`)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-white/5 shadow-lg p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Mis vacaciones</h1>
              <p className="text-xs text-slate-400">Marca los días en los que no estarás disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-center gap-4 py-6">
        <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold capitalize text-white w-40 text-center">
          {format(start, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="px-4 max-w-lg mx-auto">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-slate-500 font-bold text-xs">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
          {days.map(d => {
            const dateObj = new Date(start.getFullYear(), start.getMonth(), d)
            const dateStr = format(dateObj, 'yyyy-MM-dd')
            const vac = vacations.find(v => v.date === dateStr)

            const isVacation = !!vac
            const bgClass = isVacation
              ? 'bg-emerald-500/30 border-emerald-500/70 ring-1 ring-emerald-400/60'
              : 'bg-white/5 border-white/10 hover:bg-white/10'

            return (
              <button
                key={d}
                onClick={() => toggleVacation(dateStr)}
                className={`
                  aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all active:scale-95
                  ${bgClass}
                `}
              >
                <span className="text-sm font-bold text-slate-100">{d}</span>
                {isVacation && (
                  <span className="absolute bottom-1 text-[10px] font-bold px-1.5 rounded-full bg-emerald-500 text-black">
                    VAC
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


