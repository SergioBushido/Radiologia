import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) { setLoading(false); return }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } }).then(async r => {
      if (r.ok) { setUser(await r.json()) } else { setUser(null) }
      setLoading(false)
    }).catch(() => { setUser(null); setLoading(false) })
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return { user, loading, logout }
}

export default useAuth
