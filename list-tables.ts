import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Listing tables in public schema...')
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `
        console.log('Tables found:', JSON.stringify(tables, null, 2))
    } catch (e) {
        console.error('Error listing tables:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
