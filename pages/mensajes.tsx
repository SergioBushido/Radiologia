
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useMessages } from '../lib/MessageContext'
import UserAvatar from '../components/UserAvatar'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

type Message = {
    id: number
    content: string
    senderId: number
    receiverId: number
    isRead: boolean
    createdAt: string
    sender?: { name: string, role: string, avatarUrl?: string | null }
}

type Conversation = {
    id: number
    name: string
    role: string
    avatarUrl?: string | null
    unreadCount: number
    lastMessage?: { content: string, createdAt: string }
}

type User = {
    id: number
    name: string
    role: string
    avatarUrl?: string | null
}

export default function MessagesPage() {
    const { user: currentUser } = useAuth()
    const { refreshUnread } = useMessages()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [targetUser, setTargetUser] = useState<Conversation | User | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [showUserList, setShowUserList] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Initial load: Conversations and All Users
    useEffect(() => {
        if (!currentUser) return
        fetchConversations()
        fetchAllUsers()
    }, [currentUser])

    // Poll for messages and updates
    useEffect(() => {
        if (!currentUser) return

        const interval = setInterval(() => {
            fetchConversations()
            if (targetUser) fetchChat(targetUser.id)
        }, 4000)

        return () => clearInterval(interval)
    }, [currentUser, targetUser])

    // Auto scroll to bottom
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

    const selectUser = (user: Conversation | User) => {
        setTargetUser(user)
        setMessages([])
        fetchChat(user.id)
        setShowUserList(false)
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !targetUser) return
        const token = localStorage.getItem('token')
        setLoading(true)

        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content: newMessage, targetUserId: targetUser.id })
        })

        if (res.ok) {
            setNewMessage('')
            fetchChat(targetUser.id)
            fetchConversations()
        }
        setLoading(false)
    }

    const formatMessageTime = (dateStr: string) => {
        const date = new Date(dateStr)
        if (isToday(date)) return format(date, 'HH:mm')
        if (isYesterday(date)) return 'Ayer'
        return format(date, 'dd/MM/yy')
    }

    if (!currentUser) return <div className="h-screen flex items-center justify-center font-bold">Iniciando sesión...</div>

    const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar: Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 ${targetUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-medical-600 text-white shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-black italic tracking-tighter">SIGEO Chat</h1>
                        <button
                            onClick={() => setShowUserList(true)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all active:scale-90"
                            title="Nuevo mensaje"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p className="font-bold uppercase text-xs tracking-widest">No hay chats activos</p>
                            <button onClick={() => setShowUserList(true)} className="mt-4 text-medical-500 font-black text-sm hover:underline">Pulsa aquí para empezar</button>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => selectUser(conv)}
                                className={`w-full flex items-center gap-4 p-4 border-b border-slate-50 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-white/5 ${targetUser?.id === conv.id ? 'bg-medical-50/50 dark:bg-medical-500/10' : ''}`}
                            >
                                <UserAvatar name={conv.name} avatarUrl={conv.avatarUrl} role={conv.role} size="md" />
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{conv.name}</h3>
                                        {conv.lastMessage && (
                                            <span className="text-[10px] text-slate-400 font-bold ml-2">
                                                {formatMessageTime(conv.lastMessage.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-4">
                                            {conv.lastMessage?.content || 'Empieza a chatear'}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="bg-medical-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-[var(--bg-main)] ${!targetUser ? 'hidden md:flex' : 'flex'}`}>
                {targetUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setTargetUser(null)} className="md:hidden p-2 text-slate-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <UserAvatar name={targetUser.name} avatarUrl={targetUser.avatarUrl} role={targetUser.role} size="sm" />
                                <div>
                                    <h2 className="font-bold text-slate-900 dark:text-white leading-none">{targetUser.name}</h2>
                                    <span className="text-[10px] text-medical-600 dark:text-medical-400 font-black uppercase tracking-widest">{targetUser.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50 dark:bg-black/20"
                        >
                            {messages.map((m, i) => {
                                const isMe = m.senderId === currentUser.id
                                return (
                                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative group ${isMe
                                                ? 'bg-medical-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-900 dark:text-white rounded-bl-none'
                                            }`}>
                                            <p className="text-sm font-medium leading-relaxed break-words">{m.content}</p>
                                            <span className={`text-[9px] font-bold block mt-1 text-right opacity-60 ${isMe ? 'text-white' : 'text-slate-500'}`}>
                                                {format(new Date(m.createdAt), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <textarea
                                    className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-medical-500 text-slate-900 dark:text-white font-medium resize-none shadow-inner"
                                    placeholder="Escribe un mensaje..."
                                    rows={1}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            sendMessage()
                                        }
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || loading}
                                    className="bg-medical-600 text-white p-3 rounded-full disabled:opacity-50 hover:bg-medical-500 transition-all shadow-lg active:scale-90"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30 select-none">
                        <div className="w-24 h-24 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" /></svg>
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-widest">Tus Mensajes</h2>
                        <p className="mt-2 font-bold text-sm">Selecciona una conversación para empezar</p>
                    </div>
                )}
            </div>

            {/* User Selection Modal Overlay */}
            {showUserList && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUserList(false)}>
                    <div
                        className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 bg-medical-600 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black italic tracking-tighter">Nueva conversación</h2>
                            <button onClick={() => setShowUserList(false)} className="p-1 hover:bg-white/20 rounded-lg"><svg className="w-6 h-6 border-2 border-white rounded" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-4 border-b border-slate-100 dark:border-white/5">
                            <input
                                type="text"
                                placeholder="Buscar colega..."
                                className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-medical-500 font-bold text-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {filteredUsers.length === 0 ? (
                                <p className="text-center p-8 text-slate-400 font-bold">No se encontraron usuarios</p>
                            ) : (
                                filteredUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => selectUser(u)}
                                        className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-[0.98]"
                                    >
                                        <UserAvatar name={u.name} avatarUrl={u.avatarUrl} role={u.role} size="md" />
                                        <div className="text-left">
                                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                            <p className="text-[10px] text-medical-600 font-black uppercase tracking-widest">{u.role}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

