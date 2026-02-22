
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req)
    if (!requireAdmin(user)) return res.status(401).json({ error: 'Unauthorized' })

    try {
        console.log('Attempting to create GenerationReport table via SQL...')

        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GenerationReport" (
        "id" SERIAL NOT NULL,
        "month" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "userId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GenerationReport_pkey" PRIMARY KEY ("id")
      );
    `);

        // Check if table exists now
        const check = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'GenerationReport'
    `);

        return res.json({
            success: true,
            message: 'SQL executed',
            tableCheck: check
        })
    } catch (error: any) {
        console.error('SQL FIX ERROR:', error)
        return res.status(500).json({ error: error.message })
    }
}
