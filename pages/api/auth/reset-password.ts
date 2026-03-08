import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const { token, password } = req.body

    if (!token || !password) {
        return res.status(400).json({ error: 'Token y nueva contraseña requeridos' })
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    try {
        // Find user with valid and unexpired token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Token expiry must be greater than current time
                },
            },
        })

        if (!user) {
            return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' })
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)

        // Update user password and clear the reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        })

        return res.status(200).json({ message: 'Contraseña actualizada correctamente' })

    } catch (error) {
        console.error('Error in reset-password:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}
