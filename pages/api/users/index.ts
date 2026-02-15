import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { getUserFromReq, requireAdmin } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requester = await getUserFromReq(req)
  if (req.method === 'GET') {
    if (!requester) return res.status(401).json({ error: 'Unauthorized' })
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, group: true } })
    return res.json(users)
  }
  if (req.method === 'POST') {
    if (!requester || !requireAdmin(requester)) return res.status(403).json({ error: 'Admin required' })
    const { name, email, password, role, group } = req.body
    const passwordHash = await bcrypt.hash(password || 'Password123!', 10)
    const user = await prisma.user.create({ data: { name, email, passwordHash, role, group: group || null } })
    return res.json(user)
  }
  res.status(405).end()
}
