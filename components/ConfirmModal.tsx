import React from 'react'

type Props = {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
    type?: 'danger' | 'info'
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'info'
}: Props) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className={`p-6 pb-4 ${type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-medical-600 dark:text-medical-400'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${type === 'danger' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-medical-50 dark:bg-medical-900/20'}`}>
                            {type === 'danger' ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-xl font-black leading-tight tracking-tight">{title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
                        {message}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                : 'bg-medical-600 hover:bg-medical-500 shadow-medical-500/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
