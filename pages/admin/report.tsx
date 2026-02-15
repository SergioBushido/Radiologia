import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Report() {
  const [data, setData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const raw = localStorage.getItem('lastGenerate')
    if (!raw) { router.push('/admin'); return }
    setData(JSON.parse(raw))
  }, [])

  if (!data) return <div className="p-4 bg-[var(--bg-main)] text-white h-screen">Cargando...</div>

  return (
    <div className="p-6 min-h-screen pb-28 bg-[var(--bg-main)]">
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-6 flex items-center gap-3">
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        Reporte de generación
      </h1>

      <div className="mt-8 space-y-6">
        <div>
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Guardias Creadas ({data.created?.length || 0})</h2>
          <div className="space-y-3">
            {data.created?.map((c: any) => (
              <div key={c.date} className="mobile-card flex justify-between items-center group">
                <div className="font-mono text-indigo-400">{c.date}</div>
                <div className="text-sm font-semibold text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  {c.slot1}, {c.slot2}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.conflicts?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4 ml-1">Conflictos No Resueltos</h2>
            <div className="space-y-4">
              {data.conflicts?.map((c: any) => (
                <div key={c.date} className="mobile-card border-red-500/20 bg-red-500/5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-red-400 font-bold">{c.date}</div>
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold uppercase">Error</span>
                  </div>
                  <div className="text-sm text-slate-400 mb-4">{c.reason}</div>

                  <details className="group/detail">
                    <summary className="text-xs font-bold text-slate-600 cursor-pointer hover:text-slate-400 transition-colors flex items-center gap-2">
                      <svg className="w-3 h-3 transition-transform group-open/detail:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      Ver {c.attempts?.length} intentos fallidos
                    </summary>
                    <div className="mt-4 space-y-2 pl-2 border-l-2 border-slate-800">
                      {c.attempts?.map((a: any, idx: number) => (
                        <div key={idx} className="p-3 bg-black/20 rounded-xl border border-white/5">
                          <div className="text-xs text-slate-500 mb-1">Pareja: <span className="text-slate-300 font-bold">{a.pair?.join(' + ')}</span></div>
                          <div className="flex flex-wrap gap-1">
                            {a.errors?.map((e: any, eidx: number) => (
                              <span key={eidx} className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">{e.code}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => router.push('/admin')} className="mt-12 w-full p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-white/5 transition-all">
        Volver al Panel
      </button>
    </div>
  )
}
