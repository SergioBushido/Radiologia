import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export function signToken(payload: object){
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string){
  try{
    return jwt.verify(token, JWT_SECRET)
  }catch(e){
    return null
  }
}

export async function validateCredentials(email: string, password: string){
  const user = await prisma.user.findUnique({ where: { email } })
  if(!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  if(!ok) return null
  const { passwordHash, ...rest } = (user as any)
  return rest
}
