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

    // Helpers - Always calculate based on CURRENT user even if admin sees all
    const myPreferences = preferences.filter(p => p.userId === user?.id)
    const prefPointsUsed = myPreferences.filter(p => p.type === 'PREFERENCE').reduce((sum, p) => sum + p.points, 0)
    const blockPointsUsed = myPreferences.filter(p => p.type === 'BLOCK').reduce((sum, p) => sum + p.points, 0)

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
            <div className="sticky top-0 z-20 bg-gradient-to-r from-medical-600 to-medical-800 p-4 text-white shadow-lg">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="font-bold text-lg">Mis Preferencias</h1>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase tracking-widest text-medical-100 font-extrabold">Deseo g.</span>
                            <span className={`text-xl font-black ${prefPointsUsed > 15 ? 'text-red-300' : 'text-emerald-300'}`}>{20 - prefPointsUsed}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase tracking-widest text-medical-100 font-extrabold">Evitar g.</span>
                            <span className={`text-xl font-black ${blockPointsUsed > 15 ? 'text-red-300' : 'text-emerald-300'}`}>{20 - blockPointsUsed}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Month Nav */}
            <div className="flex items-center justify-center gap-4 py-6">
                <button onClick={handlePrev} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-slate-600 dark:text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-xl font-extrabold capitalize text-slate-900 dark:text-white w-48 text-center">{format(start, 'MMMM yyyy', { locale: es })}</h2>
                <button onClick={handleNext} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-slate-600 dark:text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>

            {/* Calendar Grid */}
            <div className="px-4 max-w-lg mx-auto">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-center text-slate-600 dark:text-slate-500 font-extrabold text-xs">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
                    {days.map(d => {
                        const dateObj = new Date(start.getFullYear(), start.getMonth(), d)
                        const dateStr = format(dateObj, 'yyyy-MM-dd')
                        // For the user grid, show ONLY my preferences clearly
                        const pref = preferences.find(p => p.date === dateStr && p.userId === user?.id)

                        // Styles
                        let bgClass = "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm"
                        if (pref) {
                            if (pref.type === 'PREFERENCE') bgClass = "bg-emerald-600 dark:bg-emerald-500/20 border-emerald-700 dark:border-emerald-500/50 hover:bg-emerald-500/30 ring-2 ring-emerald-500/30 shadow-lg"
                            if (pref.type === 'BLOCK') bgClass = "bg-red-600 dark:bg-red-500/20 border-red-700 dark:border-red-500/50 hover:bg-red-500/30 ring-2 ring-red-500/30 shadow-lg"
                        }

                        return (
                            <button
                                key={d}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                           aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all active:scale-95
                           ${bgClass}
                        `}
                            >
                                <span className={`text-sm font-extrabold ${pref ? 'text-white' : 'text-slate-900 dark:text-slate-300'}`}>{d}</span>
                                {pref && (
                                    <div className={`absolute bottom-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-white shadow-sm ${pref.type === 'PREFERENCE' ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {pref.points}pts
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
                    prefPointsRemaining={20 - prefPointsUsed}
                    blockPointsRemaining={20 - blockPointsUsed}
                    onClose={() => setSelectedDate(null)}
                    onSave={savePreference}
                    onDelete={deletePreference}
                />
            )}

        </div>
    )
}
