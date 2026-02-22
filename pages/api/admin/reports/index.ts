import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req)
    if (!requireAdmin(user)) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
        try {
            const reports = await (prisma as any).generationReport.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: { name: true }
                    }
                }
            })
            return res.json(reports)
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }

    res.status(405).end()
}
