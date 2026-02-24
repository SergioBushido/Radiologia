import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const requester = await getUserFromReq(req)

    if (req.method === 'GET') {
        const configs = await prisma.monthConfig.findMany()
        return res.json(configs)
    }

    if (req.method === 'POST') {
        if (!requester || !requireAdmin(requester)) {
            return res.status(403).json({ error: 'Admin required' })
        }

        const { month, isBlocked } = req.body
        if (!month) return res.status(400).json({ error: 'month (YYYY-MM) required' })

        const config = await prisma.monthConfig.upsert({
            where: { month },
            update: { isBlocked: !!isBlocked },
            create: { month, isBlocked: !!isBlocked }
        })

        return res.json(config)
    }

    res.status(405).end()
}
