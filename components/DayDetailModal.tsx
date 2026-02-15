import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type Props = {
    date: string
    shift: { slot1UserId: number, slot2UserId: number } | undefined
    usersMap: Record<number, string>
    userRole?: string
    onClose: () => void
    onEdit: () => void
    onBlock: () => void
}

export default function DayDetailModal({ date, shift, usersMap, userRole, onClose, onEdit, onBlock }: Props) {
    const d = parseISO(date)

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all" onClick={onClose}>
            <div className="bg-[var(--bg-surface)] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <h2 className="text-4xl font-extrabold mb-1 drop-shadow-lg">{format(d, 'dd')}</h2>
                    <p className="text-indigo-200 uppercase tracking-[0.2em] text-[10px] font-bold">{format(d, 'MMMM yyyy', { locale: es })}</p>
                    <p className="text-white/60 text-xs mt-2 font-medium">{format(d, 'EEEE', { locale: es })}</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2">Personal de Guardia</h3>
                        {shift ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/10 dark:border-indigo-500/20">
                                        1
                                    </div>
                                    <span className="font-semibold text-[var(--text-main)]">{usersMap[shift.slot1UserId] || 'Usuario ' + shift.slot1UserId}</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/10 dark:border-indigo-500/20">
                                        2
                                    </div>
                                    <span className="font-semibold text-[var(--text-main)]">{usersMap[shift.slot2UserId] || 'Usuario ' + shift.slot2UserId}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 text-[var(--text-muted)] italic text-sm">
                                Libre de guardias
                            </div>
                        )}
                    </div>

                    <div className={`grid ${userRole === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        {userRole === 'ADMIN' && (
                            <button
                                onClick={() => { onEdit(); onClose() }}
                                className="flex items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Editar
                            </button>
                        )}
                        <button
                            onClick={() => { onBlock(); onClose() }}
                            className="flex items-center justify-center gap-2 p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200 dark:border-white/5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Bloquear
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Cerrar panel
                    </button>
                </div>
            </div>
        </div>
    )
}
