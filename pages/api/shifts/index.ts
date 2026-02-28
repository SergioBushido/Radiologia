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

    // Ensure Dummy user exists
    if (slot1UserId === 0 || slot2UserId === 0) {
      await prisma.user.upsert({
        where: { email: 'dummy@sigeo.local' },
        create: { id: 0, name: 'Libre / Pendiente', email: 'dummy@sigeo.local', passwordHash: '', role: 'SYSTEM', monthlyLimit: 0 },
        update: {}
      }).catch(() => { })
    }

    const dayErrors = []
    if (slot1UserId !== 0 && slot2UserId !== 0) {
      dayErrors.push(...(await validateDay(slot1UserId, slot2UserId, date)))
    }
    const a1 = slot1UserId !== 0 ? await validateAssignment(slot1UserId, date, month) : []
    const a2 = slot2UserId !== 0 ? await validateAssignment(slot2UserId, date, month) : []
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

  if (req.method === 'DELETE') {
    const { date, actorUserId } = req.body

    const existing = await prisma.shift.findUnique({ where: { date } })
    if (!existing) {
      return res.status(404).json({ error: 'Guardia no encontrada' })
    }

    await prisma.shift.delete({ where: { date } })

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || 0,
        action: 'DELETE_SHIFT',
        details: JSON.stringify({ date })
      }
    })

    return res.json({ success: true })
  }

  res.status(405).end()
}
