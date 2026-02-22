import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ReportPage() {
  const [report, setReport] = useState<any>(null)
  const [usersMap, setUsersMap] = useState<Record<number, string>>({})
  const router = useRouter()

  useEffect(() => {
    const fetchReport = async () => {
      const { id } = router.query
      if (id) {
        // Load from DB
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/admin/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const reportData = await res.json()
          setReport(reportData.data) // The 'data' field has the actual report structure
        }
      } else {
        // Fallback to localStorage (legacy/immediate)
        const data = localStorage.getItem('lastGenerate')
        if (data) {
          setReport(JSON.parse(data))
        }
      }
    }

    if (router.isReady) {
      fetchReport()
    }

    const fetchUsers = async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const users = await res.json()
        const map: any = {}
        users.forEach((u: any) => map[u.id] = u.name)
        setUsersMap(map)
      }
    }
    fetchUsers()
  }, [router.isReady, router.query])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  if (!report) return <div className="p-8 text-white">Cargando reporte...</div>

  const shifts = report.shifts || []
  const totalPages = Math.ceil(shifts.length / itemsPerPage)
  const paginatedShifts = shifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Group by user to show equity?
  const stats: any = {}
  shifts.forEach((s: any) => {
    if (!stats[s.slot1UserId]) stats[s.slot1UserId] = 0
    if (!stats[s.slot2UserId]) stats[s.slot2UserId] = 0
    stats[s.slot1UserId]++
    stats[s.slot2UserId]++
  })

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 print:p-0 print:bg-white print:text-black">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { 
            display: block !important; 
            visibility: visible !important;
            opacity: 1 !important;
            color: black !important;
          }
          .mobile-card { 
            box-shadow: none !important; 
            border: 1px solid #eee !important;
            background: white !important;
            width: 100% !important;
            margin-bottom: 20px !important;
            break-inside: auto !important;
          }
          .print-list-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          body { background: white !important; color: black !important; }
          @page { margin: 1.5cm; size: auto; }
          .grid { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-medical-50 dark:hover:bg-medical-900/20 transition-colors">
            <svg className="w-5 h-5 text-medical-600 dark:text-medical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-black text-medical-700 dark:text-medical-400 uppercase tracking-tighter">Reporte (v3-Paginado)</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-medical-600 hover:bg-medical-500 text-white font-black rounded-xl shadow-xl shadow-medical-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          IMPRIMIR TODO
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr] no-print">
        {/* Stats Card */}
        <div className="mobile-card !p-5 self-start">
          <h3 className="text-sm font-black text-medical-600 dark:text-medical-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-medical-100 dark:border-white/5 pb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Estadísticas
          </h3>
          <div className="space-y-2">
            {Object.entries(stats).map(([uid, count]: any) => (
              <div key={uid} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate pr-4">{usersMap[Number(uid)] || `ID ${uid}`}</span>
                <span className="px-2.5 py-1 bg-medical-600 text-white rounded-lg text-[10px] font-black shrink-0 shadow-sm">{count} G.</span>
              </div>
            ))}
          </div>
        </div>

        {/* List Card - UI Version (Paginated, NO SCROLL) */}
        <div className="mobile-card !p-5">
          <div className="flex justify-between items-center mb-6 border-b border-medical-100 dark:border-white/5 pb-3">
            <h3 className="text-sm font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Listado ({shifts.length})
            </h3>
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-white/5 no-print">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg text-medical-600 disabled:opacity-20 hover:scale-125 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-xs font-black text-slate-900 dark:text-white min-w-[3rem] text-center">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg text-medical-600 disabled:opacity-20 hover:scale-125 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedShifts.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 shadow-sm hover:border-medical-500/30 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 dark:text-white capitalize leading-none mb-1">
                    {format(parseISO(s.date), 'EEEE d MMMM', { locale: es })}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.date}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1 rounded-xl bg-medical-50 dark:bg-medical-500/10 text-medical-700 dark:text-medical-400 text-[10px] font-black border border-medical-200 dark:border-medical-500/30 uppercase">
                    {usersMap[s.slot1UserId] || `ID ${s.slot1UserId}`}
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[10px] font-black border border-teal-200 dark:border-teal-500/30 uppercase">
                    {usersMap[s.slot2UserId] || `ID ${s.slot2UserId}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print-Only Version (Full List, NO DUPLICATE CARDS, JUST A CLEAN TABLE-LIKE LIST) */}
      <div className="print-only">
        <div className="p-4 border-b-2 border-black mb-8">
          <h1 className="text-2xl font-black uppercase">Reporte de Guardias Generadas</h1>
          <p className="text-sm text-gray-600">Total de guardias: {shifts.length}</p>
        </div>

        <div className="space-y-6">
          <div className="mobile-card">
            <h2 className="text-lg font-black mb-4 uppercase">Estadísticas por Profesional</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats).map(([uid, count]: any) => (
                <div key={uid} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="font-bold">{usersMap[Number(uid)]}</span>
                  <span className="font-black">{count} guardias</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mobile-card">
            <h2 className="text-lg font-black mb-4 uppercase">Listado Completo</h2>
            <div className="space-y-1">
              {shifts.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 print-list-item">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-black capitalize">
                      {format(parseISO(s.date), 'EEEE d MMMM', { locale: es })}
                    </span>
                    <span className="text-[10px] text-gray-500">{s.date}</span>
                  </div>
                  <div className="flex gap-8">
                    <span className="font-black text-right min-w-[150px]">
                      {usersMap[Number(s.slot1UserId)] || `P1 (ID ${s.slot1UserId})`}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="font-black min-w-[150px]">
                      {usersMap[Number(s.slot2UserId)] || `P2 (ID ${s.slot2UserId})`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
