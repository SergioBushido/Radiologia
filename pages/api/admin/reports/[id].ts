import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req)
    if (!requireAdmin(user)) return res.status(401).json({ error: 'Unauthorized' })

    const { id } = req.query

    if (req.method === 'GET') {
        try {
            const report = await (prisma as any).generationReport.findUnique({
                where: { id: Number(id) },
                include: {
                    createdBy: {
                        select: { name: true }
                    }
                }
            })
            if (!report) return res.status(404).json({ error: 'Report not found' })
            return res.json(report)
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }

    res.status(405).end()
}
