
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

        if (user.role === 'ADMIN') {
            // Admin chatting with a specific user
            if (!targetUserId) {
                // Return list of users with unread messages or just recent chats?
                // For now simplicity: If no target, return recent unique senders to admin?
                // BETTER: The UI will likely ask for messages for a specific user.
                // If no target, maybe return nothing or a list of recent conversations.
                // Let's implement: List of users who have chatted with Admin.

                // Get distinct users involved in chat with admin
                const messages = await prisma.message.findMany({
                    where: {
                        OR: [
                            { senderId: user.id },
                            { receiverId: user.id }
                        ]
                    },
                    orderBy: { createdAt: 'desc' },
                    distinct: ['senderId', 'receiverId'] // Not perfect, but helps find recent contacts
                })

                // Extract user IDs and fetch user details
                const userIds = Array.from(new Set(messages.map(m => m.senderId === user.id ? m.receiverId : m.senderId)))
                const users = await prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, name: true, role: true }
                })

                return res.json({ conversations: users })
            } else {
                // Fetch conversation with specific user
                whereClause = {
                    OR: [
                        { senderId: user.id, receiverId: Number(targetUserId) },
                        { senderId: Number(targetUserId), receiverId: user.id }
                    ]
                }
            }
        } else {
            // Regular user: can only chat with Admins (or maybe specific support user?)
            // Assumption: User chats with 'ADMIN' role users. 
            // Since we don't know WHICH admin, maybe we broadcast or pick one?
            // Simpler: User sees messages from ANY admin.

            // Actually, let's keep it simple: Messages are between User and "System/Admins".
            // But the DB structure is User-to-User.
            // Let's assume there is at least one Admin.
            // Or, we find the first Admin to send to?
            // For fetching: Fetch all messages where I am sender or receiver.
            whereClause = {
                OR: [
                    { senderId: user.id },
                    { receiverId: user.id }
                ]
            }
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { name: true, role: true } } }
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
