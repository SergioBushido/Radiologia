
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

    const refreshUnread = () => {
        if (!user) return
        const token = localStorage.getItem('token')
        if (!token) return
        fetch('/api/messages/unread', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                const newCount = data.count || 0
                setUnreadCount(prev => {
                    // Only notify if count INCREASED (new message arrived)
                    // avoid notifying on initial load if we want, but actually notifying on load is good reminder?
                    // User request: "cuando llega un mensaje nuevo no hay ningun aviso"
                    // If I reload and have 5 unread, should it say "5 unread"? Yes.
                    // But if I already saw the notification (on prev page load)?
                    // Maybe suppress if prev === 0 and we are just starting?
                    // Let's notify always for now, or ensure strictly `newCount > prev`.
                    // If I read a message, `newCount` goes down.
                    if (newCount > prev) {
                        addToast(`Tienes ${newCount} mensaje(s) sin leer`, 'info')
                        // Play sound? Browser policy blocks auto-audio usually, needs interaction.
                    }
                    return newCount
                })
            })
            .catch(() => { })
    }

    useEffect(() => {
        if (user) {
            refreshUnread()
            const interval = setInterval(refreshUnread, 10000)
            return () => clearInterval(interval)
        } else {
            setUnreadCount(0)
        }
    }, [user])

    return (
        <MessageContext.Provider value={{ unreadCount, refreshUnread }}>
            {children}
        </MessageContext.Provider>
    )
}
