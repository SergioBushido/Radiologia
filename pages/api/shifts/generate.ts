import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { generateSchedule } from '../../../lib/shiftGenerator'
import { getUserFromReq } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { month } = req.body
  if (!month) return res.status(400).json({ error: 'month required (YYYY-MM)' })

  try {
    const user = await getUserFromReq(req)
    let executorId = user?.id

    // If no user from token, try to find the first admin in DB
    if (!executorId) {
      const firstAdmin = await (prisma as any).user.findFirst({ where: { role: 'ADMIN' } })
      executorId = firstAdmin?.id || 1
    }

    const solution = await generateSchedule(month)

    if (!solution) {
      return res.status(422).json({ error: 'No se pudo encontrar una asignación válida que cumpla todas las restricciones.' })
    }

    console.log(`Saving shifts for ${month}. Executor: ${executorId}`)

    // Save solution to DB
    for (const s of solution) {
      await prisma.shift.upsert({
        where: { date: s.date },
        update: { slot1UserId: s.slot1UserId, slot2UserId: s.slot2UserId },
        create: { date: s.date, slot1UserId: s.slot1UserId, slot2UserId: s.slot2UserId }
      })
    }

    // PERSIST REPORT (Don't let this crash the whole generation)
    let reportId = null
    try {
      const report = await (prisma as any).generationReport.create({
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
      reportId = report.id
      console.log('Report persisted successfully:', reportId)
    } catch (reportErr: any) {
      console.error('FAILED TO PERSIST REPORT:', reportErr.message)
      // We still have the shifts saved, so we continue
    }

    return res.json({ ok: true, createdCount: solution.length, shifts: solution, reportId })
  } catch (err: any) {
    console.error('GENERATION API ERROR:', err)
    return res.status(500).json({ error: err.message })
  }
}
