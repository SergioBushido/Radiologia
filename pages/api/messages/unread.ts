
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const count = await prisma.message.count({
        where: {
            isRead: false
        }
    })

    return res.json({ count })
}
