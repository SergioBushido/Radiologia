import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('--- ENV CHECK ---')
        const dburl = process.env.DATABASE_URL || 'NOT SET'
        // Redact password
        console.log('DATABASE_URL:', dburl.replace(/:[^@:]+@/, ':****@'))

        console.log('Testing findMany on monthConfig...')
        const config = await prisma.monthConfig.findMany()
        console.log('FETCH SUCCESS, COUNT:', config.length)
    } catch (e: any) {
        console.error('FETCH FAILED:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
