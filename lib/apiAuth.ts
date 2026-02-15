import { verifyToken } from './auth'
import { prisma } from './prisma'
import type { NextApiRequest } from 'next'

export async function getUserFromReq(req: NextApiRequest){
  const header = req.headers.authorization || ''
  const token = Array.isArray(header) ? header[0].split(' ')[1] : header.split(' ')[1]
  if(!token) return null
  const data: any = verifyToken(token)
  if(!data) return null
  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  return user
}

export function requireAdmin(user:any){
  if(!user) return false
  return user.role === 'ADMIN'
}
