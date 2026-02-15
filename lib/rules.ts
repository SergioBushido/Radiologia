import { prisma } from './prisma'
import { eachDayOfInterval, parseISO, format, addDays, getDay } from 'date-fns'

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

  // Blocks: check if either user has a block on date
  const blocks = await prisma.block.findMany({ where: { date, OR: [{ userId: slot1UserId }, { userId: slot2UserId }] } })
  if (blocks.length > 0) {
    errors.push({ code: 'BLOCKED_DAY', message: 'One of the users has blocked this date' })
  }

  return errors
}

export async function validateAssignment(userId: number, date: string, month: string) {
  const errors: ValidationError[] = []
  const user = await getUserById(userId)
  if (!user) return [{ code: 'USER_NOT_FOUND', message: 'User not found' }]

  // 1) Blocks
  const block = await prisma.block.findFirst({ where: { userId, month } })
  if (block && block.date === date) {
    errors.push({ code: 'BLOCKED_DAY', message: 'User has a block on this date' })
  }

  // 2) Assignment count limit (using user.monthlyLimit)
  const shiftsThisMonth = await prisma.shift.findMany({ where: { date: { startsWith: month } } })
  const countUser = shiftsThisMonth.filter(s => s.slot1UserId === userId || s.slot2UserId === userId).length
  if (countUser + 1 > user.monthlyLimit) {
    errors.push({ code: 'MONTHLY_LIMIT', message: `User would exceed their monthly limit of ${user.monthlyLimit}` })
  }

  // 3) Separation between shifts: min 2 full days between shifts (48h rest)
  const target = parseISO(date)
  const from = format(addDays(target, -2), 'yyyy-MM-dd')
  const to = format(addDays(target, 2), 'yyyy-MM-dd')
  const nearby = await prisma.shift.findMany({ where: { date: { gte: from, lte: to } } })
  for (const s of nearby) {
    if (s.date === date) continue
    if (s.slot1UserId === userId || s.slot2UserId === userId) {
      errors.push({ code: 'SEPARATION', message: 'User needs at least 2 full days between shifts' })
      break
    }
  }

  // 4) Limits per weekday
  const shifts = await prisma.shift.findMany({ where: { date: { startsWith: month } } })
  const userShifts = shifts.filter(s => s.slot1UserId === userId || s.slot2UserId === userId)

  // Count Thursdays (4), Fridays (5), weekends (6=Sat,0=Sun)
  const thursdays = userShifts.filter(s => [4].includes(getDay(parseISO(s.date)))).length
  const fridays = userShifts.filter(s => [5].includes(getDay(parseISO(s.date)))).length
  const weekend = userShifts.filter(s => [6, 0].includes(getDay(parseISO(s.date)))).length

  if (thursdays + 1 > 1 && getDay(target) === 4) errors.push({ code: 'THURSDAY_LIMIT', message: 'User would exceed 1 Thursday per month' })
  if (fridays + 1 > 1 && getDay(target) === 5) errors.push({ code: 'FRIDAY_LIMIT', message: 'User would exceed 1 Friday per month' })
  if (weekend + 1 > 2 && [6, 0].includes(getDay(target))) errors.push({ code: 'WEEKEND_LIMIT', message: 'User would exceed 2 weekend days per month' })

  return errors
}

export type { ValidationError }

