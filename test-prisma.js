
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Prisma models available:');
    console.log(Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key] === 'object' && prisma[key] !== null));

    try {
        const postCount = await prisma.boardPost.count();
        console.log('BoardPost count:', postCount);
    } catch (e) {
        console.log('Error accessing boardPost:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
