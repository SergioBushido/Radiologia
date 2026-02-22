import React from 'react'
import { useMessages } from '../lib/MessageContext'

export default function Logo({ className = "w-12 h-12", textVisible = true }) {
    const { unreadCount } = useMessages()
    return (
        <div className="flex items-center gap-3 w-max">
            {/* Umbrella Corp Logo Implementation */}
            <div className={`${className} relative`}>
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                >
                    {/* Background Octagon (Shadow/Stroke) */}
                    <path
                        d="M50 0L85.35 14.65L100 50L85.35 85.35L50 100L14.65 85.35L0 50L14.65 14.65L50 0Z"
                        fill="black"
                        className="opacity-10"
                    />

                    {/* Umbrella Segments */}
                    {/* White Segments */}
                    <path d="M50 50 L50 0 L14.65 14.65 Z" fill="white" />
                    <path d="M50 50 L100 50 L85.35 14.65 Z" fill="white" />
                    <path d="M50 50 L50 100 L85.35 85.35 Z" fill="white" />
                    <path d="M50 50 L0 50 L14.65 85.35 Z" fill="white" />

                    {/* Red Segments */}
                    <path d="M50 50 L14.65 14.65 L0 50 Z" fill="#DC2626" />
                    <path d="M50 50 L85.35 14.65 L50 0 Z" fill="#DC2626" />
                    <path d="M50 50 L85.35 85.35 L100 50 Z" fill="#DC2626" />
                    <path d="M50 50 L14.65 85.35 L50 100 Z" fill="#DC2626" />

                    {/* Outer Edge Polish */}
                    <path
                        d="M50 0L85.35 14.65L100 50L85.35 85.35L50 100L14.65 85.35L0 50L14.65 14.65Z"
                        stroke="black"
                        strokeWidth="1"
                        className="opacity-20"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg ring-2 ring-white dark:ring-slate-900 animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </div>
            {textVisible && (
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                    Umbrella Corporation
                </span>
            )}
        </div>
    )
}
