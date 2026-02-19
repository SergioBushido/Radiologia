import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export let prisma: PrismaClient

if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
  } else {
    if (!global.prisma || !global.prisma.boardPost) {
      console.log('Initializing or re-initializing Prisma Client...')
      global.prisma = new PrismaClient()
    }
    prisma = global.prisma
    console.log('Prisma models available in app:', Object.keys(prisma).filter(k => !k.startsWith('_')));
  }
}
