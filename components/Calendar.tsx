import { useEffect, useState } from 'react'
import { format, parseISO, startOfMonth, getDay, getDaysInMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import PointsModal from './PointsModal'
import DayEditor from './DayEditor'
import DayDetailModal from './DayDetailModal'

type Shift = { date: string, slot1UserId: number, slot2UserId: number }

import { useAuth } from '../lib/useAuth'

export default function Calendar() {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [shifts, setShifts] = useState<Shift[]>([])
  const [usersMap, setUsersMap] = useState<Record<number, string>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [targetUserIdToEdit, setTargetUserIdToEdit] = useState<number | null>(null)
  const [showDayEditor, setShowDayEditor] = useState(false)

  const [preferences, setPreferences] = useState<any[]>([])
  const [vacations, setVacations] = useState<any[]>([])

  useEffect(() => { fetchShifts() }, [month, user])
  async function fetchShifts() {
    const token = localStorage.getItem('token')
    const headers: any = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`/api/shifts?month=${month}`, { headers })
    const data = await res.json()
    setShifts(data.shifts || [])

    if (token) {
      const ures = await fetch('/api/users', { headers })
      if (ures.ok) {
        const udata = await ures.json()
        const map: Record<number, string> = {}
        for (const u of udata) map[u.id] = u.name
        setUsersMap(map)
      }

      // Fetch preferences
      const pres = await fetch(`/api/preferences?month=${month}`, { headers })
      if (pres.ok) setPreferences(await pres.json())

      // Fetch vacations: admin sees all, user sees only their own
      if (user?.role === 'ADMIN') {
        // Admin: fetch all vacations for the month (no userId specified)
        const vacRes = await fetch(`/api/vacations?month=${month}`, { headers })
        if (vacRes.ok) setVacations(await vacRes.json())
      } else {
        // User: fetch only their own vacations
        const vacRes = await fetch(`/api/vacations?month=${month}`, { headers })
        if (vacRes.ok) setVacations(await vacRes.json())
      }
    }
  }

  const start = startOfMonth(parseISO(month + '-01'))
  const daysInMonth = getDaysInMonth(start)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const firstWeekday = getDay(start) // 0 (Sun) - 6 (Sat)
  const leadingBlanks = (firstWeekday + 6) % 7 // shift so Monday=0
  const totalSlots = leadingBlanks + daysInMonth
  const rows = Math.ceil(totalSlots / 7)

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    setShowDetailModal(true)
  }

  const handlePrev = () => { const [y, m] = month.split('-'); let ny = Number(y); let nm = Number(m) - 1; if (nm < 1) { nm = 12; ny -= 1 } const mm = String(nm).padStart(2, '0'); setMonth(`${ny}-${mm}`) }
  const handleNext = () => { const [y, m] = month.split('-'); let ny = Number(y); let nm = Number(m) + 1; if (nm > 12) { nm = 1; ny += 1 } const mm = String(nm).padStart(2, '0'); setMonth(`${ny}-${mm}`) }

  return (
    <div className="flex flex-col bg-[var(--bg-main)] min-h-[600px]">
      {/* Header Compacto */}
      <div className="flex-none p-4 pb-2">
        <div className="flex items-center justify-between bg-[var(--bg-card)] backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 max-w-lg mx-auto w-full">
          <button onClick={handlePrev} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-medical-600 dark:hover:text-medical-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-lg font-bold text-[var(--text-main)] capitalize tracking-tight">
            {format(start, 'MMMM yyyy', { locale: es })}
          </div>
          <button onClick={handleNext} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-medical-600 dark:hover:text-medical-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col px-2 pb-2 gap-1 overflow-hidden max-w-5xl mx-auto w-full">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 flex-none">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center font-extrabold text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest py-2">{d}</div>
          ))}
        </div>

        {/* Days Grid - Auto-fitting rows */}
        <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b-${i}`} className="bg-transparent" />
          ))}

          {days.map(dayNum => {
            const d = new Date(start.getFullYear(), start.getMonth(), dayNum)
            const date = format(d, 'yyyy-MM-dd')
            const s = shifts.find(s => s.date === date)
            const isToday = format(new Date(), 'yyyy-MM-dd') === date

            // Restore name lookup
            const slot1Name = s ? (usersMap[s.slot1UserId] || `#${s.slot1UserId}`) : null
            const slot2Name = s ? (usersMap[s.slot2UserId] || `#${s.slot2UserId}`) : null

            return (
              <div
                key={date}
                onClick={() => handleDayClick(date)}
                className={`
                  group relative flex flex-col items-center justify-start p-1 cursor-pointer
                  bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/[0.08] backdrop-blur-sm rounded-xl border-2
                  ${isToday ? 'border-medical-500 ring-1 ring-medical-500/20 bg-medical-50/50 dark:bg-medical-500/10' : 'border-slate-200 dark:border-white/10'} 
                  hover:shadow-lg dark:hover:shadow-black/20 hover:scale-[1.02] hover:z-10 transition-all duration-200 ease-out
                `}
              >
                <div className={`
                  text-sm font-extrabold mb-1
                  ${isToday ? 'text-medical-700 dark:text-medical-400' : 'text-slate-900 dark:text-slate-200'}
                `}>
                  {format(d, 'dd')}
                </div>
                {isToday && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-medical-500 rounded-full"></div>
                )}

                {/* Mobile: Dots Indicator */}
                <div className="md:hidden w-full flex justify-center pb-1 mt-auto">
                  {s ? (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-medical-500 shadow-[0_0_8px_rgba(2,132,199,0.6)]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-medical-500 shadow-[0_0_8px_rgba(2,132,199,0.6)]"></div>
                    </div>
                  ) : (
                    (() => {
                      const myPref = preferences.find(p => p.date === date && p.userId === user?.id)
                      const otherPrefs = preferences.filter(p => p.date === date && p.userId !== user?.id)
                      const myVacation = vacations.find(v => v.date === date && v.userId === user?.id)
                      const otherVacations = vacations.filter(v => v.date === date && v.userId !== user?.id)

                      return (
                        <div className="flex gap-1 justify-center flex-wrap">
                          {myVacation && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Mis vacaciones"></div>
                          )}
                          {myPref && (
                            <div className={`w-1.5 h-1.5 rounded-full ${myPref.type === 'LOCK' ? 'bg-black dark:bg-white' : myPref.type === 'BLOCK' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          )}
                          {/* Admin sees dots for others' vacations and requests */}
                          {user?.role === 'ADMIN' && otherVacations.length > 0 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" title={`${otherVacations.length} vacaciones`}></div>
                          )}
                          {user?.role === 'ADMIN' && otherPrefs.length > 0 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" title={`${otherPrefs.length} solicitudes`}></div>
                          )}
                          {!myPref && !myVacation && (!otherPrefs.length || user?.role !== 'ADMIN') && (!otherVacations.length || user?.role !== 'ADMIN') && (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                          )}
                        </div>
                      )
                    })()
                  )}
                </div>

                {/* Desktop: Names (Truncated) */}
                <div className="hidden md:flex flex-col gap-1 w-full mt-auto mb-1">
                  {s ? (
                    <>
                      <div className="text-[10px] font-bold text-medical-800 dark:text-medical-100 bg-white dark:bg-medical-500/20 px-1.5 py-1 rounded-lg truncate leading-tight border-2 border-medical-500 dark:border-medical-500/30 shadow-md">
                        {slot1Name}
                      </div>
                      <div className="text-[10px] font-bold text-medical-800 dark:text-medical-100 bg-white dark:bg-medical-500/20 px-1.5 py-1 rounded-lg truncate leading-tight border-2 border-medical-500 dark:border-medical-500/30 shadow-md">
                        {slot2Name}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-800 dark:text-slate-500 text-center italic py-2 font-bold opacity-80">Libre</div>
                  )}

                  {/* Show MY preference and vacations if no shift */}
                  {!s && (() => {
                    const myPref = preferences.find(p => p.date === date && p.userId === user?.id)
                    const otherPrefs = preferences.filter(p => p.date === date && p.userId !== user?.id)
                    const myVacation = vacations.find(v => v.date === date && v.userId === user?.id)
                    const otherVacations = vacations.filter(v => v.date === date && v.userId !== user?.id)

                    return (
                      <div className="flex flex-col gap-0.5">
                        {myVacation && (
                          <div className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border-2 mb-1 bg-green-600 dark:bg-green-500/20 text-white dark:text-green-300 border-green-700 dark:border-green-500/30 shadow-sm">
                            VACACIONES
                          </div>
                        )}
                        {myPref && (
                          <div className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border-2 mb-1 ${myPref.type === 'LOCK'
                            ? 'bg-slate-900 text-white border-black'
                            : myPref.type === 'BLOCK'
                              ? 'bg-red-600 text-white border-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                              : 'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            } shadow-sm`}>
                            {myPref.type === 'LOCK' ? 'BLOQUEADO' : myPref.type === 'BLOCK' ? 'EVITAR' : 'SOLICITAR'} {myPref.type !== 'LOCK' && `(${myPref.points}pts)`}
                          </div>
                        )}
                        {user?.role === 'ADMIN' && otherVacations.length > 0 && (
                          <div className="text-[9px] font-bold px-1.5 py-0.5 rounded border-2 bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-300 dark:border-green-500/20 shadow-sm">
                            {otherVacations.length} PERSONAL VAC
                          </div>
                        )}
                        {user?.role === 'ADMIN' && otherPrefs.length > 0 && (
                          <div className="text-[9px] font-bold px-1.5 py-0.5 rounded border-2 bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-500/20 shadow-sm mt-1">
                            {otherPrefs.length} SOLICITUDES
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showDetailModal && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          shift={shifts.find(s => s.date === selectedDate)}
          usersMap={usersMap}
          userRole={user?.role}
          currentUserId={user?.id}
          preferences={preferences.filter(p => p.date === selectedDate)}
          vacations={vacations.filter(v => v.date === selectedDate)}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            // If manual edit of shift
            setShowDetailModal(false)
            setShowDayEditor(true)
          }}
          onBlock={() => {
            // "Sistema de puntos" -> PointsModal
            setTargetUserIdToEdit(null)
            setShowDetailModal(false)
            setShowBlockModal(true)
          }}
          onLock={async () => {
            // Hard Lock -> Direct API call
            const token = localStorage.getItem('token')
            const body: any = { date: selectedDate, type: 'LOCK', points: 0 } // Points 0 for lock
            if (targetUserIdToEdit) body.targetUserId = targetUserIdToEdit // Logic for admin? 
            // If I am user, I lock myself.

            if (confirm('¿Seguro que quieres bloquear este día? No se te asignará guardia.')) {
              const res = await fetch('/api/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
              })
              if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Error al guardar')
              } else {
                fetchShifts()
                setShowDetailModal(false)
              }
            }
          }}
          disableLock={!!preferences.find(p => p.userId === user?.id && p.type === 'LOCK' && p.date.startsWith(month))}
          onEditPreference={(targetId) => {
            // Admin editing someone else's block
            setTargetUserIdToEdit(targetId)
            setShowDetailModal(false)
            setShowBlockModal(true)
          }}
          onPreferencesUpdated={fetchShifts}
          onVacationsUpdated={fetchShifts}
        />
      )}

      {showBlockModal && selectedDate && (
        <PointsModal
          date={selectedDate}
          // If editing target, find THEIR preference. Else find MINE.
          existingPreference={preferences.find(p => p.date === selectedDate && p.userId === (targetUserIdToEdit || user?.id))}
          // If editing target, we might not know their remaining points easily without fetching? 
          // For now, let's calculate from loaded preferences if we have them all (Admin does).
          pointsRemaining={(() => {
            const uid = targetUserIdToEdit || user?.id
            if (!uid) return 20
            // Admin fetches ALL prefs, so we can filter by uid
            const userPrefs = preferences.filter(p => p.userId === uid)
            const used = userPrefs.filter(p => p.date !== selectedDate).reduce((sum, p) => sum + p.points, 0)
            return 20 - used
          })()}
          onClose={() => { setShowBlockModal(false); setTargetUserIdToEdit(null) }}
          onSave={async (type, points) => {
            const token = localStorage.getItem('token')
            const body: any = { date: selectedDate, type, points }
            if (targetUserIdToEdit) body.targetUserId = targetUserIdToEdit

            const res = await fetch('/api/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(body)
            })
            if (res.ok) {
              fetchShifts()
              setShowBlockModal(false)
              setTargetUserIdToEdit(null)
            } else {
              alert('Error saving preference')
            }
          }}
          onDelete={async () => {
            const token = localStorage.getItem('token')
            const body: any = { date: selectedDate, points: 0 }
            if (targetUserIdToEdit) body.targetUserId = targetUserIdToEdit

            await fetch('/api/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(body)
            })
            fetchShifts()
            setShowBlockModal(false)
            setTargetUserIdToEdit(null)
          }}
        />
      )}
      {showDayEditor && selectedDate && <DayEditor date={selectedDate} onClose={() => { setShowDayEditor(false); }} onSaved={() => { fetchShifts(); setShowDetailModal(true) }} />}
    </div>
  )
}
