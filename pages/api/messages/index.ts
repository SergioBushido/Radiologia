
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserFromReq } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromReq(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
        const { targetUserId } = req.query

        // If query param 'checkUnread' is present, just return count of unread messages for current user
        if (req.query.checkUnread === 'true') {
            const count = await prisma.message.count({
                where: {
                    receiverId: user.id,
                    isRead: false
                }
            })
            return res.json({ count })
        }

        let whereClause: any = {}

        // Get conversations list if no target specified
        if (!targetUserId) {
            // Get messages involving current user
            const messages = await prisma.message.findMany({
                where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
                orderBy: { createdAt: 'desc' }
            })

            // Unique user IDs from chats (excluding current user)
            const contactIds = Array.from(new Set(messages.map(m => m.senderId === user.id ? m.receiverId : m.senderId)))
            const contacts = await prisma.user.findMany({
                where: { id: { in: contactIds, not: user.id } },
                select: { id: true, name: true, role: true, avatarUrl: true } as any
            })

            // Enrich with unread count and last message
            const conversations = await Promise.all(contacts.map(async (c) => {
                const unreadCount = await prisma.message.count({
                    where: { senderId: c.id, receiverId: user.id, isRead: false }
                })
                const lastMessage = await prisma.message.findFirst({
                    where: { OR: [{ senderId: user.id, receiverId: c.id }, { senderId: c.id, receiverId: user.id }] },
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, createdAt: true } as any
                })
                return { ...c, unreadCount, lastMessage }
            }))

            // Sort by latest message
            conversations.sort((a, b) => {
                const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
                const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
                return dateB - dateA
            })

            return res.json({ conversations })
        } else {
            // Chat with specific user
            whereClause = {
                OR: [
                    { senderId: user.id, receiverId: Number(targetUserId) },
                    { senderId: Number(targetUserId), receiverId: user.id }
                ]
            }
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { name: true, role: true, avatarUrl: true } as any } }
        })

        // Mark as read if I am the receiver
        await prisma.message.updateMany({
            where: {
                receiverId: user.id,
                isRead: false,
                // Only mark messages from this conversation as read
                ...(targetUserId ? { senderId: Number(targetUserId) } : {})
            },
            data: { isRead: true }
        })

        return res.json(messages)
    }

    if (req.method === 'POST') {
        const { content, targetUserId } = req.body
        if (!content) return res.status(400).json({ error: 'Content required' })

        let receiverId = targetUserId ? Number(targetUserId) : null

        if (!receiverId) {
            // If User sending, and no target specified, find an Admin to send to?
            // Or just fail.
            // Let's assume the UI must provide a target.
            // For User -> Admin, maybe we find the *first* admin?
            if (user.role !== 'ADMIN') {
                const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
                if (admin) receiverId = admin.id
            }
        }

        if (!receiverId) return res.status(400).json({ error: 'Receiver required' })

        const message = await prisma.message.create({
            data: {
                senderId: user.id,
                receiverId,
                content
            }
        })
        return res.json(message)
    }

    return res.status(405).end()
}
