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
    const { date, startDate, endDate, userId, type } = req.body || {}
    const requesterIsAdmin = requireAdmin(requester)
    const targetUserId = userId ? Number(userId) : requester.id

    if (!requesterIsAdmin && targetUserId !== requester.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Determinar fechas a procesar
    let dates: string[] = []
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }
    } else if (date) {
      dates = [date]
    } else {
      return res.status(400).json({ error: 'date or (startDate and endDate) required' })
    }

    // Verificar si algún mes está bloqueado
    const months = Array.from(new Set(dates.map(d => d.substring(0, 7))))
    const blockedMonths = await prisma.monthConfig.findMany({
      where: { month: { in: months }, isBlocked: true }
    })

    if (!requireAdmin(requester) && blockedMonths.length > 0) {
      return res.status(403).json({ error: `Month ${blockedMonths[0].month} is blocked by admin` })
    }

    // Por simplicidad marcamos directamente como APPROVED
    // Usamos transaction para asegurar que se crean todas o ninguna
    const results = await prisma.$transaction(
      dates.map(d => {
        return prisma.vacation.upsert({
          where: { userId_date: { userId: targetUserId, date: d } },
          update: {
            status: 'APPROVED',
            type: type || 'VACATION'
          },
          create: {
            userId: targetUserId,
            date: d,
            status: 'APPROVED',
            type: type || 'VACATION'
          }
        })
      })
    )

    return res.json(results)
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


