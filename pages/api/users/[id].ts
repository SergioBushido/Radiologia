import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { getUserFromReq, requireAdmin } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requester = await getUserFromReq(req)
  const { id } = req.query
  const userId = Number(id)

  if (req.method === 'GET') {
    if (!requester) return res.status(401).json({ error: 'Unauthorized' })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, group: true, monthlyLimit: true } })
    return res.json(user)
  }
  if (req.method === 'PUT') {
    if (!requester || !requireAdmin(requester)) return res.status(403).json({ error: 'Admin required' })
    const { name, email, password, role, group, monthlyLimit } = req.body
    const data: any = { name, email, role, group: group || null, monthlyLimit }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.update({ where: { id: userId }, data })
    return res.json(user)
  }
  if (req.method === 'DELETE') {
    if (!requester || !requireAdmin(requester)) return res.status(403).json({ error: 'Admin required' })
    await prisma.user.delete({ where: { id: userId } })
    return res.json({ ok: true })
  }
  res.status(405).end()
}
