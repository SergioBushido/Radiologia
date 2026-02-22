import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'

export default function Perfil() {
    const { user, loading: authLoading } = useAuth()
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
                            <span className="text-[10px] font-black px-2 py-1 bg-medical-500/10 text-medical-600 dark:text-medical-400 rounded uppercase tracking-widest border border-medical-500/20">
                                {user.role}
                            </span>
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
                    </form>
                </div>
            </div>
        </div>
    )
}
