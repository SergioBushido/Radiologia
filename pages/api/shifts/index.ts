import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { validateDay, validateAssignment } from '../../../lib/rules'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { month } = req.query
    const shifts = await prisma.shift.findMany({ where: month ? { date: { startsWith: String(month) } } : {} })
    return res.json({ shifts })
  }

  if (req.method === 'POST') {
    const { date, slot1UserId, slot2UserId, actorUserId, forced, forcedReason } = req.body
    const month = date.slice(0, 7)

    const dayErrors = await validateDay(slot1UserId, slot2UserId, date)
    const a1 = await validateAssignment(slot1UserId, date, month)
    const a2 = await validateAssignment(slot2UserId, date, month)
    const errors = [...dayErrors, ...a1, ...a2]

    if (errors.length && !forced) {
      return res.status(400).json({ errors })
    }

    // Upsert shift
    const existing = await prisma.shift.findUnique({ where: { date } }).catch(() => null)
    let shift
    if (existing) {
      shift = await prisma.shift.update({ where: { date }, data: { slot1UserId, slot2UserId, forced: !!forced, forcedReason } })
    } else {
      shift = await prisma.shift.create({ data: { date, slot1UserId, slot2UserId, forced: !!forced, forcedReason } })
    }

    await prisma.auditLog.create({ data: { actorUserId: actorUserId || 0, action: 'ASSIGN_SHIFT', details: JSON.stringify({ date, slot1UserId, slot2UserId, forced, forcedReason }) } })

    return res.json({ shift, conflicts: errors })
  }

  res.status(405).end()
}
