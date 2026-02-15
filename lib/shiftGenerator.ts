import { prisma } from './prisma'
import { validateDay, validateAssignment } from './rules'
import { eachDayOfInterval, parseISO, endOfMonth, getDay, format } from 'date-fns'

type Candidate = {
    id: number
    name: string
    group: string | null
    monthlyLimit: number
    preferencePoints: number
}

export async function generateSchedule(month: string) {
    const start = parseISO(`${month}-01`)
    const days = eachDayOfInterval({ start, end: endOfMonth(start) })
    const users = await prisma.user.findMany({
        include: {
            preferences: {
                where: {
                    date: { startsWith: month }
                }
            }
        }
    })

    // Get existing shifts to respect manual assignments
    const existingShifts = await prisma.shift.findMany({
        where: { date: { startsWith: month } }
    })

    const shiftsMap = new Map(existingShifts.map(s => [s.date, s]))

    // Backtracking function
    async function backtrack(dayIndex: number, currentAssignCount: Map<number, number>): Promise<any | null> {
        if (dayIndex === days.length) return [] // Success!

        const date = format(days[dayIndex], 'yyyy-MM-dd')
        const existingSync = shiftsMap.get(date)

        // If already has 2 users (manual assignment), skip to next day
        if (existingSync) {
            const result = await backtrack(dayIndex + 1, currentAssignCount)
            if (result) return [{ date, slot1UserId: existingSync.slot1UserId, slot2UserId: existingSync.slot2UserId }, ...result]
            return null
        }

        // Get candidates and score them
        const candidates: Candidate[] = users.map(u => ({
            id: u.id,
            name: u.name,
            group: u.group as string | null,
            monthlyLimit: u.monthlyLimit,
            preferencePoints: u.preferences.find(p => p.date === date)?.points || 0
        }))

        // Try pairs for this day
        // Sort candidates by preference points (desc) and current assignment count (asc)
        const sortedCandidates = [...candidates].sort((a, b) => {
            if (b.preferencePoints !== a.preferencePoints) return b.preferencePoints - a.preferencePoints
            return (currentAssignCount.get(a.id) || 0) - (currentAssignCount.get(b.id) || 0)
        })

        // Shuffle tie-breakers (users with same points and same count) to improve variations
        // For now, let's just use the greedy order but with some randomness if points are equal
        for (let i = 0; i < sortedCandidates.length; i++) {
            let j = i
            while (j < sortedCandidates.length && sortedCandidates[j].preferencePoints === sortedCandidates[i].preferencePoints && (currentAssignCount.get(sortedCandidates[j].id) || 0) === (currentAssignCount.get(sortedCandidates[i].id) || 0)) {
                j++
            }
            if (j > i + 1) {
                // Shuffle subset [i, j)
                for (let k = j - 1; k > i; k--) {
                    const r = i + Math.floor(Math.random() * (k - i + 1));
                    [sortedCandidates[k], sortedCandidates[r]] = [sortedCandidates[r], sortedCandidates[k]]
                }
            }
            i = j - 1
        }

        // Try all possible valid pairs
        for (let i = 0; i < sortedCandidates.length; i++) {
            for (let j = i + 1; j < sortedCandidates.length; j++) {
                const u1 = sortedCandidates[i]
                const u2 = sortedCandidates[j]

                // Hard Constraints check
                const dayErrs = await validateDay(u1.id, u2.id, date)
                if (dayErrs.length > 0) continue

                const a1Errs = await validateAssignment(u1.id, date, month)
                const a2Errs = await validateAssignment(u2.id, date, month)
                if (a1Errs.length > 0 || a2Errs.length > 0) continue

                // Temporarily increment counts
                currentAssignCount.set(u1.id, (currentAssignCount.get(u1.id) || 0) + 1)
                currentAssignCount.set(u2.id, (currentAssignCount.get(u2.id) || 0) + 1)

                // Recurse
                const result = await backtrack(dayIndex + 1, currentAssignCount)
                if (result) {
                    return [{ date, slot1UserId: u1.id, slot2UserId: u2.id }, ...result]
                }

                // Backtrack: revert counts
                currentAssignCount.set(u1.id, (currentAssignCount.get(u1.id) || 0) - 1)
                currentAssignCount.set(u2.id, (currentAssignCount.get(u2.id) || 0) - 1)
            }
        }

        return null // Failed to find a valid pair for this day
    }

    const initialAssignCounts = new Map<number, number>()
    for (const u of users) initialAssignCounts.set(u.id, 0)
    for (const s of existingShifts) {
        initialAssignCounts.set(s.slot1UserId, (initialAssignCounts.get(s.slot1UserId) || 0) + 1)
        initialAssignCounts.set(s.slot2UserId, (initialAssignCounts.get(s.slot2UserId) || 0) + 1)
    }

    const solution = await backtrack(0, initialAssignCounts)
    return solution
}
