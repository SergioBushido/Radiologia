import { prisma } from './prisma'
import { parseISO, format, addDays, getDay, isSameMonth, endOfMonth, eachDayOfInterval, isWeekend, getISOWeek } from 'date-fns'

type ValidationError = { code: string; message: string }

const GROUPS = {
  MAMA: ['Muñoz', 'Cabrera', 'De Armas'],
  URGENCIAS: ['Marichal', 'Fdez del Castillo', 'Núñez']
}

async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } })
}

export async function validateDay(slot1UserId: number, slot2UserId: number, date: string) {
  const errors: ValidationError[] = []
  if (slot1UserId === slot2UserId) {
    errors.push({ code: 'SAME_USER', message: 'Both slots must be different users' })
  }

  const slot1 = await getUserById(slot1UserId)
  const slot2 = await getUserById(slot2UserId)

  if (!slot1 || !slot2) {
    errors.push({ code: 'USER_NOT_FOUND', message: 'One of the users not found' })
    return errors
  }

  // Group conflict: same group (except STANDARD)
  if (slot1.group && slot2.group && slot1.group === slot2.group && (slot1.group as any) !== 'STANDARD') {
    errors.push({ code: 'GROUP_CONFLICT', message: `Users from group ${slot1.group} cannot work together` })
  }

  // MAMA vs URGENCIAS conflict
  const isMama = (g: string | null) => g === 'MAMA'
  const isUrg = (g: string | null) => g === 'URGENCIAS'
  if ((isMama(slot1.group) && isUrg(slot2.group)) || (isMama(slot2.group) && isUrg(slot1.group))) {
    errors.push({ code: 'MAMA_URGENCIAS_CONFLICT', message: 'No pueden coincidir en la misma guardia personal de urgencias y de mama' })
  }

  // Check for Vacation/Block on date (from ShiftPreference type=BLOCK or Vacation table)
  // Assuming Vacation model is used for strict blocks (approved vacations)
  // ShiftPreference type=BLOCK is soft constraint (avoidance) but validation function might want to flag it?
  // Actually, validateDay is "Hard Constraints" mostly for Manual Assignment? Or Generator?
  // Let's implement strict stuff here.

  const vacations = await prisma.vacation.findMany({ where: { date, OR: [{ userId: slot1UserId }, { userId: slot2UserId }], status: 'APPROVED' } })
  if (vacations.length > 0) {
    errors.push({ code: 'VACATION_DAY', message: 'One of the users has an approved vacation on this date' })
  }

  return errors
}

export async function validateAssignment(userId: number, date: string, month: string) {
  const errors: ValidationError[] = []
  const user = await getUserById(userId)
  if (!user) return [{ code: 'USER_NOT_FOUND', message: 'User not found' }]

  const targetDate = parseISO(date)

  // 1) Vacations (Strict)
  const vacation = await prisma.vacation.findFirst({ where: { userId, date, status: 'APPROVED' } })
  if (vacation) {
    errors.push({ code: 'VACATION_DAY', message: 'User has an approved vacation on this date' })
  }

  // 2) Separation between shifts: min 2 FULL days between shifts.
  // Example: Shift on 5th. Next allowed on 8th? (5th + 1 + 2 = 8th?)
  // Prompt: "Min 2 days of rest... if shift on day 5, next cannot be before day 8".
  // So gap is 6, 7.  (Day 5 shift -> Rest 6, 7 -> Shift 8 ok).
  // Distance >= 3 days? (8 - 5 = 3). Yes.
  // Check range [date-2, date+2] excluding date itself.

  const from = format(addDays(targetDate, -2), 'yyyy-MM-dd')
  const to = format(addDays(targetDate, 2), 'yyyy-MM-dd')
  const nearby = await prisma.shift.findMany({ where: { date: { gte: from, lte: to } } })

  for (const s of nearby) {
    if (s.date === date) continue
    if (s.slot1UserId === userId || s.slot2UserId === userId) {
      errors.push({ code: 'SEPARATION', message: 'User needs at least 2 full days between shifts' })
      break
    }
  }

  // 3) Strict Limits per month
  const shifts = await prisma.shift.findMany({ where: { date: { startsWith: month } } })
  const userShifts = shifts.filter(s => s.slot1UserId === userId || s.slot2UserId === userId && s.date !== date) // Exclude current if editing? assume new assignment

  // Count existing shifts + potential new one
  // WE DO NOT count the current date being validated provided it's satisfied by "s.date !== date" above if we are re-validating.
  // But wait, userShifts is fetched from DB. If we are adding a NEW shift, it's not in DB yet.

  const thursdays = userShifts.filter(s => getDay(parseISO(s.date)) === 4).length
  const fridays = userShifts.filter(s => getDay(parseISO(s.date)) === 5).length

  // Weekends: Count distinct weekends working.
  // Identify weekend by ISO week number or just check dates.
  // "Max 2 weekends per month". 
  // Getting week number: getISOWeek(date).
  // Need to be careful about month boundaries? "In the same month".
  // Let's identify "Weekend ID" as something like "WeekNum".
  // Be careful: Sunday is usually end of week in ISO. Saturday and Sunday of same week = 1 weekend.
  // Different weekends = different week numbers.
  // HOWEVER, if a month starts on Sunday, that Sunday is a weekend. If it ends on Saturday, that is a weekend.
  // Simple heuristic: Set of "Week Numbers" for all Sat/Sun shifts.

  // Helper to get unique weekends
  const getWeekendId = (d: Date) => {
    // Adjust Sunday to be part of previous week? Or just use getISOWeek?
    // getISOWeek: Sunday is 7th day. Sat is 6th. They share ISO Week.
    // So ISO Week is perfect identifier for "Weekend".
    // Exception: If month spans across weeks, we only care about "weekends in this month".
    // Yes.
    const day = getDay(d)
    if (day === 0 || day === 6) { // Sun or Sat
      // Returns ISO week.
      // Note: formatted date string ensures correctness.
      // There is an edge case: ISO week 1 can be in Dec or Jan.
      // But within a single month query, it's consistent enough or we use `${year}-${week}`.
      // Since we filter shifts by `startsWith: month` (YYYY-MM), we are safe locally.
      const week = getISOWeek(d)
      return week
    }
    return null
  }

  const distinctWeekends = new Set<number>()
  userShifts.forEach(s => {
    const wWidth = getWeekendId(parseISO(s.date))
    if (wWidth !== null) distinctWeekends.add(wWidth)
  })

  // Check current target date
  const targetDay = getDay(targetDate)
  const isTargetThursday = targetDay === 4
  const isTargetFriday = targetDay === 5
  const isTargetWeekend = targetDay === 0 || targetDay === 6

  if (isTargetThursday && thursdays >= 1) {
    errors.push({ code: 'THURSDAY_LIMIT', message: 'User would exceed 1 Thursday per month' })
  }
  if (isTargetFriday && fridays >= 1) {
    errors.push({ code: 'FRIDAY_LIMIT', message: 'User would exceed 1 Friday per month' })
  }
  if (isTargetWeekend) {
    const targetWk = getISOWeek(targetDate)
    // If this weekend is ALREADY in the set, it doesn't increase the count.
    // If it's new, we check if size is >= 2.
    if (!distinctWeekends.has(targetWk) && distinctWeekends.size >= 2) {
      errors.push({ code: 'WEEKEND_LIMIT', message: 'User would exceed 2 weekends per month' })
    }
  }

  return errors
}

export type { ValidationError }


