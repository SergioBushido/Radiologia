
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Changing admin user...');

    try {
        // 1. Promote Linares to ADMIN
        const linares = await prisma.user.update({
            where: { email: 'cristinaclb1812@gmail.com' },
            data: { role: 'ADMIN' }
        });
        console.log(`Promoted to ADMIN: ${linares.name} (${linares.email})`);

        // 2. Remove previous admin
        const deletedAdmin = await prisma.user.delete({
            where: { email: 'admin@youshift.local' }
        });
        console.log(`Deleted old admin: ${deletedAdmin.email}`);

        console.log('Admin change completed successfully.');
    } catch (error) {
        console.error('Error during admin change:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
