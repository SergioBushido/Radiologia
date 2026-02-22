import type { NextApiRequest, NextApiResponse } from 'next'
import { validateCredentials, signToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Login endpoint active. Please use POST.' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const user = await validateCredentials(email, password)
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = signToken({ userId: user.id, role: user.role })
    return res.json({ token, user })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
