import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import ConfirmModal from './ConfirmModal'

type ConfirmOptions = {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'info'
}

type ConfirmContextType = {
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<(ConfirmOptions & { resolve: (val: boolean) => void }) | null>(null)

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setModal({ ...options, resolve })
        })
    }, [])

    const handleConfirm = () => {
        modal?.resolve(true)
        setModal(null)
    }

    const handleCancel = () => {
        modal?.resolve(false)
        setModal(null)
    }

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {modal && (
                <ConfirmModal
                    isOpen={true}
                    title={modal.title}
                    message={modal.message}
                    confirmText={modal.confirmText}
                    cancelText={modal.cancelText}
                    type={modal.type}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const context = useContext(ConfirmContext)
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider')
    }
    return context
}
