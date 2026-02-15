import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const requester = await getUserFromReq(req)
  if(req.method === 'GET'){
    const { userId, month } = req.query
    if(!requester) return res.status(401).json({ error: 'Unauthorized' })
    // allow users to read their own blocks or admins to read any
    if(!userId) return res.status(400).json({ error: 'userId required' })
    if(Number(userId) !== requester.id && !requireAdmin(requester)) return res.status(403).json({ error: 'Forbidden' })
    const where: any = { userId: Number(userId) }
    if(month) where.month = String(month)
    const blocks = await prisma.block.findMany({ where })
    return res.json(blocks)
  }

  if(req.method === 'POST'){
    if(!requester) return res.status(401).json({ error: 'Unauthorized' })
    const { userId, date } = req.body
    if(!userId || !date) return res.status(400).json({ error: 'userId and date required' })
    // only allow creating for self or admin
    if(Number(userId) !== requester.id && !requireAdmin(requester)) return res.status(403).json({ error: 'Forbidden' })
    const month = date.slice(0,7)

    const existing = await prisma.block.findUnique({ where: { userId_month: { userId: Number(userId), month } } as any }).catch(()=>null)
    if(existing) return res.status(400).json({ error: 'User already has a block this month' })

    const shift = await prisma.shift.findUnique({ where: { date } }).catch(()=>null)
    if(shift && (shift.slot1UserId === Number(userId) || shift.slot2UserId === Number(userId))){
      return res.status(400).json({ error: 'User already assigned on this date' })
    }

    const block = await prisma.block.create({ data: { userId: Number(userId), month, date } })
    await prisma.auditLog.create({ data: { actorUserId: requester.id, action: 'CREATE_BLOCK', details: JSON.stringify(block) } })
    return res.json(block)
  }

  if(req.method === 'DELETE'){
    if(!requester) return res.status(401).json({ error: 'Unauthorized' })
    const { userId, month } = req.query
    if(!userId || !month) return res.status(400).json({ error: 'userId and month required' })
    if(Number(userId) !== requester.id && !requireAdmin(requester)) return res.status(403).json({ error: 'Forbidden' })
    const deleted = await prisma.block.deleteMany({ where: { userId: Number(userId), month: String(month) } })
    return res.json({ deleted })
  }

  res.status(405).end()
}
