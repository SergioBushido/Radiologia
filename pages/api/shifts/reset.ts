import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()

    const requester = await getUserFromReq(req)
    if (!requester || !requireAdmin(requester)) return res.status(403).json({ error: 'Admin required' })

    const { month } = req.body
    if (!month) return res.status(400).json({ error: 'month required (YYYY-MM)' })

    try {
        const deleted = await prisma.shift.deleteMany({
            where: {
                date: {
                    startsWith: month
                }
            }
        })

        return res.json({ ok: true, deletedCount: deleted.count })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
}
