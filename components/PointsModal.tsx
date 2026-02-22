import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type Props = {
    date: string
    existingPreference?: { type: 'PREFERENCE' | 'BLOCK', points: number }
    onClose: () => void
    onSave: (type: 'PREFERENCE' | 'BLOCK', points: number) => void
    onDelete: () => void
    prefPointsRemaining: number
    blockPointsRemaining: number
}

export default function PointsModal({
    date,
    existingPreference,
    onClose,
    onSave,
    onDelete,
    prefPointsRemaining,
    blockPointsRemaining
}: Props) {
    const [type, setType] = useState<'PREFERENCE' | 'BLOCK'>(existingPreference?.type || 'PREFERENCE')
    const [points, setPoints] = useState<number>(existingPreference?.points || 1)

    // Calculating max points allowable for this specific edit
    const pointsRemaining = type === 'PREFERENCE' ? prefPointsRemaining : blockPointsRemaining
    const currentUsed = (existingPreference && existingPreference.type === type) ? existingPreference.points : 0
    const maxAllocatable = pointsRemaining + currentUsed

    // Reset points if switching type makes current points invalid
    useEffect(() => {
        if (points > maxAllocatable) {
            setPoints(Math.max(1, maxAllocatable))
        }
    }, [type, maxAllocatable])

    const handleSave = () => {
        if (points > maxAllocatable) {
            alert(`No tienes suficientes puntos. Máximo disponible: ${maxAllocatable}`)
            return
        }
        onSave(type, points)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                <div className="p-4 bg-gradient-to-r from-medical-600 to-medical-500 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg capitalize">{format(parseISO(date), 'EEEE d MMMM', { locale: es })}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="p-6 space-y-6">

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tipo de Solicitud</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setType('PREFERENCE')}
                                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${type === 'PREFERENCE' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}
                            >
                                Deseo Guardia
                            </button>
                            <button
                                onClick={() => setType('BLOCK')}
                                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${type === 'BLOCK' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}
                            >
                                Evitar Guardia
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Puntos a Asignar</label>
                            <span className="text-xs font-bold text-medical-400">Disp: {maxAllocatable}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max={Math.min(20, Math.max(1, maxAllocatable))} // Allow at least 1 even if 0 remaining? No.
                                value={points}
                                onChange={e => setPoints(Number(e.target.value))}
                                className="w-full accent-medical-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-2xl font-bold text-slate-700 dark:text-white w-8 text-center">{points}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-tight">
                            {type === 'PREFERENCE'
                                ? "Más puntos = Mayor probabilidad de que te asignen este día."
                                : "Más puntos = Mayor probabilidad de evitar este día (penalización)."
                            }
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        <button onClick={handleSave} className="w-full py-3 bg-medical-600 hover:bg-medical-500 text-white font-bold rounded-xl shadow-lg shadow-medical-600/30 transition-all active:scale-95">
                            Guardar Preferencia
                        </button>
                        {existingPreference && (
                            <button onClick={onDelete} className="w-full py-3 bg-transparent hover:bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 transition-all">
                                Eliminar
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
