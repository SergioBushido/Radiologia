import { useState } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '../components/ToastProvider'
import { useLoading } from '../components/LoadingProvider'
import Logo from '../components/Logo'
import Link from 'next/link'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()
    const { addToast } = useToast()
    const { setLoading } = useLoading()

    async function submit(e: any) {
        e.preventDefault()
        try {
            setLoading(true)
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            if (res.ok) {
                setIsSuccess(true)
                addToast('Solicitud enviada', 'success')
            } else {
                const err = await res.json().catch(() => null)
                addToast(err?.error || 'Error al solicitar recuperación', 'error')
            }
        } catch (e) {
            addToast('Error de conexión', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-main)]">
            <div className="w-full max-w-md mobile-card bg-white dark:bg-slate-900/50 relative z-10 overflow-hidden !p-0">
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
                        Recuperar Contraseña
                    </h1>

                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl text-sm mb-6">
                                Si el correo <b>{email}</b> está registrado, en breve te enviaremos un enlace para restablecer tu contraseña.
                                <br /><br />
                                <span className="text-xs opacity-80 italic">Si no lo recibes en unos minutos, por favor revisa tu carpeta de spam.</span>
                            </div>
                            <Link href="/login" className="block text-medical-600 hover:text-medical-700 dark:text-medical-400 font-medium">
                                Volver al Inicio de Sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <p className="text-sm text-[var(--text-muted)] text-center mb-6">
                                    Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                                </p>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[var(--text-main)] focus:ring-2 focus:ring-medical-500 outline-none transition-all"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full mt-6 bg-medical-600 hover:bg-medical-500 text-white font-bold p-4 rounded-xl shadow-lg shadow-medical-500/20 transition-all active:scale-95">
                                Enviar enlace
                            </button>

                            <div className="text-center mt-6">
                                <Link href="/login" className="text-sm text-slate-500 hover:text-medical-600 transition-colors">
                                    Volver al Inicio de Sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
