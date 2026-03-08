import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import crypto from 'crypto'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const { email } = req.body

    if (!email) {
        return res.status(400).json({ error: 'Email requerido' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        // User-requested change: Inform if the email is not found
        if (!user) {
            return res.status(404).json({ error: 'El correo electrónico no está registrado en el sistema.' })
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex')

        // Set expiry to 1 hour from now
        const resetTokenExpiry = new Date(Date.now() + 3600000)

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        })

        // Construct the reset URL
        // TODO: Ensure this matches the correct base URL in production
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
        const host = req.headers.host || 'localhost:3000'
        const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`

        // Trigger Make.com Webhook
        const webhookUrl = process.env.MAKE_PASSWORD_RESET_WEBHOOK_URL

        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: user.email,
                        name: user.name,
                        resetUrl: resetUrl
                    })
                })
                console.log(`Webhook triggered successfully for ${user.email}`)
            } catch (webhookErr) {
                console.error("Error triggering webhook:", webhookErr)
                // We might still want to return a success message to the user, or let them know it failed.
                // Usually, failing silently in the background and returning the generic success message is safer
            }
        } else {
            console.warn("WARNING: MAKE_PASSWORD_RESET_WEBHOOK_URL environment variable is not set. Token generated but email not sent.")
            // In development, it's helpful to log the reset URL if the webhook isn't configured yet
            if (process.env.NODE_ENV === 'development') {
                console.log("Development Reset URL:", resetUrl);
            }
        }

        return res.status(200).json({ message: 'Si el correo existe en nuestra base de datos, en breve recibirás un enlace de recuperación.' })

    } catch (error) {
        console.error('Error in forgot-password:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}
