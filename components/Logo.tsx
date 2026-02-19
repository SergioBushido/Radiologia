import React from 'react'
import { useMessages } from '../lib/MessageContext'

export default function Logo({ className = "w-12 h-12", textVisible = true }) {
    const { unreadCount } = useMessages()
    return (
        <div className="flex items-center gap-3 w-max">
            {/* Ionizing Radiation Symbol (Trefoil) with a modern touch */}
            <div className={`${className} relative`}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.5" className="opacity-20" />
                    <path
                        d="M12 12L8.5 6H15.5L12 12Z"
                        fill="currentColor"
                        className="text-medical-500"
                    />
                    <path
                        d="M12 12L18.5 15.5L15 21.5L12 12Z"
                        fill="currentColor"
                        className="text-medical-500"
                    />
                    <path
                        d="M12 12L5.5 15.5L9 21.5L12 12Z"
                        fill="currentColor"
                        className="text-medical-500"
                    />
                    <circle cx="12" cy="12" r="2.5" fill="var(--bg-main)" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-medical-600" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg ring-2 ring-white dark:ring-slate-900 animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </div>
            {textVisible && (
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Aplicación de guardias y servicios
                </span>
            )}
        </div>
    )
}
