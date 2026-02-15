import Link from 'next/link'
import { useAuth } from '../lib/useAuth'

export default function BottomNav({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth()

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center justify-between px-6 py-3 border border-slate-200 dark:border-white/10 max-w-lg mx-auto overflow-x-auto gap-4">
      <Link href="/" className="text-center font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors whitespace-nowrap text-sm">Calendario</Link>
      <Link href="/mis-guardias" className="text-center font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors whitespace-nowrap text-sm">Mis guardias</Link>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90"
        title="Cambiar tema"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      {user?.role === 'ADMIN' && (
        <Link href="/admin" className="text-center font-bold text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all whitespace-nowrap uppercase text-[10px] tracking-widest bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">Admin</Link>
      )}

      <button onClick={logout} className="text-center font-medium text-red-500 hover:text-red-400 transition-colors whitespace-nowrap text-sm">Salir</button>
    </nav>
  )
}
