import Head from 'next/head'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import ToastProvider from '../components/ToastProvider'
import LoadingProvider from '../components/LoadingProvider'
import BottomNav from '../components/BottomNav'
import ChatFloating from '../components/ChatFloating'
import { MessageProvider } from '../lib/MessageContext'
import { AuthProvider } from '../lib/AuthContext'

const inter = Inter({ subsets: ['latin'] })

import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isLoginPage = router.pathname === '/login'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark'
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('dark', saved === 'dark')
    } else {
      // Default is dark for this app as requested before
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <div className={inter.className}>
      <Head>
        <title>Aplicación de guardias y servicios — Gestión de Guardias</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <AuthProvider>
        <ToastProvider>
          <LoadingProvider>
            <MessageProvider>
              <Component {...pageProps} toggleTheme={toggleTheme} theme={theme} />
              {!isLoginPage && <BottomNav toggleTheme={toggleTheme} theme={theme} />}
              <ChatFloating />
            </MessageProvider>
          </LoadingProvider>
        </ToastProvider>
      </AuthProvider>
    </div>
  )
}
