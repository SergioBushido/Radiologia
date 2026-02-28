import { useEffect, useState } from 'react'
import { useToast } from './ToastProvider'
import { useLoading } from './LoadingProvider'
import { useConfirm } from './ConfirmProvider'

export default function DayEditor({ date, hasExistingShift, onClose, onSaved }: { date: string, hasExistingShift: boolean, onClose: () => void, onSaved: () => void }) {
  const [users, setUsers] = useState<any[]>([])
  const [slot1, setSlot1] = useState<number | null>(null)
  const [slot2, setSlot2] = useState<number | null>(null)
  const [forced, setForced] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()
  const { setLoading } = useLoading()
  const { confirm } = useConfirm()

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token')
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/users', { headers })
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsers([{ id: 0, name: 'Libre / Pendiente', email: 'dummy', role: 'SYSTEM' }, ...data])
      } else {
        setUsers([])
      }
    }
    load()
  }, [])

  async function save() {
    if (slot1 === null || slot2 === null || slot1 === '' as any || slot2 === '' as any) {
      return setError('Selecciona ambos huecos')
    }
    if (slot1 === slot2 && slot1 !== 0) {
      return setError('No puede ser la misma persona')
    }

    setError(null)
    setLoading(true)
    const token = localStorage.getItem('token')
    const actorRes = token ? await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }) : null
    const actor = actorRes ? await actorRes.json() : null
    const res = await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, slot1UserId: slot1, slot2UserId: slot2, forced, forcedReason: reason, actorUserId: actor?.id }) })
    setLoading(false)
    if (res.ok) {
      addToast('Guardia guardada', 'success')
      onSaved(); onClose()
    } else { const d = await res.json(); setError(d.errors ? JSON.stringify(d.errors) : d.error || 'Error'); addToast('Error al guardar', 'error') }
  }

  async function deleteShift() {
    const ok = await confirm({
      title: '¿Eliminar guardia?',
      message: 'Esta guardia se borrará y el día volverá a quedar libre para la generación automática.',
      confirmText: 'Eliminar Guardia',
      type: 'danger'
    })
    if (!ok) return

    setError(null)
    setLoading(true)
    const token = localStorage.getItem('token')
    const actorRes = token ? await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }) : null
    const actor = actorRes ? await actorRes.json() : null

    const res = await fetch('/api/shifts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, actorUserId: actor?.id })
    })

    setLoading(false)
    if (res.ok) {
      addToast('Guardia eliminada', 'success')
      onSaved(); onClose()
    } else {
      const d = await res.json();
      setError(d.error || 'Error al eliminar');
      addToast('Error al eliminar', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-2xl">
        <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">Asignar guardia</h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Fecha</label>
            <div className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 text-[var(--text-main)] font-mono text-sm">
              {date}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Slot 1</label>
              <select className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[var(--text-main)] rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" onChange={e => setSlot1(Number(e.target.value))} value={slot1 ?? ''}>
                <option value="">Seleccionar</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Slot 2</label>
              <select className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[var(--text-main)] rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" onChange={e => setSlot2(Number(e.target.value))} value={slot2 ?? ''}>
                <option value="">Seleccionar</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5">
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500" checked={forced} onChange={e => setForced(e.target.checked)} />
            <label className="text-sm font-medium text-[var(--text-main)]">Forzar asignación (modo admin)</label>
          </div>

          {forced && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <input className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[var(--text-main)] rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none placeholder:text-slate-400" placeholder="Motivo del forzado..." value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          )}
        </div>

        {error && <div className="text-red-500 text-xs mt-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

        <div className="mt-8 flex gap-3">
          <button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-sm sm:text-base">
            Guardar
          </button>
          {hasExistingShift && (
            <button onClick={deleteShift} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold p-4 rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95 text-sm sm:text-base">
              Eliminar
            </button>
          )}
          <button onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold p-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200 dark:border-white/5 text-sm sm:text-base">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
