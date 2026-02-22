import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'

export default function Perfil({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
    const { user, loading: authLoading, logout } = useAuth()
    const router = useRouter()
    const { addToast } = useToast()
    const { setLoading } = useLoading()

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        } else if (user) {
            setForm(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }))
        }
    }, [authLoading, user, router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (form.password && form.password !== form.confirmPassword) {
            return addToast('Las contraseñas no coinciden', 'error')
        }

        if (!form.name || !form.email) {
            return addToast('El nombre y el email son obligatorios', 'error')
        }

        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/users/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password || undefined
                })
            })

            if (res.ok) {
                addToast('Perfil actualizado con éxito', 'success')
                setForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
            } else {
                const data = await res.json()
                throw new Error(data.error || 'Error al actualizar')
            }
        } catch (error: any) {
            addToast(error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || !user) return <div className="p-4 text-white">Cargando...</div>

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-24">
            <div className="sticky top-0 z-20 bg-gradient-to-r from-medical-600 to-medical-800 p-4 text-white shadow-lg flex items-center justify-between">
                <h1 className="text-xl font-bold uppercase tracking-wider">Mi Perfil</h1>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">
                <div className="mobile-card p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-medical-500/10 border-2 border-medical-500 flex items-center justify-center text-2xl font-black text-medical-600 dark:text-medical-400">
                            {user.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black px-2 py-1 bg-medical-500/10 text-medical-600 dark:text-medical-400 rounded uppercase tracking-widest border border-medical-500/20">
                                    {user.role}
                                </span>
                                {user.role === 'ADMIN' && (
                                    <button
                                        type="button"
                                        onClick={() => router.push('/admin')}
                                        className="text-[10px] font-black px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded uppercase tracking-widest border border-red-500/20 hover:bg-red-500/20 transition-all font-bold"
                                    >
                                        Ir a Admin
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="ml-auto">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95 border border-slate-200 dark:border-white/10"
                                title="Cambiar tema"
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1 ml-1">Nombre</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-medical-500 transition-all font-medium"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1 ml-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-medical-500 transition-all font-medium"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-medical-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Cambiar Contraseña
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-1 ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="Dejar en blanco para no cambiar"
                                        className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-medical-500 transition-all font-medium"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-1 ml-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-medical-500 transition-all font-medium"
                                        value={form.confirmPassword}
                                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full p-4 rounded-xl bg-medical-600 hover:bg-medical-500 text-white font-bold shadow-lg shadow-medical-500/20 transition-all active:scale-95 mt-4"
                        >
                            Guardar Cambios
                        </button>

                        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                            <button
                                type="button"
                                onClick={logout}
                                className="w-full p-4 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Cerrar Sesión
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
