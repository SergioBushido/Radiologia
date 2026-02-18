import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requester = await getUserFromReq(req)

  if (!requester) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const { month, userId } = req.query
    const isAdmin = requireAdmin(requester)
    const targetUserId = userId ? Number(userId) : (isAdmin ? undefined : requester.id)

    if (!isAdmin && targetUserId !== requester.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const where: any = {}
    if (targetUserId !== undefined) {
      where.userId = targetUserId
    }
    if (month) where.date = { startsWith: String(month) }

    const vacations = await prisma.vacation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    return res.json(vacations)
  }

  if (req.method === 'POST') {
    const { date, userId } = req.body || {}
    if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' })

    const targetUserId = userId ? Number(userId) : requester.id
    if (!requireAdmin(requester) && targetUserId !== requester.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Evitar duplicados
    const existing = await prisma.vacation.findFirst({
      where: { userId: targetUserId, date }
    })
    if (existing) {
      return res.status(400).json({ error: 'Vacation already exists for this date' })
    }

    // No permitir vacaciones en un día donde ya tenga guardia
    const shift = await prisma.shift.findFirst({
      where: {
        date,
        OR: [{ slot1UserId: targetUserId }, { slot2UserId: targetUserId }]
      }
    })
    if (shift) {
      return res.status(400).json({ error: 'User already has a shift on this date' })
    }

    // Por simplicidad marcamos directamente como APPROVED
    const vacation = await prisma.vacation.create({
      data: {
        userId: targetUserId,
        date,
        status: 'APPROVED'
      } as any
    })

    return res.json(vacation)
  }

  if (req.method === 'DELETE') {
    const { date, userId } = req.query
    if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' })

    const targetUserId = userId ? Number(userId) : requester.id
    if (!requireAdmin(requester) && targetUserId !== requester.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const deleted = await prisma.vacation.deleteMany({
      where: { userId: targetUserId, date: String(date) }
    })

    return res.json({ deleted })
  }

  res.status(405).end()
}


