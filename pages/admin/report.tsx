import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ReportPage() {
  const [report, setReport] = useState<any>(null)
  const [usersMap, setUsersMap] = useState<Record<number, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const fetchReport = async () => {
      const { id } = router.query
      if (id) {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/admin/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const reportData = await res.json()
          setReport(reportData.data)
        }
      } else {
        const data = localStorage.getItem('lastGenerate')
        if (data) setReport(JSON.parse(data))
      }
    }

    const fetchUsers = async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const users = await res.json()
        const map: Record<number, string> = {}
        users.forEach((u: any) => { map[Number(u.id)] = u.name })
        setUsersMap(map)
      }
    }

    fetchReport()
    fetchUsers()
  }, [router.isReady, router.query])

  if (!report) return <div className="p-8 text-white">Cargando reporte...</div>

  const shifts: any[] = report.shifts || []
  const totalPages = Math.ceil(shifts.length / itemsPerPage)
  const paginatedShifts = shifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats: Record<string, number> = {}
  shifts.forEach((s: any) => {
    const k1 = String(s.slot1UserId)
    const k2 = String(s.slot2UserId)
    stats[k1] = (stats[k1] || 0) + 1
    stats[k2] = (stats[k2] || 0) + 1
  })

  const getName = (id: any) => usersMap[Number(id)] || `ID ${id}`

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 print:p-4 print:bg-white print:text-black">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-full-list .screen-only { display: none !important; }
          .print-full-list .print-rows { display: block !important; }
          .mobile-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: white !important;
            color: black !important;
            margin-bottom: 16px !important;
            break-inside: auto !important;
          }
          body { background: white !important; color: black !important; }
          @page { margin: 1.5cm; }
        }
        .print-rows { display: none; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-medical-50 dark:hover:bg-medical-900/20 transition-colors">
            <svg className="w-5 h-5 text-medical-600 dark:text-medical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-black text-medical-700 dark:text-medical-400 uppercase tracking-tighter">
            Informe · {shifts.length} guardias
          </h1>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-medical-600 hover:bg-medical-500 text-white font-black rounded-xl shadow-xl shadow-medical-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          IMPRIMIR
        </button>
      </div>

      {/* Print Title */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase">Reporte de Guardias</h1>
        <p className="text-sm text-gray-600">Total: {shifts.length} guardias · {report.month || ''}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* Stats */}
        <div className="mobile-card !p-5 self-start">
          <h3 className="text-sm font-black text-medical-600 dark:text-medical-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-medical-100 dark:border-white/5 pb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Estadísticas
          </h3>
          <div className="space-y-2">
            {Object.entries(stats).map(([uid, count]) => (
              <div key={uid} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 print:border-gray-200 print:bg-white print:rounded-none print:border-b print:border-t-0 print:border-x-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase truncate pr-4">
                  {getName(uid)}
                </span>
                <span className="px-2.5 py-1 bg-medical-600 text-white rounded-lg text-[10px] font-black shrink-0 shadow-sm print:bg-black print:rounded-none">
                  {count} G.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shift List unified - paginated on screen, full on print */}
        <div className="mobile-card !p-5 print-full-list">
          {/* Screen header with pagination */}
          <div className="screen-only flex justify-between items-center mb-6 border-b border-medical-100 dark:border-white/5 pb-3">
            <h3 className="text-sm font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Listado ({shifts.length})
            </h3>
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded-lg text-medical-600 disabled:opacity-20 hover:scale-125 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-xs font-black text-slate-900 dark:text-white min-w-[3rem] text-center">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded-lg text-medical-600 disabled:opacity-20 hover:scale-125 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Print header */}
          <div className="print-rows mb-4">
            <h3 className="text-lg font-black uppercase border-b border-gray-300 pb-2 mb-2">Listado Completo de Guardias</h3>
          </div>

          {/* Screen rows - paginated */}
          <div className="screen-only space-y-2">
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
                    {getName(s.slot1UserId)}
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[10px] font-black border border-teal-200 dark:border-teal-500/30 uppercase">
                    {getName(s.slot2UserId)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Print rows - ALL shifts (no pagination) */}
          <div className="print-rows">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000', background: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '900', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '900', textTransform: 'uppercase' }}>Slot 1</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '900', textTransform: 'uppercase' }}>Slot 2</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {format(parseISO(s.date), 'EEE d MMM', { locale: es })}
                    </td>
                    <td style={{ padding: '5px 8px' }}>{getName(s.slot1UserId)}</td>
                    <td style={{ padding: '5px 8px' }}>{getName(s.slot2UserId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
