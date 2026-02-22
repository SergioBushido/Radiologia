import Link from 'next/link'
import { useAuth } from '../lib/useAuth'
import { useMessages } from '../lib/MessageContext'

export default function BottomNav({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useMessages()

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl flex items-center justify-around px-2 py-2 border border-slate-200 dark:border-white/10 max-w-lg mx-auto z-50">
      <Link href="/" className="flex flex-col items-center gap-1 p-2 text-slate-500 dark:text-slate-400 hover:text-medical-600 dark:hover:text-white transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span className="text-[10px] font-bold uppercase tracking-tighter">Panel</span>
      </Link>
      <Link href="/mis-guardias" className="flex flex-col items-center gap-1 p-2 text-slate-500 dark:text-slate-400 hover:text-medical-600 dark:hover:text-white transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        <span className="text-[10px] font-bold uppercase tracking-tighter">Mis G.</span>
      </Link>
      <Link href="/vacaciones" className="flex flex-col items-center gap-1 p-2 text-slate-500 dark:text-slate-400 hover:text-medical-600 dark:hover:text-white transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
        <span className="text-[10px] font-bold uppercase tracking-tighter">Vacas</span>
      </Link>
      <Link href="/perfil" className="flex flex-col items-center gap-1 p-2 text-slate-500 dark:text-slate-400 hover:text-medical-600 dark:hover:text-white transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        <span className="text-[10px] font-bold uppercase tracking-tighter">Perfil</span>
      </Link>
      <button
        onClick={logout}
        className="flex flex-col items-center gap-1 p-2 text-red-500 hover:text-red-400 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        <span className="text-[10px] font-black uppercase tracking-tighter">Salir</span>
      </button>
    </nav>
  )
}
