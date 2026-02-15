import React from 'react'

export default function Logo({ className = "w-12 h-12", textVisible = true }) {
    return (
        <div className="flex items-center gap-3 w-max">
            {/* Ionizing Radiation Symbol (Trefoil) with a modern touch */}
            <div className={className}>
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
                        className="text-indigo-500"
                    />
                    <path
                        d="M12 12L18.5 15.5L15 21.5L12 12Z"
                        fill="currentColor"
                        className="text-indigo-500"
                    />
                    <path
                        d="M12 12L5.5 15.5L9 21.5L12 12Z"
                        fill="currentColor"
                        className="text-indigo-500"
                    />
                    <circle cx="12" cy="12" r="2.5" fill="var(--bg-main, #0a0e14)" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-indigo-400" />
                </svg>
            </div>
            {textVisible && (
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Aplicación de guardias y servicios
                </span>
            )}
        </div>
    )
}
