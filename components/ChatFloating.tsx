import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useMessages } from '../lib/MessageContext'

type Message = {
    id: number
    content: string
    senderId: number
    receiverId: number
    isRead: boolean
    createdAt: string
    sender?: { name: string, role: string }
}

type User = {
    id: number
    name: string
    role: string
}

export default function ChatFloating() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [targetUser, setTargetUser] = useState<User | null>(null) // For Admins selecting a user
    const [conversations, setConversations] = useState<User[]>([]) // For Admins list
    // const [unreadCount, setUnreadCount] = useState(0) // Removed for Global Context
    const { unreadCount, refreshUnread } = useMessages()

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Load current user
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            setCurrentUser(null)
            return
        }
        // If we already have a user and token matches? No, logic is simple: fetch me.
        // Optimization: if currentUser.id is same as decoded token? 
        // Let's just fetch. It's cheap.
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(user => {
                if (user.error) setCurrentUser(null)
                else setCurrentUser(user)
            })
            .catch(() => setCurrentUser(null))
    }, [router.asPath]) // Re-run on route change (e.g. login)

    // Removed local poll for unread count (handled by Context)


    // Poll for messages (every 3s if open)
    useEffect(() => {
        if (!isOpen || !currentUser) return

        const fetchMessages = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            // If Admin and no target selected, fetch conversations list
            if (currentUser.role === 'ADMIN' && !targetUser) {
                const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
                if (res.ok) {
                    const data = await res.json()
                    setConversations(data.conversations || [])
                }
                return
            }

            // Fetch chat messages
            let url = '/api/messages'
            if (targetUser) url += `?targetUserId=${targetUser.id}`

            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
                const data = await res.json()
                // If it returns conversations (shouldn't happen with targetUserId param but check types)
                if (Array.isArray(data)) {
                    setMessages(data)
                    // Update unread count locally since we just read them?
                    // The API marks them as read.
                }
            }
        }

        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [isOpen, currentUser, targetUser])

    // Scroll to bottom
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    const sendMessage = async () => {
        if (!newMessage.trim()) return
        const token = localStorage.getItem('token')
        const body: any = { content: newMessage }
        if (targetUser) body.targetUserId = targetUser.id

        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
        })

        if (res.ok) {
            setNewMessage('')
            // Optimistic update or wait for poll? polling is fast (3s).
            // Let's refetch immediately for better UX
            const token = localStorage.getItem('token')
            let url = '/api/messages'
            if (targetUser) url += `?targetUserId=${targetUser.id}`
            const r2 = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            if (r2.ok) setMessages(await r2.json())
        }
    }

    if (!currentUser) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-[var(--bg-surface)] w-80 h-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col pointer-events-auto mb-4 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-white flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="font-bold">Mensajería</h3>
                            {targetUser && <p className="text-xs text-indigo-200">Chat con {targetUser.name}</p>}
                        </div>
                        {targetUser && currentUser.role === 'ADMIN' && (
                            <button onClick={() => setTargetUser(null)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
                                Volver
                            </button>
                        )}
                        {!targetUser && currentUser.role === 'ADMIN' && (
                            <div className="text-xs text-indigo-200">Selecciona un usuario</div>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-black/20">
                        {/* Admin List View */}
                        {currentUser.role === 'ADMIN' && !targetUser ? (
                            <div className="space-y-2">
                                {conversations.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] mt-10">No hay conversaciones recientes.</p>}
                                {conversations.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => setTargetUser(u)}
                                        className="w-full text-left p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-indigo-500 transition shadow-sm flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">{u.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold text-sm text-[var(--text-main)]">{u.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{u.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            /* Chat View */
                            <div className="space-y-3">
                                {messages.length === 0 && <p className="text-center text-xs text-[var(--text-muted)] mt-4">Inicio del chat.</p>}
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.senderId === currentUser.id
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 text-[var(--text-main)] rounded-bl-none shadow-sm'
                                            }`}>
                                            {m.senderId !== currentUser.id && m.sender && (
                                                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-0.5">{m.sender.name}</p>
                                            )}
                                            <p>{m.content}</p>
                                            <span className={`text-[10px] block text-right mt-1 ${m.senderId === currentUser.id ? 'text-indigo-200' : 'text-[var(--text-muted)]'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    {(currentUser.role !== 'ADMIN' || targetUser) && (
                        <div className="p-3 bg-[var(--bg-surface)] border-t border-slate-200 dark:border-white/5 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-[var(--text-main)]"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all pointer-events-auto relative group"
            >
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-surface)] animate-bounce">
                        {unreadCount}
                    </span>
                )}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    )}
                </svg>
            </button>
        </div>
    )
}
