const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main(){
  const email = process.env.ADMIN_EMAIL || 'admin@youshift.local'
  const password = process.env.ADMIN_PASSWORD || 'Password123!'

  const pwdHash = await bcrypt.hash(password, 10)

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: pwdHash, role: 'ADMIN', name: 'Admin' },
    create: {
      name: 'Admin',
      email,
      passwordHash: pwdHash,
      role: 'ADMIN'
    }
  })

  console.log('Admin upserted:', email)
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=> prisma.$disconnect())
