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
    isMonthBlocked?: boolean
}

export default function DayDetailModal({ date, shift, usersMap, userRole, currentUserId, preferences = [], vacations = [], onClose, onEdit, onBlock, onLock, disableLock, onPreferencesUpdated, onEditPreference, onVacationsUpdated, isMonthBlocked }: Props) {
    const d = parseISO(date)
    const { addToast } = useToast()
    const isAdmin = userRole === 'ADMIN'
    const canEdit = isAdmin || !isMonthBlocked

    const myLock = preferences.find(p => p.userId === currentUserId && p.type === 'LOCK')

    async function toggleLock() {
        if (!isAdmin && isMonthBlocked) {
            addToast('Mes bloqueado', 'error')
            return
        }
        if (myLock) {
            if (!confirm('¿Seguro que quieres eliminar el bloqueo de este día?')) return
            const token = localStorage.getItem('token')
            const res = await fetch('/api/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ date, points: 0, type: 'LOCK' })
            })
            if (res.ok) {
                addToast('Bloqueo eliminado', 'success')
                onPreferencesUpdated?.()
            } else {
                addToast('Error al eliminar bloqueo', 'error')
            }
        } else {
            if (disableLock) {
                addToast('Ya has usado tu bloqueo mensual', 'error')
                return
            }
            onLock?.()
        }
    }

    async function deletePreference(targetUserId: number) {
        if (!isAdmin && isMonthBlocked) {
            addToast('Mes bloqueado', 'error')
            return
        }
        if (!confirm('¿Eliminar esta solicitud/bloqueo?')) return
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

    async function toggleBlockingDay(userId: number, type: 'VACATION' | 'COURSE' | 'LD') {
        if (!isAdmin && isMonthBlocked) {
            addToast('Mes bloqueado', 'error')
            return
        }
        const token = localStorage.getItem('token')
        const existing = vacations.find(v => v.userId === userId && v.type === type)

        if (existing) {
            // Delete specific type
            const res = await fetch(`/api/vacations?date=${date}&userId=${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                addToast(`${type === 'VACATION' ? 'Vacación' : type === 'COURSE' ? 'Curso' : 'LD'} eliminado`, 'success')
                onVacationsUpdated?.()
            } else {
                addToast('Error al eliminar', 'error')
            }
        } else {
            // Create
            const res = await fetch('/api/vacations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ date, userId, type })
            })
            if (res.ok) {
                addToast(`${type === 'VACATION' ? 'Vacación' : type === 'COURSE' ? 'Curso' : 'LD'} añadido`, 'success')
                onVacationsUpdated?.()
            } else {
                const err = await res.json()
                addToast(err.error || 'Error al añadir', 'error')
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all" onClick={onClose}>
            <div className={`bg-[var(--bg-surface)] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-medical-600 to-medical-800 p-6 text-white text-center relative overflow-hidden flex-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <h2 className="text-3xl font-extrabold mb-1 drop-shadow-lg">{format(d, 'dd')}</h2>
                    <p className="text-medical-100 uppercase tracking-[0.2em] text-[10px] font-bold">{format(d, 'MMMM yyyy', { locale: es })}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-white/60 text-xs font-medium">{format(d, 'EEEE', { locale: es })}</p>
                        {isMonthBlocked && (
                            <span className="bg-red-500/20 text-red-200 text-[8px] px-1.5 py-0.5 rounded border border-red-500/30 font-bold uppercase">Mes Bloqueado</span>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2">Personal de Guardia</h3>
                        {shift ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-medical-500/10 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400 flex items-center justify-center font-bold text-xs border border-medical-500/10 dark:border-medical-500/20">1</div>
                                    <span className="font-semibold text-sm text-[var(--text-main)]">{usersMap[shift.slot1UserId] || 'Usuario ' + shift.slot1UserId}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="w-8 h-8 rounded-full bg-medical-500/10 dark:bg-medical-500/20 text-medical-600 dark:text-medical-400 flex items-center justify-center font-bold text-xs border border-medical-500/10 dark:border-medical-500/20">2</div>
                                    <span className="font-semibold text-sm text-[var(--text-main)]">{usersMap[shift.slot2UserId] || 'Usuario ' + shift.slot2UserId}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 italic text-sm">
                                Libre de guardias
                            </div>
                        )}
                    </div>

                    {/* Blocking Section (Vacations & Courses) */}
                    {(vacations.length > 0 || preferences.some(p => p.type === 'LOCK')) && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Días Bloqueantes</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {vacations.map(vac => (
                                    <div key={vac.id} className={`flex justify-between items-center p-2.5 rounded-xl border text-xs 
                                        ${vac.type === 'COURSE' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' :
                                            vac.type === 'LD' ? 'bg-medical-50 dark:bg-medical-500/10 border-medical-200 dark:border-medical-500/20' :
                                                'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'}`}>
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${vac.type === 'COURSE' ? 'text-amber-700 dark:text-amber-300' : vac.type === 'LD' ? 'text-medical-700 dark:text-medical-300' : 'text-green-700 dark:text-green-300'}`}>{usersMap[vac.userId] || `Usuario ${vac.userId}`}</span>
                                            <span className={`text-[10px] ${vac.type === 'COURSE' ? 'text-amber-600 dark:text-amber-400' : vac.type === 'LD' ? 'text-medical-600 dark:text-medical-400' : 'text-green-600 dark:text-green-400'}`}>{vac.type === 'COURSE' ? 'Cursos' : vac.type === 'LD' ? 'Libre Disp.' : 'Vacaciones'}</span>
                                        </div>
                                        {(isAdmin || (vac.userId === currentUserId && !isMonthBlocked)) && (
                                            <button onClick={() => toggleBlockingDay(vac.userId, vac.type)} className="p-1.5 text-red-500 hover:bg-white/50 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {preferences.filter(p => p.type === 'LOCK').map(pref => (
                                    <div key={pref.id} className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-red-700 dark:text-red-300">{usersMap[pref.userId] || `Usuario ${pref.userId}`}</span>
                                            <span className="text-[10px] text-red-600 dark:text-red-400">Bloqueo Mensual</span>
                                        </div>
                                        {(isAdmin || (pref.userId === currentUserId && !isMonthBlocked)) && (
                                            <button onClick={() => deletePreference(pref.userId)} className="p-1.5 text-red-500 hover:bg-white/50 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preferences / Requests Section (Only Admin or non-blocked) */}
                    {isAdmin && preferences.some(p => p.type !== 'LOCK') && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Otras Solicitudes</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {preferences.filter(p => p.type !== 'LOCK').map(pref => (
                                    <div key={pref.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[var(--text-main)]">{usersMap[pref.userId] || `User ${pref.userId}`}</span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {pref.type === 'BLOCK' ? `Evitar (${pref.points}p)` : `Deseo (${pref.points}p)`}
                                            </span>
                                        </div>
                                        {(isAdmin || (!isMonthBlocked)) && (
                                            <button onClick={() => deletePreference(pref.userId)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                        <button
                            disabled={!isAdmin && isMonthBlocked}
                            onClick={() => toggleBlockingDay(currentUserId || 0, 'VACATION')}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-all active:scale-95 border border-green-200 dark:border-green-500/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                            <span className="text-[10px]">VACACIONES</span>
                        </button>
                        <button
                            disabled={!isAdmin && isMonthBlocked}
                            onClick={() => toggleBlockingDay(currentUserId || 0, 'COURSE')}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all active:scale-95 border border-amber-200 dark:border-amber-500/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            <span className="text-[10px]">CURSOS</span>
                        </button>
                        <button
                            disabled={!isAdmin && isMonthBlocked}
                            onClick={() => toggleBlockingDay(currentUserId || 0, 'LD')}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-medical-100 dark:bg-medical-900/30 text-medical-700 dark:text-medical-300 rounded-xl font-bold hover:bg-medical-200 dark:hover:bg-medical-900/50 transition-all active:scale-95 border border-medical-200 dark:border-medical-500/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-[10px]">LIBRE DISP.</span>
                        </button>
                        <button
                            disabled={!isAdmin && isMonthBlocked}
                            onClick={toggleLock}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl font-bold transition-all border text-[10px] disabled:opacity-50 disabled:grayscale disabled:scale-100 ${myLock
                                ? 'bg-red-600 text-white border-red-700 shadow-inner'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {myLock
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                }
                            </svg>
                            {myLock ? 'UNBLOCK' : 'BLOQUEO MENSUAL'}
                        </button>
                        <button
                            onClick={() => { onBlock(); onClose() }}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 rounded-xl font-bold hover:bg-medical-100 transition-all border border-medical-200 dark:border-medical-500/20 text-[10px]"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            SOLICITUDES
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
