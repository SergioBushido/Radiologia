
const { PrismaClient } = require('@prisma/client');

async function main() {
    const url = "postgresql://postgres:Tuputisimamadre.8@db.uqcqmwkrmcqxdkmyfcbk.supabase.co:5432/postgres";
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
    });

    try {
        console.log('Checking User table columns using direct URL...');
        const columns = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'User' 
            AND table_schema = 'public'
        `;
        console.log('Columns in User table:', JSON.stringify(columns, null, 2));

        const hasAvatarUrl = columns.some(c => c.column_name === 'avatarUrl');
        console.log('Column "avatarUrl" exists:', hasAvatarUrl);

    } catch (e) {
        console.error('DATABASE ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
