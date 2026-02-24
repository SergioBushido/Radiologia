import { useState } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from './ToastProvider'

type Props = {
    onClose: () => void
    onSave: () => void
    initialDate?: string
    isAdmin?: boolean
    targetUserId?: number
}

export default function BlockingRangeModal({ onClose, onSave, initialDate, isAdmin, targetUserId }: Props) {
    const [startDate, setStartDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
    const [type, setType] = useState<'VACATION' | 'COURSE' | 'LD'>('VACATION')
    const [loading, setLoading] = useState(false)
    const { addToast } = useToast()

    async function handleSave() {
        if (new Date(startDate) > new Date(endDate)) {
            addToast('La fecha de fin debe ser posterior a la de inicio', 'error')
            return
        }

        setLoading(true)
        const token = localStorage.getItem('token')
        const body: any = { startDate, endDate, type }
        if (isAdmin && targetUserId) body.userId = targetUserId

        try {
            const res = await fetch('/api/vacations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                addToast('Rango guardado correctamente', 'success')
                onSave()
                onClose()
            } else {
                const err = await res.json()
                addToast(err.error || 'Error al guardar el rango', 'error')
            }
        } catch (error) {
            addToast('Error de red', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-all" onClick={onClose}>
            <div className={`bg-[var(--bg-surface)] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-medical-600 to-medical-800 p-6 text-white text-center relative overflow-hidden flex-none">
                    <h2 className="text-xl font-extrabold mb-1 drop-shadow-lg text-white">Gestionar Rango</h2>
                    <p className="text-medical-100 uppercase tracking-[0.1em] text-[10px] font-bold">Selecciona inicio y fin</p>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Tipo de bloqueo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['VACATION', 'COURSE', 'LD'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${type === t
                                        ? 'bg-medical-500 text-white border-medical-600 shadow-md'
                                        : 'bg-white dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50'
                                        }`}
                                >
                                    {t === 'VACATION' ? 'Vacaciones' : t === 'COURSE' ? 'Cursos' : 'Libre Disp.'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Fecha Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-medical-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Fecha Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-medical-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-2">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl bg-medical-600 text-white font-bold text-sm shadow-lg hover:bg-medical-700 transition-all active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : 'GUARDAR RANGO'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
