const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Testing announcement email query...')
  
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: 0 }
    },
    select: { email: true, name: true }
  })

  console.log(`Found ${allUsers.length} users:`)
  allUsers.forEach(u => console.log(`- ${u.name}: ${u.email}`))
  
  const webhookUrl = process.env.MAKE_ANNOUNCEMENT_WEBHOOK_URL
  if (webhookUrl) {
    console.log('Webhook URL is set.')
  } else {
    console.log('Webhook URL is NOT set (expected if not in .env).')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
