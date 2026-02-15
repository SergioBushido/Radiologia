import { useState } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'

import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('admin@youshift.local')
  const [password, setPassword] = useState('Password123!')
  const router = useRouter()
  const { addToast } = useToast()
  const { setLoading } = useLoading()

  async function submit(e: any) {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.token)
        addToast('Login correcto', 'success')
        router.push('/')
      } else {
        const err = await res.json().catch(() => null)
        addToast(err?.error || 'Login failed', 'error')
      }
    } catch (e) {
      addToast('Error de conexión', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-main)]">
      <form onSubmit={submit} className="w-full max-w-md mobile-card bg-white dark:bg-slate-900/50 relative z-10 overflow-hidden !p-0">
        {/* Flag Strip - integrated into card */}
        <div className="w-full h-3 flex border-b border-slate-100 dark:border-white/5">
          <div className="flex-1 flex flex-col">
            <div className="h-1/4 bg-[#AD1519]"></div>
            <div className="h-2/4 bg-[#FABD00]"></div>
            <div className="h-1/4 bg-[#AD1519]"></div>
          </div>
          <div className="flex-1 flex">
            <div className="w-1/3 bg-white"></div>
            <div className="w-1/3 bg-[#00519E]"></div>
            <div className="w-1/3 bg-[#F9D61D]"></div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Logo className="w-20 h-20" textVisible={false} />
          </div>
          <h1 className="text-xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-white dark:to-slate-400 leading-tight">
            Aplicación de guardias y servicios
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
              <input className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Password</label>
              <input type="password" className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              Entrar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
