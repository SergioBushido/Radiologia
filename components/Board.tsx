import { useEffect, useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../lib/useAuth'
import { useToast } from './ToastProvider'

type BoardPost = {
  id: number
  userId: number
  content: string
  parentId: number | null
  createdAt: string
  user: {
    id: number
    name: string
    role: string
  }
  replies?: BoardPost[]
}

export default function Board() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
    // Poll cada 5 segundos para actualizar mensajes
    const interval = setInterval(fetchPosts, 5000)
    return () => clearInterval(interval)
  }, [])


  async function fetchPosts() {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/board', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setPosts(data)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    setLoading(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/board', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: newMessage })
    })
    setLoading(false)
    if (res.ok) {
      setNewMessage('')
      addToast('Mensaje enviado', 'success')
      fetchPosts()
    } else {
      const err = await res.json()
      addToast(err.error || 'Error al enviar', 'error')
    }
  }

  async function sendReply(parentId: number) {
    if (!replyContent.trim()) return
    setLoading(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/board', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: replyContent, parentId })
    })
    setLoading(false)
    if (res.ok) {
      setReplyContent('')
      setReplyingTo(null)
      addToast('Respuesta enviada', 'success')
      fetchPosts()
    } else {
      const err = await res.json()
      addToast(err.error || 'Error al responder', 'error')
    }
  }

  async function deletePost(id: number) {
    if (!confirm('¿Eliminar este mensaje?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/board?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      addToast('Mensaje eliminado', 'success')
      fetchPosts()
    } else {
      addToast('Error al eliminar', 'error')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-medical-600 via-medical-700 to-teal-700 p-4 sm:p-5 md:p-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-medical-600/50 to-teal-600/50 opacity-50"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-medical-100">Tablón de Anuncios</span>
            </h2>
            <p className="text-xs sm:text-sm text-medical-100/90 font-medium">Comparte información y comunícate con el equipo</p>
          </div>
        </div>

        {/* Messages List */}
        <div className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 custom-scrollbar bg-gradient-to-b from-white/50 to-transparent dark:from-slate-900/30 dark:to-transparent">
          {posts.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-medical-100 dark:bg-medical-900/30 mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-medical-500 dark:text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">No hay mensajes aún</p>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-1">¡Sé el primero en escribir!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="group bg-white dark:bg-slate-800/60 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-white/10 p-3 sm:p-4 md:p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:border-medical-400 dark:hover:border-medical-500/30 hover:-translate-y-0.5">
                {/* Main Post */}
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3">
                      <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-md transition-transform duration-300 group-hover:scale-110 ${post.user.role === 'ADMIN'
                        ? 'bg-gradient-to-br from-medical-500 to-teal-600 text-white ring-2 ring-medical-300/50 dark:ring-medical-500/30'
                        : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
                        }`}>
                        {post.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                            {post.user.name}
                          </span>
                          {post.user.role === 'ADMIN' && (
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md uppercase tracking-wide shadow-sm">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{format(parseISO(post.createdAt), "dd MMM yyyy 'a las' HH:mm", { locale: es })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pl-0 sm:pl-12">
                      <p className="text-sm sm:text-base text-black dark:text-slate-200 font-medium leading-relaxed break-words whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>
                  </div>
                  {(post.userId === user?.id || user?.role === 'ADMIN') && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="flex-shrink-0 p-1.5 sm:p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90"
                      title="Eliminar mensaje"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="mt-4 sm:mt-5 ml-2 sm:ml-4 pl-3 sm:pl-5 border-l-2 border-medical-200/60 dark:border-medical-500/40 space-y-3 sm:space-y-4">
                    {post.replies.map(reply => (
                      <div key={reply.id} className="flex items-start justify-between gap-2 sm:gap-3 group/reply">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 sm:gap-2.5 mb-2">
                            <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm transition-transform duration-200 group-hover/reply:scale-105 ${reply.user.role === 'ADMIN'
                              ? 'bg-gradient-to-br from-medical-500 to-teal-600 text-white ring-1 ring-medical-300/50 dark:ring-medical-500/30'
                              : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'
                              }`}>
                              {reply.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-xs sm:text-sm text-black dark:text-slate-100 truncate">
                                  {reply.user.name}
                                </span>
                                {reply.user.role === 'ADMIN' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold bg-gradient-to-r from-medical-500 to-teal-600 text-white rounded uppercase tracking-wide">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{format(parseISO(reply.createdAt), "dd MMM 'a las' HH:mm", { locale: es })}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-300 font-medium leading-relaxed break-words whitespace-pre-wrap pl-0 sm:pl-9">
                            {reply.content}
                          </p>
                        </div>
                        {(reply.userId === user?.id || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => deletePost(reply.id)}
                            className="flex-shrink-0 p-1 sm:p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 opacity-0 group-hover/reply:opacity-100"
                            title="Eliminar respuesta"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === post.id ? (
                  <div className="mt-4 sm:mt-5 ml-2 sm:ml-4 pl-3 sm:pl-5 border-l-2 border-medical-300 dark:border-medical-500/50 bg-medical-50/50 dark:bg-medical-900/10 rounded-r-lg p-3 sm:p-4">
                    <textarea
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 dark:focus:border-medical-400 outline-none resize-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      rows={3}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          sendReply(post.id)
                        }
                      }}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <button
                        onClick={() => sendReply(post.id)}
                        disabled={loading || !replyContent.trim()}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-medical-600 to-teal-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:from-medical-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Responder
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 active:scale-95"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(post.id)}
                    className="mt-3 sm:mt-4 text-xs sm:text-sm text-medical-600 dark:text-medical-400 hover:text-medical-700 dark:hover:text-medical-300 font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 hover:gap-3 group"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Responder
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* New Message Input */}
        <div className="border-t border-slate-200/60 dark:border-white/10 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-md ring-2 ring-white dark:ring-slate-800 ${user?.role === 'ADMIN'
              ? 'bg-gradient-to-br from-medical-500 to-teal-600 text-white'
              : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 block truncate">{user?.name}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Escribe un mensaje público</span>
            </div>
          </div>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje para el tablón..."
            className="w-full p-3 sm:p-4 text-sm sm:text-base bg-white dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-medical-500 focus:border-medical-500 dark:focus:border-medical-400 outline-none resize-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:shadow-md"
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) {
                sendMessage()
              }
            }}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mt-3 sm:mt-4">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ctrl + Enter para enviar
            </span>
            <button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim()}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-medical-600 via-medical-700 to-teal-600 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl hover:from-medical-500 hover:via-medical-600 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Enviar mensaje</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

