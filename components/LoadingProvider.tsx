import React, { createContext, useContext, useState } from 'react'

const LoadingContext = createContext<{ setLoading: (v:boolean)=>void, loading: boolean } | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }){
  const [loading, setLoading] = useState(false)
  return (
    <LoadingContext.Provider value={{ setLoading, loading }}>
      {children}
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center">
            <svg className="animate-spin w-10 h-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading(){
  const ctx = useContext(LoadingContext)
  if(!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}

export default LoadingProvider
