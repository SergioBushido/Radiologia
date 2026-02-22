
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Setting user limits...');

    try {
        // Nieto: 2 guardias
        const nieto = await prisma.user.update({
            where: { email: 'luisaradazul@yahoo.es' },
            data: { monthlyLimit: 2 }
        });
        console.log(`Updated Nieto limit: ${nieto.monthlyLimit}`);

        // Muñoz: 1 guardia
        const munoz = await prisma.user.update({
            where: { email: 'ameliamun@gmail.com' },
            data: { monthlyLimit: 1 }
        });
        console.log(`Updated Muñoz limit: ${munoz.monthlyLimit}`);

        console.log('User limits updated successfully.');
    } catch (error) {
        console.error('Error updating user limits:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
