const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main(){
  const users = [
    'Muñoz','Marichal','Linares','Chueca','Alventosa','Serra','Llanos','Monteverde','Cabrera','Nieto','Caicoya','Fdez del Castillo','Núñez','Benítez','Vázquez','Paz','Souweileh','De Armas','Luisa','Amelia'
  ]

  const pwd = await bcrypt.hash('Password123!', 10)

  for(const name of users){
    const email = `${name.split(' ')[0].toLowerCase().replace(/[^a-z]/g,'')}@youshift.local`
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash: pwd,
        role: 'USER'
      }
    })
  }

  const adminPwd = await bcrypt.hash('Password123!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@youshift.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@youshift.local',
      passwordHash: adminPwd,
      role: 'ADMIN'
    }
  })

  const mama = ['Muñoz','Cabrera','De Armas']
  const urg = ['Marichal','Fdez del Castillo','Núñez']

  for(const m of mama){
    await prisma.user.updateMany({ where: { name: m }, data: { group: 'MAMA' } })
  }
  for(const u of urg){
    await prisma.user.updateMany({ where: { name: u }, data: { group: 'URGENCIAS' } })
  }

  console.log('Seed finished')
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=> prisma.$disconnect())
