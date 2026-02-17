import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'
import PointsModal from '../components/PointsModal'
import { format, parseISO, startOfMonth, getDaysInMonth, getDay, isAfter, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default function PreferencesPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { addToast } = useToast()
    const { setLoading } = useLoading()

    const [month, setMonth] = useState(() => {
        const d = new Date()
        // Default to NEXT month for preferences? Or current? 
        // Usually you plan for next month.
        // Let's default to next month.
        // const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1)
        // return format(nextM, 'yyyy-MM')
        // Actually, prompt doesn't specify. Let's stick to simple "Current/Next" navigation.
        return format(d, 'yyyy-MM')
    })

    // State
    const [preferences, setPreferences] = useState<any[]>([])
    const [loadingPrefs, setLoadingPrefs] = useState(false)

    // Modal State
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [authLoading, user])

    useEffect(() => {
        if (user) fetchPreferences()
    }, [user, month])

    async function fetchPreferences() {
        setLoadingPrefs(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`/api/preferences?month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setPreferences(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingPrefs(false)
        }
    }

    async function savePreference(type: 'PREFERENCE' | 'BLOCK', points: number) {
        if (!selectedDate) return
        const token = localStorage.getItem('token')

        // Optimistic / Check limits
        // Rely on API for strict check, but simple check here helps UI.

        const res = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ date: selectedDate, type, points })
        })

        if (res.ok) {
            addToast('Preferencia guardada', 'success')
            setSelectedDate(null)
            fetchPreferences()
        } else {
            const d = await res.json()
            addToast(d.error || 'Error al guardar', 'error')
        }
    }

    async function deletePreference() {
        if (!selectedDate) return
        savePreference('PREFERENCE', 0) // 0 deletes it
    }

    // Helpers
    const totalPointsUsed = preferences.reduce((sum, p) => sum + p.points, 0)
    const pointsRemaining = 20 - totalPointsUsed

    const handlePrev = () => { const [y, m] = month.split('-'); let ny = Number(y); let nm = Number(m) - 1; if (nm < 1) { nm = 12; ny -= 1 } const mm = String(nm).padStart(2, '0'); setMonth(`${ny}-${mm}`) }
    const handleNext = () => { const [y, m] = month.split('-'); let ny = Number(y); let nm = Number(m) + 1; if (nm > 12) { nm = 1; ny += 1 } const mm = String(nm).padStart(2, '0'); setMonth(`${ny}-${mm}`) }

    // Calendar Grid Logic
    const start = startOfMonth(parseISO(month + '-01'))
    const daysInMonth = getDaysInMonth(start)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const firstWeekday = getDay(start)
    const leadingBlanks = (firstWeekday + 6) % 7

    if (authLoading || !user) return null

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-20">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-white/5 shadow-lg p-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="font-bold text-lg">Mis Preferencias</h1>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Puntos Restantes</span>
                        <span className={`text-2xl font-bold ${pointsRemaining < 5 ? 'text-red-500' : 'text-emerald-400'}`}>{pointsRemaining}</span>
                    </div>
                </div>
            </div>

            {/* Month Nav */}
            <div className="flex items-center justify-center gap-4 py-6">
                <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-xl font-bold capitalize text-white w-40 text-center">{format(start, 'MMMM yyyy', { locale: es })}</h2>
                <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>

            {/* Calendar Grid */}
            <div className="px-4 max-w-lg mx-auto">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-center text-slate-500 font-bold text-xs">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
                    {days.map(d => {
                        const dateObj = new Date(start.getFullYear(), start.getMonth(), d)
                        const dateStr = format(dateObj, 'yyyy-MM-dd')
                        const pref = preferences.find(p => p.date === dateStr)

                        // Styles
                        let bgClass = "bg-white/5 border-white/10 hover:bg-white/10"
                        if (pref) {
                            if (pref.type === 'PREFERENCE') bgClass = "bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 ring-1 ring-emerald-500/30"
                            if (pref.type === 'BLOCK') bgClass = "bg-red-500/20 border-red-500/50 hover:bg-red-500/30 ring-1 ring-red-500/30"
                        }

                        return (
                            <button
                                key={d}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                           aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all active:scale-95
                           ${bgClass}
                        `}
                            >
                                <span className="text-sm font-bold text-slate-300">{d}</span>
                                {pref && (
                                    <div className={`absolute bottom-1 text-[10px] font-bold px-1.5 rounded-full ${pref.type === 'PREFERENCE' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {pref.points}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {selectedDate && (
                <PointsModal
                    date={selectedDate}
                    existingPreference={preferences.find(p => p.date === selectedDate)}
                    pointsRemaining={pointsRemaining}
                    onClose={() => setSelectedDate(null)}
                    onSave={savePreference}
                    onDelete={deletePreference}
                />
            )}

        </div>
    )
}
