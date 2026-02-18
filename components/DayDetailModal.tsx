import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from './ToastProvider'

type Props = {
    date: string
    shift: { slot1UserId: number, slot2UserId: number } | undefined
    usersMap: Record<number, string>
    userRole?: string
    currentUserId?: number
    preferences?: any[]
    vacations?: any[]
    onClose: () => void
    onEdit: () => void
    onBlock: () => void
    onLock?: () => void
    disableLock?: boolean
    onPreferencesUpdated?: () => void
    onEditPreference?: (userId: number) => void
    onVacationsUpdated?: () => void
}

export default function DayDetailModal({ date, shift, usersMap, userRole, currentUserId, preferences, vacations = [], onClose, onEdit, onBlock, onLock, disableLock, onPreferencesUpdated, onEditPreference, onVacationsUpdated }: Props) {
    const d = parseISO(date)
    const { addToast } = useToast()

    async function deletePreference(targetUserId: number) {
        if (!confirm('¿Eliminar esta preferencia/bloqueo?')) return
        const token = localStorage.getItem('token')
        const res = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ date, points: 0, targetUserId })
        })

        if (res.ok) {
            addToast('Eliminado correctamente', 'success')
            onPreferencesUpdated?.()
        } else {
            addToast('Error al eliminar', 'error')
        }
    }

    async function toggleVacation(userId: number) {
        const token = localStorage.getItem('token')
        const existing = vacations.find(v => v.userId === userId)
        
        if (existing) {
            // Delete vacation
            const res = await fetch(`/api/vacations?date=${date}&userId=${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                addToast('Vacación eliminada', 'success')
                onVacationsUpdated?.()
            } else {
                addToast('Error al eliminar vacación', 'error')
            }
        } else {
            // Create vacation
            const res = await fetch('/api/vacations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ date, userId })
            })
            if (res.ok) {
                addToast('Vacación añadida', 'success')
                onVacationsUpdated?.()
            } else {
                const err = await res.json()
                addToast(err.error || 'Error al añadir vacación', 'error')
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all" onClick={onClose}>
            <div className={`bg-[var(--bg-surface)] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white text-center relative overflow-hidden flex-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <h2 className="text-3xl font-extrabold mb-1 drop-shadow-lg">{format(d, 'dd')}</h2>
                    <p className="text-indigo-200 uppercase tracking-[0.2em] text-[10px] font-bold">{format(d, 'MMMM yyyy', { locale: es })}</p>
                    <p className="text-white/60 text-xs mt-1 font-medium">{format(d, 'EEEE', { locale: es })}</p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2">Personal de Guardia</h3>
                        {shift ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/10 dark:border-indigo-500/20">1</div>
                                    <span className="font-semibold text-sm text-[var(--text-main)]">{usersMap[shift.slot1UserId] || 'Usuario ' + shift.slot1UserId}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/10 dark:border-indigo-500/20">2</div>
                                    <span className="font-semibold text-sm text-[var(--text-main)]">{usersMap[shift.slot2UserId] || 'Usuario ' + shift.slot2UserId}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 italic text-sm">
                                Libre de guardias
                            </div>
                        )}
                    </div>




                    {/* Vacations Section */}
                    {vacations && vacations.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Vacaciones</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {vacations.map(vac => (
                                    <div key={vac.id} className="flex justify-between items-center p-2.5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20 text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-green-700 dark:text-green-300">{usersMap[vac.userId] || `Usuario ${vac.userId}`}</span>
                                            <span className="text-[10px] text-green-600 dark:text-green-400">Vacaciones</span>
                                        </div>
                                        {(userRole === 'ADMIN' || vac.userId === currentUserId) && (
                                            <button
                                                onClick={() => toggleVacation(vac.userId)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar vacación"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin View: Show ALL preferences */}
                    {userRole === 'ADMIN' && preferences && preferences.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Solicitudes / Bloqueos</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {preferences.map(pref => (
                                    <div key={pref.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[var(--text-main)]">{pref.user?.name || `User ${pref.userId}`}</span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {pref.type === 'LOCK' ? 'Bloqueo' : pref.type === 'BLOCK' ? `Puntos (${pref.points})` : `Solicitud (${pref.points})`}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => deletePreference(pref.userId)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar solicitud"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin: Add vacation for any user */}
                    {userRole === 'ADMIN' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2">Gestionar vacaciones</h3>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {Object.entries(usersMap).map(([userId, name]) => {
                                    const hasVacation = vacations.some(v => v.userId === Number(userId))
                                    return (
                                        <button
                                            key={userId}
                                            onClick={() => toggleVacation(Number(userId))}
                                            className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                                hasVacation
                                                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-500/30'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-green-50 dark:hover:bg-green-500/10'
                                            }`}
                                        >
                                            {hasVacation ? '✓ ' : ''}{name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className={`grid ${userRole === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-2`}>
                        {userRole === 'ADMIN' && (
                            <button
                                onClick={() => { onEdit(); onClose() }}
                                className="flex items-center justify-center gap-2 p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Editar
                            </button>
                        )}
                        <button
                            onClick={() => { onBlock(); onClose() }}
                            className="flex items-center justify-center gap-2 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all active:scale-95 border border-emerald-200 dark:border-emerald-500/20 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            Sistema de puntos
                        </button>
                        <button
                            onClick={() => { if (!disableLock) { onLock?.(); onClose() } }}
                            disabled={disableLock}
                            className={`flex items-center justify-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-bold transition-all border border-red-200 dark:border-red-500/20 text-sm ${disableLock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            {disableLock ? 'Límite alcanzado' : 'Bloquear'}
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
