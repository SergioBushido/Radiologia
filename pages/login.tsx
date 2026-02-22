import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'

import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { addToast } = useToast()
  const { setLoading } = useLoading()

  useEffect(() => {
    if (user) router.push('/')
  }, [user, router])

  async function submit(e: any) {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.token)
        await refreshUser()
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
          <h1 className="text-xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-medical-600 to-medical-400 dark:from-white dark:to-slate-400 leading-tight">
            Aplicación de guardias y servicios
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
              <input type="email" className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[var(--text-main)] focus:ring-2 focus:ring-medical-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[var(--text-main)] focus:ring-2 focus:ring-medical-500 outline-none transition-all pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-medical-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button className="w-full mt-6 bg-medical-600 hover:bg-medical-500 text-white font-bold p-4 rounded-xl shadow-lg shadow-medical-500/20 transition-all active:scale-95">
              Entrar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
