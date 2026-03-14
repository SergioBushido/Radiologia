import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    // Obtener todos los mensajes principales (sin parentId) y sus respuestas
    const posts = await prisma.boardPost.findMany({
      where: { parentId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          } as any
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                avatarUrl: true
              } as any
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.json(posts)
  }

  if (req.method === 'POST') {
    const { content, parentId } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content required' })
    }

    const post = await prisma.boardPost.create({
      data: {
        userId: user.id,
        content: content.trim(),
        parentId: parentId ? Number(parentId) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          } as any
        }
      }
    })

    // Si es un anuncio nuevo (no una respuesta), enviar mail masivo
    if (!parentId) {
      const webhookUrl = process.env.MAKE_ANNOUNCEMENT_WEBHOOK_URL
      if (webhookUrl) {
        // Ejecutamos el envío de forma asíncrona para no bloquear la respuesta al usuario
        (async () => {
          try {
            const allUsers = await prisma.user.findMany({
              where: {
                id: { not: 0 }, // Excluir usuario dummy
                email: { not: user.email } // Opcional: excluir al remitente
              },
              select: { email: true, name: true }
            })

            const emails = allUsers.map(u => u.email)

            if (emails.length > 0) {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  senderName: user.name,
                  content: post.content,
                  recipients: emails,
                  users: allUsers, // Por si el webhook necesita los nombres también
                  createdAt: post.createdAt
                })
              })
              console.log(`Mass announcement email triggered for ${emails.length} users`)
            }
          } catch (err) {
            console.error('Error triggering mass announcement email:', err)
          }
        })()
      } else {
        console.warn('MAKE_ANNOUNCEMENT_WEBHOOK_URL not set. Skipping mass email notification.')
      }
    }

    return res.json(post)
  }

  if (req.method === 'DELETE') {
    const id = req.query.id || req.body.id
    if (!id) return res.status(400).json({ error: 'Post ID required' })

    const post = await prisma.boardPost.findUnique({
      where: { id: Number(id) }
    })

    if (!post) return res.status(404).json({ error: 'Post not found' })

    // Solo el autor o un admin puede eliminar
    if (post.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.boardPost.delete({
      where: { id: Number(id) }
    })

    return res.json({ success: true })
  }

  res.status(405).end()
}

