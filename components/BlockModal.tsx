import { useEffect, useState } from 'react'
import { useToast } from './ToastProvider'
import { useLoading } from './LoadingProvider'

export default function BlockModal({ date, onClose }: { date: string, onClose: () => void }) {
  const [userId, setUserId] = useState<number | null>(null)
  const [me, setMe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()
  const { setLoading } = useLoading()

  useEffect(() => { const t = localStorage.getItem('token'); if (!t) return; fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setMe) }, [])

  async function createBlock() {
    setError(null)
    if (!me) return setError('User not loaded')
    setLoading(true)
    const res = await fetch('/api/blocks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ userId: me.id, date }) })
    setLoading(false)
    if (res.ok) {
      addToast('Bloqueo creado', 'success')
      onClose()
    } else {
      const data = await res.json()
      setError(data.error || 'Error')
      addToast(data.error || 'Error creando bloqueo', 'error')
    }
  }

  async function removeBlock() {
    setError(null)
    if (!me) return setError('User not loaded')
    const month = date.slice(0, 7)
    setLoading(true)
    const res = await fetch(`/api/blocks?userId=${me.id}&month=${month}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    setLoading(false)
    if (res.ok) { addToast('Bloqueo eliminado', 'info'); onClose() } else { setError('Error deleting'); addToast('Error eliminando bloqueo', 'error') }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-2xl">
        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Bloquear día</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="font-mono">{date}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-4 animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={createBlock}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold p-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Confirmar bloqueo
          </button>

          <button
            onClick={removeBlock}
            className="w-full bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 font-bold p-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-all active:scale-95"
          >
            Eliminar bloqueo
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-widest transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
