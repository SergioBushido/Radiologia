import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const host: any[] = await prisma.$queryRawUnsafe('SELECT inet_server_addr(), inet_server_port()')
        console.log('--- DB CONNECTION ---')
        console.log('IP:', host[0].inet_server_addr)
        console.log('Port:', host[0].inet_server_port)
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
