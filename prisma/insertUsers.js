const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

/**
 * Inserta/actualiza un conjunto de usuarios de ejemplo y un admin.
 * Opciones via env:
 *  - DATABASE_URL debe estar configurada (Prisma usa esto)
 *  - USERS_PASSWORD: contraseña para los usuarios (default: Password123!)
 *  - ADMIN_EMAIL, ADMIN_PASSWORD opcionales para el admin
 */

async function main(){
  const names = [
    'Muñoz','Marichal','Linares','Chueca','Alventosa','Serra','Llanos','Monteverde','Cabrera','Nieto',
    'Caicoya','Fdez del Castillo','Núñez','Benítez','Vázquez','Paz','Souweileh','De Armas','Luisa','Amelia'
  ]

  const userPassword = process.env.USERS_PASSWORD || 'Password123!'
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@youshift.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!'

  const userHash = await bcrypt.hash(userPassword, 10)
  const adminHash = await bcrypt.hash(adminPassword, 10)

  for (const name of names){
    const email = `${name.split(' ')[0].toLowerCase().replace(/[^a-z]/g,'')}@youshift.local`
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: userHash, role: 'USER', name },
      create: { name, email, passwordHash: userHash, role: 'USER' }
    })
  }

  // Admin
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: 'ADMIN', name: 'Admin' },
    create: { name: 'Admin', email: adminEmail, passwordHash: adminHash, role: 'ADMIN' }
  })

  console.log('Usuarios insertados/upserted correctamente')
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=> prisma.$disconnect())
