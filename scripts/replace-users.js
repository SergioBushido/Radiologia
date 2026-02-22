
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const NEW_USERS = [
    { name: 'Llanos', email: 'jmllagom@gmail.com' },
    { name: 'Nieto', email: 'luisaradazul@yahoo.es' },
    { name: 'De armas', email: 'rdearmas83@gmail.com' },
    { name: 'Serra', email: 'Gab_9993@hotmail.com' },
    { name: 'Fdez del Castillo', email: 'esp272@gmail.com' },
    { name: 'Vázquez', email: 'victor.rxtf@gmail.com' },
    { name: 'Paz', email: 'spazmaya@gmail.com' },
    { name: 'Muñoz', email: 'ameliamun@gmail.com' },
    { name: 'Núñez', email: 'ninvil@hotmail.com' },
    { name: 'Souweileh', email: 'carla.sarencibia@gmail.com' },
    { name: 'Linares', email: 'cristinaclb1812@gmail.com' },
    { name: 'Marichal', email: 'cmarichalhdez@hotmail.com' },
    { name: 'Benítez', email: 'soniabenitez@yahoo.com' },
    { name: 'Cabrera', email: 'laura_cabreraromero@yahoo.es' },
    { name: 'Chueca', email: 'danielchuecamartinez@gmail.com' },
    { name: 'Alventosa', email: 'elena.alventosa@gmail.com' },
    { name: 'Monteverde', email: 'f.monteverde.hdez@gmail.com' },
];

const MAMA = ['Muñoz', 'Cabrera', 'De armas'];
const URGENCIAS = ['Marichal', 'Fdez del Castillo', 'Núñez'];

async function main() {
    console.log('Starting user replacement process...');

    try {
        // 1. Clear tables that have foreign keys to User
        console.log('Clearing dependent tables...');
        await prisma.boardPost.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.vacation.deleteMany({});
        await prisma.shiftPreference.deleteMany({});
        await prisma.block.deleteMany({});
        await prisma.shift.deleteMany({});
        await prisma.auditLog.deleteMany({});

        // 2. Delete all users except admin
        console.log('Deleting existing users (except admin)...');
        await prisma.user.deleteMany({
            where: {
                NOT: {
                    email: 'admin@youshift.local'
                }
            }
        });

        // 3. Create or Update admin if it doesn't exist (safety)
        const adminPwd = await bcrypt.hash('Password123!', 10);
        await prisma.user.upsert({
            where: { email: 'admin@youshift.local' },
            update: {},
            create: {
                name: 'Admin',
                email: 'admin@youshift.local',
                passwordHash: adminPwd,
                role: 'ADMIN'
            }
        });

        // 4. Insert new users
        console.log('Inserting new users...');
        const defaultPwd = await bcrypt.hash('Password123!', 10);

        for (const u of NEW_USERS) {
            let group = null;
            if (MAMA.includes(u.name)) group = 'MAMA';
            if (URGENCIAS.includes(u.name)) group = 'URGENCIAS';

            await prisma.user.create({
                data: {
                    name: u.name,
                    email: u.email,
                    passwordHash: defaultPwd,
                    role: 'USER',
                    group: group
                }
            });
            console.log(`Created user: ${u.name} (${u.email}) ${group ? `[Group: ${group}]` : ''}`);
        }

        console.log('User replacement process completed successfully.');
    } catch (error) {
        console.error('Error during replacement:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
