import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: string; message: string; type?: 'success'|'error'|'info' }

const ToastContext = createContext<{ addToast: (m: string, t?: Toast['type']) => void } | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }){
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id:string)=>{
    setToasts(t => t.filter(x=>x.id!==id))
  },[])

  const addToast = useCallback((message:string, type:Toast['type']='info')=>{
    const id = String(Date.now())
    const t:Toast = { id, message, type }
    setToasts(s => [t, ...s])
    setTimeout(()=>remove(id), 4000)
  },[remove])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t=> (
          <div key={t.id} className={`px-4 py-3 rounded shadow text-white ${t.type==='success'? 'bg-green-600' : t.type==='error'? 'bg-red-600' : 'bg-slate-700'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider
