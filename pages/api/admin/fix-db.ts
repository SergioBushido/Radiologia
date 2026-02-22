
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

    // 2. Diagnostics
    const tables: any = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `);

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true }
    });

    return res.json({
      success: true,
      message: 'SQL check completed',
      tables: tables.map((t: any) => t.tablename),
      availableAdmins: admins,
      currentUserId: user?.id
    })
  } catch (error: any) {
    console.error('SQL FIX ERROR:', error)
    return res.status(500).json({ error: error.message })
  }
}
