import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Head from 'next/head'

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
          // reportData.data holds { month, shifts, generatedAt, executorId }
          setReport(reportData.data)
        }
      } else {
        const raw = localStorage.getItem('lastGenerate')
        if (raw) setReport(JSON.parse(raw))
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
  const totalPages = Math.max(1, Math.ceil(shifts.length / itemsPerPage))
  const paginatedShifts = shifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats: Record<string, number> = {}
  shifts.forEach((s: any) => {
    const k1 = String(s.slot1UserId)
    const k2 = String(s.slot2UserId)
    if (k1) stats[k1] = (stats[k1] || 0) + 1
    if (k2) stats[k2] = (stats[k2] || 0) + 1
  })

  const getName = (id: any) => usersMap[Number(id)] || `ID ${id}`

  const safeFormat = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'EEE d MMM', { locale: es }) }
    catch { return dateStr }
  }

  return (
    <>
      <Head>
        <style>{`
          @media print {
            .report-screen-only { display: none !important; }
            .report-print-only  { display: block !important; }
            .report-nav         { display: none !important; }
            body { background: white !important; color: black !important; }
            @page { margin: 1.5cm; }
          }
          .report-print-only { display: none; }
        `}</style>
      </Head>

      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20">

        {/* Nav – hidden in print */}
        <div className="report-nav flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-medical-50 transition-colors">
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

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">

          {/* ── Statistics (screen + print) ── */}
          <div className="mobile-card !p-5 self-start">
            <h3 className="text-sm font-black text-medical-600 dark:text-medical-400 mb-4 uppercase tracking-[0.2em] border-b border-medical-100 dark:border-white/5 pb-2">
              Estadísticas
            </h3>
            <div className="space-y-2">
              {Object.entries(stats).map(([uid, count]) => (
                <div key={uid} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate pr-4">
                    {getName(uid)}
                  </span>
                  <span className="px-2.5 py-1 bg-medical-600 text-white rounded-lg text-[10px] font-black shrink-0">
                    {count} G.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Shift List ── */}
          <div className="mobile-card !p-5">

            {/* Screen header + paginator  */}
            <div className="report-screen-only flex justify-between items-center mb-6 border-b border-medical-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em]">
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

            {/* Screen rows (paginated) */}
            <div className="report-screen-only space-y-2">
              {paginatedShifts.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white capitalize leading-none mb-1">
                      {safeFormat(s.date)}
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

            {/* Print table (ALWAYS in DOM – toggled with CSS) */}
            <div className="report-print-only">
              <h3 style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '2px solid black', paddingBottom: '4px' }}>
                Listado completo · {shifts.length} guardias
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: 'black' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profesional 1</th>
                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profesional 2</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s: any, i: number) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid #eee',
                      pageBreakInside: 'avoid',
                      background: i % 2 === 0 ? 'white' : '#fafafa'
                    }}>
                      <td style={{ padding: '4px 8px', fontWeight: 'bold', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                        {safeFormat(s.date)}
                      </td>
                      <td style={{ padding: '4px 8px' }}>{getName(s.slot1UserId)}</td>
                      <td style={{ padding: '4px 8px' }}>{getName(s.slot2UserId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
