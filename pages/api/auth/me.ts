import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const auth = req.headers.authorization?.split(' ')[1]
  if(!auth) return res.status(401).json({ error: 'No token' })
  const data: any = verifyToken(auth)
  if(!data) return res.status(401).json({ error: 'Invalid token' })
  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  if(!user) return res.status(404).json({ error: 'User not found' })
  const { passwordHash, ...rest } = (user as any)
  res.json(rest)
}
