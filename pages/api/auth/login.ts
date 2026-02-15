import type { NextApiRequest, NextApiResponse } from 'next'
import { validateCredentials, signToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  const user = await validateCredentials(email, password)
  if(!user) return res.status(401).json({ error: 'Invalid credentials' })
  const token = signToken({ userId: user.id, role: user.role })
  res.json({ token, user })
}
