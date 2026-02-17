
import { generateSchedule } from '../lib/shiftGenerator';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Testing Shift Generation...');
    const month = '2026-05'; // Future month to avoid conflicts

    // Clean up previous test data if needed?
    // Ideally use a test db, but for now we just try to generate.

    try {
        const schedule = await generateSchedule(month);
        console.log('Schedule generated:', schedule ? schedule.length : 'null');
        if (schedule && schedule.length > 0) {
            console.log('First 5 shifts:', schedule.slice(0, 5));
        } else {
            console.log('No schedule generated (null or empty)');
        }
    } catch (error) {
        console.error('Error generating schedule:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
