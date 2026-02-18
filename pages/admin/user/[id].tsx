import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { format, parseISO, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

type Vacation = {
  id: number
  userId: number
  date: string
  status: string
}

export default function AdminUser() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState<any>({ name: '', email: '', role: 'USER', group: '', password: '' })
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return format(d, 'yyyy-MM')
  })
  const [vacations, setVacations] = useState<Vacation[]>([])

  useEffect(() => { if (id) { fetchUser(); fetchVacations() } }, [id, month])

  async function fetchUser() {
    const res = await fetch(`/api/users/${id}`)
    const data = await res.json()
    setUser(data)
    setForm((prev: any) => ({ ...prev, ...data }))
  }

  async function fetchVacations() {
    if (!id) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/vacations?month=${month}&userId=${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setVacations(await res.json())
    }
  }

  async function save() {
    if (!confirm('Guardar cambios?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    if (res.ok) { alert('Guardado'); router.push('/admin') } else { alert('Error') }
  }

  if (!user) return <div className="p-4 bg-[var(--bg-main)] text-white h-screen">Cargando...</div>

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
    <div className="p-6 min-h-screen pb-28 bg-[var(--bg-main)]">
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-8 flex items-center gap-3">
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        Editar Usuario
      </h1>

      <div className="mobile-card max-w-md mx-auto space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-4 bg-slate-900 border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nombre" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Dirección de Email</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-4 bg-slate-900 border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="email@ejemplo.com" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rol</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-4 bg-slate-900 border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Especialidad</label>
            <select value={form.group || ''} onChange={e => setForm({ ...form, group: e.target.value === '' ? null : e.target.value })} className="w-full p-4 bg-slate-900 border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Sin especificar</option>
              <option value="MAMA">MAMA</option>
              <option value="URGENCIAS">URGENCIAS</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 text-indigo-400">Límite Mensual de Guardias</label>
          <input type="number" value={form.monthlyLimit || 20} onChange={e => setForm({ ...form, monthlyLimit: parseInt(e.target.value) })} className="w-full p-4 bg-indigo-500/5 border-indigo-500/20 text-indigo-400 font-bold rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" min="0" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
          <input type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-4 bg-slate-900 border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Dejar en blanco para no cambiar" />
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
            Guardar Cambios
          </button>
          <button onClick={() => router.push('/admin')} className="flex-1 bg-slate-800 text-slate-400 font-bold p-4 rounded-2xl border border-white/5 transition-all">
            Cancelar
          </button>
        </div>
      </div>

      {/* Calendario de vacaciones del usuario (solo lectura) */}
      <div className="mt-8 mobile-card max-w-md mx-auto !p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Vacaciones del usuario</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-white capitalize">
              {format(start, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={handleNext} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-[10px] text-slate-500 font-bold">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
          {days.map(d => {
            const dateObj = new Date(start.getFullYear(), start.getMonth(), d)
            const dateStr = format(dateObj, 'yyyy-MM-dd')
            const vac = vacations.find(v => v.date === dateStr)
            const isVacation = !!vac
            const bgClass = isVacation ? 'bg-emerald-500/30 border-emerald-400/80' : 'bg-white/5 border-white/5'

            return (
              <div
                key={d}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-[11px] text-slate-100 ${bgClass}`}
              >
                {d}
                {isVacation && (
                  <span className="mt-0.5 text-[8px] font-bold text-emerald-100">VAC</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
