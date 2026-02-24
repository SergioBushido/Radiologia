import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const result: any[] = await prisma.$queryRawUnsafe(`
            SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
        `)
        console.log('TABLES_LIST_START')
        result.forEach(row => console.log('TABLE:', row.table_name))
        console.log('TABLES_LIST_END')
    } catch (e) {
        console.error('ERROR:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
