import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { parseISO, getDay } from 'date-fns'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query
  const userId = Number(id)
  const { month } = req.query
  if(!month) return res.status(400).json({ error: 'month required (YYYY-MM)' })
  const shifts = await prisma.shift.findMany({ where: { date: { startsWith: String(month) } } })
  const my = shifts.filter(s=>s.slot1UserId===userId || s.slot2UserId===userId)
  const total = my.length
  let thursday = 0, friday = 0, weekend = 0
  for(const s of my){
    const d = parseISO(s.date)
    const wd = getDay(d)
    if(wd === 4) thursday++
    if(wd === 5) friday++
    if(wd === 6 || wd === 0) weekend++
  }
  const points = total // default 1 point each
  res.json({ total, thursday, friday, weekend, points })
}
