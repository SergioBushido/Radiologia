import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('--- DATABASE DIAGNOSIS ---')
        const version: any[] = await prisma.$queryRawUnsafe('SELECT version()')
        console.log('Postgres Version:', version[0].version)

        const dbname: any[] = await prisma.$queryRawUnsafe('SELECT current_database()')
        console.log('Current DB:', dbname[0].current_database)

        const schema: any[] = await prisma.$queryRawUnsafe('SELECT current_schema()')
        console.log('Current Schema:', schema[0].current_schema)

        console.log('Creating MonthConfig table manually...')
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "MonthConfig" (
                "month" TEXT NOT NULL,
                "isBlocked" BOOLEAN NOT NULL DEFAULT false,
                CONSTRAINT "MonthConfig_pkey" PRIMARY KEY ("month")
            )
        `)
        console.log('SUCCESS: MonthConfig table created or already exists.')

        const tables: any[] = await prisma.$queryRawUnsafe(`
            SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MonthConfig'
        `)
        console.log('Verification check - Table exists in information_schema:', tables.length > 0 ? 'YES' : 'NO')

    } catch (e) {
        console.error('Error during execution:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
