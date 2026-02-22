import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { month } = req.query

    if (req.method === 'GET') {
        if (!month || typeof month !== 'string') return res.status(400).json({ error: 'Month required' })

        const whereClause: any = {
            date: { startsWith: month }
        }

        // Si NO es admin, solo devuelve sus propias preferencias
        // Si ES admin, devuelve las de TODOS para ese mes
        if (user.role !== 'ADMIN') {
            whereClause.userId = user.id
        }

        const preferences = await prisma.shiftPreference.findMany({
            where: whereClause,
            include: { user: { select: { name: true, group: true } } } // Include user details for Admin view
        })
        return res.json(preferences)
    }

    if (req.method === 'POST') {
        const { date, type, points, targetUserId } = req.body

        let userId = user.id
        if (targetUserId && user.role === 'ADMIN') {
            userId = targetUserId
        } else if (targetUserId && user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Solo administradores pueden editar preferencias de otros usuarios' })
        }

        // Validation: Check total points for the month
        const monthPrefix = date.slice(0, 7) // YYYY-MM

        // Check for Lock limit (1 per month)
        if (type === 'LOCK' && user.role !== 'ADMIN') {
            const existingLock = await prisma.shiftPreference.findFirst({
                where: {
                    userId: userId,
                    date: { startsWith: monthPrefix },
                    type: 'LOCK',
                    NOT: { date: date }
                }
            })
            if (existingLock) {
                return res.status(400).json({ error: 'Solo puedes bloquear un día al mes. Elimina el bloqueo existente para cambiarlo.' })
            }
        }

        // Validate bounds
        if (points < 0 || points > 20) return res.status(400).json({ error: 'Los puntos deben estar entre 0 y 20' })

        const existing = await prisma.shiftPreference.findMany({
            where: {
                userId: userId,
                date: { startsWith: monthPrefix }
            }
        })

        // Calculate new total for the specific type
        const sameTypePrefs = existing.filter(p => p.date !== date && p.type === type)
        const typeTotalUsed = sameTypePrefs.reduce((sum: number, p: any) => sum + p.points, 0)

        if (typeTotalUsed + points > 20) {
            const label = type === 'PREFERENCE' ? 'Deseo Guardia' : 'Evitar Guardia'
            return res.status(400).json({
                error: `Has excedido el límite de 20 puntos para '${label}'. Te quedan ${20 - typeTotalUsed} puntos.`
            })
        }

        // Save
        if (points === 0 && type !== 'LOCK') {
            // Remove if 0 points (and not a specific LOCK action)
            await prisma.shiftPreference.deleteMany({
                where: { userId: userId, date }
            })
            return res.json({ deleted: true })
        } else {
            const pref = await prisma.shiftPreference.upsert({
                where: { userId_date: { userId: userId, date } },
                update: { type, points }, // update type if changing from PREFERENCE to LOCK
                create: { userId: userId, date, type, points }
            })
            return res.json(pref)
        }
    }

    return res.status(405).end()
}
