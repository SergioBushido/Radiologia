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
    const data = localStorage.getItem('lastGenerate')
    if (data) {
      setReport(JSON.parse(data))
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
  }, [])

  if (!report) return <div className="p-8 text-white">Cargando reporte...</div>

  const shifts = report.shifts || []

  // Group by user to show equity?
  const stats: any = {}
  shifts.forEach((s: any) => {
    if (!stats[s.slot1UserId]) stats[s.slot1UserId] = 0
    if (!stats[s.slot2UserId]) stats[s.slot2UserId] = 0
    stats[s.slot1UserId]++
    stats[s.slot2UserId]++
  })

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Informe de Generación</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stats Card */}
        <div className="mobile-card !p-5">
          <h3 className="text-lg font-bold text-indigo-400 mb-4">Estadísticas de Asignación</h3>
          <div className="space-y-3">
            {Object.entries(stats).map(([uid, count]: any) => (
              <div key={uid} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-sm font-medium text-slate-300">{usersMap[Number(uid)] || `Usuario ${uid}`}</span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold">{count} guardias</span>
              </div>
            ))}
          </div>
        </div>

        {/* List Card */}
        <div className="mobile-card !p-5">
          <h3 className="text-lg font-bold text-emerald-400 mb-4">Guardias Generadas ({shifts.length})</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {shifts.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white capitalize">
                    {format(parseISO(s.date), 'EEEE d MMMM', { locale: es })}
                  </span>
                  <span className="text-xs text-slate-500">{s.date}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-200 text-xs font-bold border border-indigo-500/30">
                    {usersMap[s.slot1UserId] || `ID ${s.slot1UserId}`}
                  </div>
                  <div className="px-2 py-1 rounded bg-cyan-600/30 text-cyan-200 text-xs font-bold border border-cyan-500/30">
                    {usersMap[s.slot2UserId] || `ID ${s.slot2UserId}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
