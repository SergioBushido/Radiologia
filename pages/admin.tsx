import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/useAuth'
import { useRouter } from 'next/router'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'

import Logo from '../components/Logo'

export default function Admin() {
  const [users, setUsers] = useState<any[]>([])
  const { user, loading } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()
  const { setLoading } = useLoading()
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<any>({ name: '', email: '', password: 'Password123!', role: 'USER', group: '' })
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { if (!loading && !user) router.push('/login'); if (user && user.role !== 'ADMIN') router.push('/') }, [loading, user])
  useEffect(() => { if (user && user.role === 'ADMIN') fetchUsers() }, [user])

  async function fetchUsers() { const token = localStorage.getItem('token'); const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }); setUsers(await res.json()) }

  async function remove(id: number) { if (!confirm('Eliminar usuario?')) return; const token = localStorage.getItem('token'); await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchUsers() }

  async function createUser() {
    const token = localStorage.getItem('token')
    setLoading(true)
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(createForm) })
    setLoading(false)
    if (res.ok) { setShowCreate(false); setCreateForm({ name: '', email: '', password: 'Password123!', role: 'USER', group: '' }); fetchUsers(); addToast('Usuario creado', 'success') } else { const d = await res.json(); addToast(d.error || 'Error', 'error') }
  }

  async function resetShifts() {
    if (!confirm(`¿Estás seguro de que quieres eliminar TODAS las guardias de ${selectedMonth}? Esta acción no se puede deshacer.`)) return
    const token = localStorage.getItem('token')
    setLoading(true)
    const res = await fetch('/api/shifts/reset', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ month: selectedMonth }) })
    setLoading(false)
    if (res.ok) {
      addToast('Guardias eliminadas', 'success')
    } else {
      const d = await res.json()
      addToast(d.error || 'Error', 'error')
    }
  }

  async function generate() {
    const token = localStorage.getItem('token')
    setLoading(true)
    const res = await fetch('/api/shifts/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ month: selectedMonth }) })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      localStorage.setItem('lastGenerate', JSON.stringify(data))
      addToast('Generador finalizado', 'info')
      if (data.reportId) {
        router.push(`/admin/report?id=${data.reportId}`)
      } else {
        router.push('/admin/report')
      }
    } else {
      addToast(data.error || 'Error al generar', 'error')
    }
  }

  if (loading) return <div className="p-4 bg-[var(--bg-main)] text-[var(--text-main)] h-screen">Cargando...</div>

  return (
    <div className="p-6 min-h-screen pb-28">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <h1 className="text-xl font-black text-medical-600 dark:text-medical-400">Admin Panel (v2)</h1>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="p-2 rounded-lg bg-[var(--bg-card)] border border-slate-200 dark:border-slate-700 text-sm font-bold shadow-sm"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={generate} className="flex-1 min-w-[150px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Autogenerar
        </button>
        <button onClick={resetShifts} className="flex-none bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-red-600 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Resetear
        </button>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Nuevo
        </button>
        <Link href="/admin/reports" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Historial
        </Link>
      </div>

      {showCreate && (
        <div className="mt-4 mobile-card max-w-md mx-auto !p-4 border-indigo-500/30">
          <h2 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-widest">Crear Usuario</h2>
          <div className="space-y-2">
            <input className="w-full p-3 rounded-xl text-sm" placeholder="Nombre" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
            <input className="w-full p-3 rounded-xl text-sm" placeholder="Email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="w-full p-3 rounded-xl text-sm" value={createForm.group || ''} onChange={e => setCreateForm({ ...createForm, group: e.target.value })}>
                <option value="">sin especificar</option>
                <option value="MAMA">MAMA</option>
                <option value="URGENCIAS">URGENCIAS</option>
              </select>
              <select className="w-full p-3 rounded-xl text-sm" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <input className="w-full p-3 rounded-xl text-sm" placeholder="Contraseña" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <button onClick={createUser} className="flex-1 bg-indigo-600 text-white font-bold p-3 rounded-xl">Crear</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-3 rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Plantilla del Centro ({users.length})</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4 hidden sm:block opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {users.map(u => (
            <div key={u.id} className="mobile-card !p-4 flex items-center gap-4 group transition-all duration-300 hover:border-medical-500/50 dark:hover:border-medical-400/30">
              {/* Avatar/Initial */}
              <div className="w-10 h-10 rounded-full bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 flex items-center justify-center font-bold text-sm shrink-0 border border-medical-200 dark:border-medical-500/20 group-hover:scale-110 transition-transform">
                {u.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate hover:text-medical-600 transition-colors uppercase tracking-tight">{u.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${u.role === 'ADMIN' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                    {u.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[10px] text-slate-500 font-medium truncate opacity-70 flex items-center gap-1 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {u.email}
                  </span>
                  <span className="text-[10px] text-medical-600 dark:text-medical-400 font-bold flex items-center gap-1 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
                    {u.group || 'General'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {u.monthlyLimit || 22} g/m
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Link href={`/admin/user/${u.id}`} className="p-2 bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 rounded-lg transition-all hover:bg-medical-600 hover:text-white dark:hover:bg-medical-500 active:scale-90 border border-medical-200 dark:border-medical-500/30" title="Editar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </Link>
                <button
                  onClick={() => remove(u.id)}
                  className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all active:scale-90 border border-red-200 dark:border-red-500/30"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
