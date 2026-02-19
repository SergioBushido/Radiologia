
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useToast } from '../components/ToastProvider'

type AccessContextType = {
    unreadCount: number
    refreshUnread: () => void
}

const MessageContext = createContext<AccessContextType>({ unreadCount: 0, refreshUnread: () => { } })

export const useMessages = () => useContext(MessageContext)

export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const { addToast } = useToast()
    const [unreadCount, setUnreadCount] = useState(0)
    const [isFirstLoad, setIsFirstLoad] = useState(true)

    const refreshUnread = async () => {
        if (!user) return
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('/api/messages/unread', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) return
            const data = await res.json()
            const newCount = data.count || 0

            setUnreadCount(prev => {
                // If count increased, and it's not the initial load from 0
                if (newCount > prev && !isFirstLoad) {
                    addToast(`¡Nuevo mensaje! Tienes ${newCount} sin leer`, 'success')
                    // Provide a little haptic/visual feedback? The toast is enough.
                }
                return newCount
            })
            if (isFirstLoad) setIsFirstLoad(false)
        } catch (e) {
            console.error('Error fetching unread messages:', e)
        }
    }

    useEffect(() => {
        if (user) {
            refreshUnread()
            const interval = setInterval(refreshUnread, 4000)
            return () => clearInterval(interval)
        } else {
            setUnreadCount(0)
            setIsFirstLoad(true)
        }
    }, [user])

    return (
        <MessageContext.Provider value={{ unreadCount, refreshUnread }}>
            {children}
        </MessageContext.Provider>
    )
}
