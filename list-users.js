
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        shiftsSlot1: true,
                        shiftsSlot2: true,
                        blocks: true,
                        preferences: true,
                        vacations: true,
                        messagesSent: true,
                        messagesReceived: true,
                        boardPosts: true,
                    }
                }
            }
        });

        console.log('Current Users:');
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
            console.log(`  Counts:`, u._count);
        });

        if (users.length === 0) {
            console.log('No users found.');
        }
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
