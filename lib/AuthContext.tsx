import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'

interface AuthContextType {
    user: any
    loading: boolean
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const refreshUser = async () => {
        const t = localStorage.getItem('token')
        if (!t) {
            setUser(null)
            setLoading(false)
            return
        }

        try {
            const r = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${t}` }
            })
            if (r.ok) {
                setUser(await r.json())
            } else {
                localStorage.removeItem('token')
                setUser(null)
            }
        } catch (e) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
