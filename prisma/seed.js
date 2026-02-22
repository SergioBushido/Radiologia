const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const users = [
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
  ]

  const pwd = await bcrypt.hash('Password123!', 10)

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.name === 'Linares' ? 'ADMIN' : 'USER',
        monthlyLimit: u.name === 'Nieto' ? 2 : (u.name === 'Muñoz' ? 1 : 999)
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: pwd,
        role: u.name === 'Linares' ? 'ADMIN' : 'USER',
        monthlyLimit: u.name === 'Nieto' ? 2 : (u.name === 'Muñoz' ? 1 : 999)
      }
    })
  }

  const mama = ['Muñoz', 'Cabrera', 'De armas']
  const urg = ['Marichal', 'Fdez del Castillo', 'Núñez']

  for (const m of mama) {
    await prisma.user.updateMany({ where: { name: m }, data: { group: 'MAMA' } })
  }
  for (const u of urg) {
    await prisma.user.updateMany({ where: { name: u }, data: { group: 'URGENCIAS' } })
  }

  console.log('Seed finished')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
