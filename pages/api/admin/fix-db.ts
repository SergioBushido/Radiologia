import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// TEMPORARY maintenance endpoint - no auth required for DB repair
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Running DB repair...')

    // 1. Create GenerationReport table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GenerationReport" (
        "id" SERIAL NOT NULL,
        "month" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "userId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GenerationReport_pkey" PRIMARY KEY ("id")
      );
    `)

    // 2. Verify tables
    const tables: any = await prisma.$queryRawUnsafe(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )

    // 3. Get admins for diagnosis
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    })

    return res.json({
      success: true,
      message: 'Tabla GenerationReport creada o ya existía',
      tables: tables.map((t: any) => t.tablename),
      admins
    })
  } catch (error: any) {
    console.error('FIX-DB ERROR:', error)
    return res.status(500).json({ error: error.message })
  }
}
