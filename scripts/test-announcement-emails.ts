
import { prisma } from '../lib/prisma'

async function testAnnouncementEmails() {
    console.log('Testing announcement email trigger logic...')

    // 1. Fetch users (excluding dummy)
    const allUsers = await prisma.user.findMany({
        where: {
            id: { not: 0 }
        },
        select: { email: true, name: true }
    })

    console.log(`Found ${allUsers.length} users for notification.`)
    allUsers.forEach(u => console.log(`- ${u.name} (${u.email})`))

    if (allUsers.length === 0) {
        console.warn('WARNING: No users found (besides dummy).')
    }

    // 2. Check environment variable
    const webhookUrl = process.env.MAKE_ANNOUNCEMENT_WEBHOOK_URL
    if (webhookUrl) {
        console.log(`Webhook URL is configured: ${webhookUrl}`)
    } else {
        console.log('NOTICE: MAKE_ANNOUNCEMENT_WEBHOOK_URL is NOT set.')
    }

    console.log('\nVerification of database query completed.')
}

testAnnouncementEmails()
    .catch(e => {
        console.error('Test failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
