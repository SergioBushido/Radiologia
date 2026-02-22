import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { generateSchedule } from '../../../lib/shiftGenerator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { month } = req.body
  if (!month) return res.status(400).json({ error: 'month required (YYYY-MM)' })

  try {
    const solution = await generateSchedule(month)

    if (!solution) {
      return res.status(422).json({ error: 'No se pudo encontrar una asignación válida que cumpla todas las restricciones.' })
    }

    // Capture executor from token (if possible) for the report
    const auth = req.headers.authorization?.split(' ')[1]
    let executorId = 0
    if (auth) {
      const { verifyToken } = require('../../../lib/auth')
      const decoded = verifyToken(auth)
      if (decoded) executorId = decoded.userId
    }

    // Save solution to DB
    for (const s of solution) {
      await prisma.shift.upsert({
        where: { date: s.date },
        update: { slot1UserId: s.slot1UserId, slot2UserId: s.slot2UserId },
        create: { date: s.date, slot1UserId: s.slot1UserId, slot2UserId: s.slot2UserId }
      })
    }

    // PERSIST REPORT
    const report = await prisma.generationReport.create({
      data: {
        month,
        userId: executorId,
        data: {
          month,
          shifts: solution,
          generatedAt: new Date().toISOString(),
          executorId
        }
      }
    })

    return res.json({ ok: true, createdCount: solution.length, shifts: solution, reportId: report.id })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
