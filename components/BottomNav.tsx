import Link from 'next/link'
import { useAuth } from '../lib/useAuth'
import { useMessages } from '../lib/MessageContext'

export default function BottomNav({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useMessages()

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl flex items-center justify-between px-2 py-2 border border-slate-200 dark:border-white/10 max-w-lg mx-auto z-50">
      {/* Navegación principal */}
      <div className="flex items-center justify-around flex-1">
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
        {user?.role === 'ADMIN' && (
          <Link href="/admin" className="flex flex-col items-center gap-1 p-2 text-red-500 hover:text-red-600 dark:text-red-400 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Admin</span>
          </Link>
        )}
      </div>

      {/* Acciones secundarias */}
      <div className="flex items-center border-l border-slate-200 dark:border-white/10 pl-2 gap-1">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          title="Cambiar tema"
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        <button
          onClick={logout}
          className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
          title="Salir"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </nav>
  )
}
