import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../lib/useAuth'
import { useRouter } from 'next/router'

export default function ReportsHistoryPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/')
            return
        }
        if (user) fetchReports()
    }, [user, authLoading])

    async function fetchReports() {
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setReports(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-white">Cargando historial...</div>

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-medical-50 dark:hover:bg-medical-900/20 transition-colors">
                            <svg className="w-5 h-5 text-medical-600 dark:text-medical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="text-2xl font-black text-medical-700 dark:text-medical-400 uppercase tracking-tighter">Historial de Informes</h1>
                    </div>
                    <Logo className="w-10 h-10" />
                </div>

                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <div className="p-12 text-center mobile-card border-dashed border-2 border-slate-200 dark:border-white/5 text-slate-400 italic">
                            No hay informes guardados todavía
                        </div>
                    ) : (
                        reports.map(r => (
                            <Link key={r.id} href={`/admin/report?id=${r.id}`} className="block">
                                <div className="mobile-card !p-5 flex justify-between items-center group hover:border-medical-500/50 transition-all active:scale-[0.99]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {format(parseISO(r.month + '-01'), 'MMMM yyyy', { locale: es })}
                                            </span>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-medical-500/10 text-medical-600 dark:text-medical-400 border border-medical-500/20 uppercase tracking-widest">
                                                #{r.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {format(parseISO(r.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {r.createdBy?.name || 'Sistema'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 group-hover:bg-medical-600 group-hover:text-white transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
