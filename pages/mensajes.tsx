
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useMessages } from '../lib/MessageContext'
import ChatFloating from '../components/ChatFloating' // Reusing logic? No, let's make a full page version or just wrap it?
// ChatFloating is a floating widget. A full page needs standard structure.
// Let's copy the logic or create a Chat component properly.
// For speed, I'll copy the logic into a full page component.

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

export default function MessagesPage() {
    const { user: currentUser } = useAuth()
    const { refreshUnread } = useMessages()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [targetUser, setTargetUser] = useState<User | null>(null)
    const [conversations, setConversations] = useState<User[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Poll for messages
    useEffect(() => {
        if (!currentUser) return // Wait for auth

        const fetchMessages = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            // Admin List
            if (currentUser.role === 'ADMIN' && !targetUser) {
                const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
                if (res.ok) {
                    const data = await res.json()
                    setConversations(data.conversations || [])
                }
                return
            }

            // Chat View
            let url = '/api/messages'
            if (targetUser) url += `?targetUserId=${targetUser.id}`

            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setMessages(data)
                    refreshUnread()
                }
            }
        }

        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [currentUser, targetUser])

    // Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!newMessage.trim()) return
        const token = localStorage.getItem('token')
        const body: any = { content: newMessage }
        if (targetUser) body.targetUserId = targetUser.id

        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
        })
        setNewMessage('')
        // Immediate fetch
        // ... handled by poll or we can duplicate logic. Poll is fine (3s).
    }

    if (!currentUser) return <div className="p-8 text-center">Cargando...</div>

    return (
        <div className="min-h-screen bg-[var(--bg-main)] pb-20 pt-4">
            <div className="max-w-md mx-auto h-[80vh] flex flex-col bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10 m-4">
                {/* Header */}
                <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-bold">Mensajes</h1>
                        {targetUser && <p className="text-xs text-indigo-200">Chat con {targetUser.name}</p>}
                    </div>
                    {targetUser && currentUser.role === 'ADMIN' && (
                        <button onClick={() => setTargetUser(null)} className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30">Volver</button>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-black/20">
                    {/* Admin List */}
                    {currentUser.role === 'ADMIN' && !targetUser ? (
                        <div className="space-y-2">
                            {conversations.length === 0 && <div className="text-center p-8 text-slate-400">No hay conversaciones activas.</div>}
                            {conversations.map(u => (
                                <button key={u.id} onClick={() => setTargetUser(u)} className="w-full text-left p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-indigo-500 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">{u.name.charAt(0)}</div>
                                    <div>
                                        <div className="font-bold">{u.name}</div>
                                        <div className="text-xs opacity-70">{u.role}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Chat Messages */
                        <div className="space-y-4">
                            {messages.length === 0 && <div className="text-center p-8 text-slate-400">No hay mensajes.</div>}
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.senderId === currentUser.id
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 rounded-bl-none'}`}>
                                        <p>{m.content}</p>
                                        <div className={`text-[10px] text-right mt-1 ${m.senderId === currentUser.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Footer Input */}
                {(currentUser.role !== 'ADMIN' || targetUser) && (
                    <div className="p-4 bg-[var(--bg-surface)] border-t border-slate-200 dark:border-white/10 flex gap-2 shrink-0">
                        <input
                            className="flex-1 bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Escribe un mensaje..."
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
