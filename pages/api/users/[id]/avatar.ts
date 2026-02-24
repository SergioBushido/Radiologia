import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getUserFromReq, requireAdmin } from '../../../../lib/apiAuth'

// Disable Next.js body parser — we handle raw body manually
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
    },
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const BUCKET = 'avatars'

async function ensureBucket() {
    // Create bucket if it doesn't exist
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: BUCKET,
            name: BUCKET,
            public: true,
            file_size_limit: 5242880, // 5MB
            allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
    })
    // 409 = already exists, that's fine
    if (!res.ok && res.status !== 409) {
        const err = await res.text()
        console.error('Failed to create bucket:', err)
    }
}

async function uploadToSupabase(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
    await ensureBucket()

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': mimeType,
            'x-upsert': 'true', // Overwrite if exists
        },
        body: new Uint8Array(buffer),
    })

    if (!uploadRes.ok) {
        const err = await uploadRes.text()
        throw new Error(`Supabase upload failed: ${err}`)
    }

    // Return the public URL
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const requester = await getUserFromReq(req)
    if (!requester) return res.status(401).json({ error: 'Unauthorized' })

    const { id } = req.query
    const userId = Number(id)

    const isAdmin = requireAdmin(requester)
    const isSelf = requester.id === userId

    if (!isAdmin && !isSelf) {
        return res.status(403).json({ error: 'No tienes permiso para cambiar esta foto' })
    }

    const { imageBase64, mimeType } = req.body

    if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Se requiere imageBase64 y mimeType' })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ error: 'Tipo de imagen no permitido. Usa JPG, PNG, WEBP o GIF.' })
    }

    try {
        const buffer = Buffer.from(imageBase64, 'base64')

        // Max 5MB
        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'La imagen no puede superar 5MB' })
        }

        const ext = mimeType.split('/')[1]
        const fileName = `user-${userId}-${Date.now()}.${ext}`

        const avatarUrl = await uploadToSupabase(buffer, mimeType, fileName)

        // Save URL to DB
        await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        })

        return res.json({ avatarUrl })
    } catch (error: any) {
        console.error('Avatar upload error:', error)
        return res.status(500).json({ error: error.message || 'Error al subir la imagen' })
    }
}
