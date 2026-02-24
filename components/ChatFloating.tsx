import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useMessages } from '../lib/MessageContext'
import UserAvatar from './UserAvatar'

type Message = {
    id: number
    content: string
    senderId: number
    receiverId: number
    isRead: boolean
    createdAt: string
    sender?: { name: string, role: string, avatarUrl?: string | null }
}

type User = {
    id: number
    name: string
    role: string
    avatarUrl?: string | null
    unreadCount?: number
}

export default function ChatFloating() {
    const { user: currentUser } = useAuth()
    const { unreadCount: totalUnread, refreshUnread } = useMessages()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [targetUser, setTargetUser] = useState<User | null>(null)
    const [conversations, setConversations] = useState<User[]>([])
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [showUserList, setShowUserList] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Initial load
    useEffect(() => {
        if (!isOpen || !currentUser) return
        fetchConversations()
        fetchAllUsers()
    }, [isOpen, currentUser])

    // Poll for chat
    useEffect(() => {
        if (!isOpen || !currentUser || !targetUser) return
        const interval = setInterval(() => fetchChat(targetUser.id), 4000)
        return () => clearInterval(interval)
    }, [isOpen, currentUser, targetUser])

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const fetchConversations = async () => {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
            const data = await res.json()
            setConversations(data.conversations || [])
            refreshUnread()
        }
    }

    const fetchAllUsers = async () => {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
            const data = await res.json()
            setAllUsers(data.filter((u: User) => u.id !== currentUser?.id))
        }
    }

    const fetchChat = async (userId: number) => {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/messages?targetUserId=${userId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) setMessages(data)
        }
    }

    const selectUser = (user: User) => {
        setTargetUser(user)
        setMessages([])
        fetchChat(user.id)
        setShowUserList(false)
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !targetUser) return
        const token = localStorage.getItem('token')
        setLoading(true)
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content: newMessage, targetUserId: targetUser.id })
        })
        setNewMessage('')
        fetchChat(targetUser.id)
        fetchConversations()
        setLoading(false)
    }

    if (!currentUser) return null

    const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[320px] sm:w-[380px] h-[500px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-10 duration-300 mb-4">
                    <div className="bg-medical-600 p-4 text-white flex items-center justify-between shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            {targetUser && (
                                <button onClick={() => setTargetUser(null)} className="p-1 hover:bg-white/20 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            )}
                            <h3 className="font-black tracking-tight">{targetUser ? targetUser.name : 'Mensajes'}</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-black/20">
                        {showUserList ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-black uppercase text-slate-400">Seleccionar colega</span>
                                    <button onClick={() => setShowUserList(false)} className="text-[10px] font-black text-medical-600 underline">Cerrar</button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/5 mb-4 text-xs outline-none focus:ring-1 focus:ring-medical-500"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {filteredUsers.map(u => (
                                    <button key={u.id} onClick={() => selectUser(u)} className="w-full flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-white/5 rounded-xl border border-transparent hover:border-medical-500 transition-all">
                                        <UserAvatar name={u.name} avatarUrl={u.avatarUrl} role={u.role} size="sm" />
                                        <div className="text-left">
                                            <p className="font-bold text-xs text-slate-900 dark:text-white">{u.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{u.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : targetUser ? (
                            <div className="space-y-3">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm relative ${m.senderId === currentUser.id ? 'bg-medical-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'}`}>
                                            <p className="text-sm font-medium">{m.content}</p>
                                            <span className={`text-[8px] font-bold block mt-1 text-right opacity-60 ${m.senderId === currentUser.id ? 'text-white' : 'text-slate-500'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-black uppercase text-slate-400">Conversaciones</span>
                                    <button onClick={() => setShowUserList(true)} className="p-1.5 bg-medical-50 dark:bg-medical-500/10 text-medical-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                                </div>
                                {conversations.length === 0 && <div className="text-center p-8 text-xs text-slate-400 font-bold">No hay chats activos</div>}
                                {conversations.map(u => (
                                    <button key={u.id} onClick={() => selectUser(u)} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-medical-500 transition shadow-sm relative group">
                                        <UserAvatar name={u.name} avatarUrl={u.avatarUrl} role={u.role} size="sm" />
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{u.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{u.role}</p>
                                        </div>
                                        {u.unreadCount ? (
                                            <span className="absolute top-2 right-2 bg-medical-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black shadow-md">{u.unreadCount}</span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {targetUser && !showUserList && (
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex gap-2">
                            <input
                                className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical-500 text-slate-900 dark:text-white font-medium"
                                placeholder="Mensaje..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage} disabled={!newMessage.trim() || loading} className="bg-medical-600 text-white p-2 rounded-xl disabled:opacity-50 active:scale-95 shadow-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-medical-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(2,132,199,0.5)] hover:scale-110 active:scale-95 transition-all pointer-events-auto relative group z-[101]"
            >
                {totalUnread > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg animate-bounce">
                        {totalUnread}
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
