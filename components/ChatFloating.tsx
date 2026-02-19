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
    unreadCount?: number
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
                    <div className="bg-gradient-to-r from-medical-600 to-medical-800 p-4 text-white flex justify-between items-center shrink-0 shadow-lg">
                        <div>
                            <h3 className="font-bold">Mensajería</h3>
                            {targetUser && <p className="text-xs text-medical-100">Chat con {targetUser.name}</p>}
                        </div>
                        {targetUser && currentUser.role === 'ADMIN' && (
                            <button onClick={() => setTargetUser(null)} className="text-xs bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition font-bold">
                                Volver
                            </button>
                        )}
                        {!targetUser && currentUser.role === 'ADMIN' && (
                            <div className="text-xs text-medical-100 font-medium">Usuarios</div>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
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
                                        className="w-full text-left p-3 bg-white dark:bg-white/5 rounded-xl border-2 border-slate-100 dark:border-white/5 hover:border-medical-500 transition shadow-sm flex items-center gap-3 active:scale-[0.98]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-medical-100 dark:bg-medical-500/20 text-medical-700 dark:text-medical-400 flex items-center justify-center font-black text-xs shrink-0">{u.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{u.role}</p>
                                        </div>
                                        {u.unreadCount && u.unreadCount > 0 && (
                                            <div className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-md animate-pulse">
                                                {u.unreadCount}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            /* Chat View */
                            <div className="space-y-3">
                                {messages.length === 0 && <p className="text-center text-xs text-[var(--text-muted)] mt-4">Inicio del chat.</p>}
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-md ${m.senderId === currentUser.id
                                            ? 'bg-medical-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-white/10 border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-bl-none'
                                            }`}>
                                            {m.senderId !== currentUser.id && m.sender && (
                                                <p className="text-[10px] font-black text-medical-600 dark:text-medical-400 mb-0.5">{m.sender.name}</p>
                                            )}
                                            <p className="font-medium leading-tight">{m.content}</p>
                                            <span className={`text-[9px] font-bold block text-right mt-1 ${m.senderId === currentUser.id ? 'text-medical-100' : 'text-slate-500'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
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
                                className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-medical-500 text-slate-900 dark:text-white font-medium shadow-inner"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                                className="p-2 bg-medical-600 text-white rounded-xl hover:bg-medical-500 disabled:opacity-50 transition shadow-lg active:scale-90"
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
                className="bg-medical-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(2,132,199,0.5)] hover:scale-110 active:scale-95 transition-all pointer-events-auto relative group z-[101]"
            >
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg animate-bounce">
                        {unreadCount}
                    </span>
                )}
                <svg className="w-6 h-6 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
