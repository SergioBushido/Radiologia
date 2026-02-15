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
    if (!confirm('¿Estás seguro de que quieres eliminar TODAS las guardias de este mes? Esta acción no se puede deshacer.')) return
    const month = new Date().toISOString().slice(0, 7)
    const token = localStorage.getItem('token')
    setLoading(true)
    const res = await fetch('/api/shifts/reset', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ month }) })
    setLoading(false)
    if (res.ok) {
      addToast('Guardias eliminadas', 'success')
    } else {
      const d = await res.json()
      addToast(d.error || 'Error', 'error')
    }
  }

  async function generate() {
    const month = new Date().toISOString().slice(0, 7)
    const token = localStorage.getItem('token')
    setLoading(true)
    const res = await fetch('/api/shifts/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ month }) })
    const data = await res.json()
    setLoading(false)
    localStorage.setItem('lastGenerate', JSON.stringify(data))
    addToast('Generador finalizado', 'info')
    router.push('/admin/report')
  }

  if (loading) return <div className="p-4 bg-[var(--bg-main)] text-[var(--text-main)] h-screen">Cargando...</div>

  return (
    <div className="p-6 min-h-screen pb-28">
      <div className="mb-6">
        <Logo className="w-10 h-10" />
      </div>
      <h1 className="text-xl font-semibold text-slate-400 mb-6">Panel de Administración</h1>

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

      <div className="mt-6 space-y-2">
        <h2 className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2">Personal de Plantilla ({users.length})</h2>
        {users.map(u => (
          <div key={u.id} className="mobile-card !p-3 flex justify-between items-center group">
            <div className="flex flex-col">
              <div className="font-bold text-sm">{u.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">{u.email} • {u.group || '—'} • {u.role}</div>
            </div>
            <div className="flex gap-1.5">
              <Link href={`/admin/user/${u.id}`} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-indigo-500/20">
                Editar
              </Link>
              <button onClick={() => remove(u.id)} className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-lg transition-all border border-red-500/20">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
