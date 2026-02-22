
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection...');
        await prisma.$connect();
        console.log('Connected!');

        const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
        console.log('Public tables:', JSON.stringify(tables, null, 2));

        // Check if table exists specifically
        const reportTable = await prisma.$queryRaw`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'GenerationReport')`;
        console.log('GenerationReport table exists:', JSON.stringify(reportTable, null, 2));

    } catch (e) {
        console.error('DATABASE ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
