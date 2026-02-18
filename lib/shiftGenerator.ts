import { prisma } from './prisma'
import { eachDayOfInterval, parseISO, endOfMonth, format, getDay, isSameDay, addDays, getISOWeek, differenceInCalendarDays } from 'date-fns'

/* 
  Tipo de estado por usuario para el backtracking en memoria.
  Evita queries dentro de la recursión.
*/
type UserState = {
    id: number
    name: string
    group: string | null
    monthlyLimit: number // De User.monthlyLimit (999 = usar MAX_SHIFTS_DEFAULT)
    preferenceByDate: Map<string, { type: 'PREFERENCE' | 'BLOCK' | 'LOCK'; points: number }>
    vacationDates: Set<string>
    assignedDates: string[] // Se actualiza dinámicamente con push/pop durante backtracking
    totalShiftsAllTime: number // Para cálculo de equidad global inicial
}

const MAX_SHIFTS_DEFAULT = 7
const MAX_ATTEMPTS = 100000

export async function generateSchedule(month: string) {
    // 1. Cargar todos los datos de BD (una sola vez)
    const start = parseISO(`${month}-01`)
    const end = endOfMonth(start)
    const days = eachDayOfInterval({ start, end })

    // Cargar usuarios con todo lo necesario
    const users = await prisma.user.findMany({
        include: {
            vacations: {
                where: {
                    date: { startsWith: month },
                    status: 'APPROVED'
                }
            },
            preferences: {
                where: {
                    date: { startsWith: month }
                }
            },
            // Para equidad global, idealmente contaríamos todos los turnos históricos
            // O los del año en curso. Aquí usamos un count simple.
            _count: {
                select: { shiftsSlot1: true, shiftsSlot2: true }
            }
        }
    })

    // Guardias YA asignadas manualmente o previamente en este mes
    const existingShifts = await prisma.shift.findMany({
        where: { date: { startsWith: month } }
    })

    // 2. Construir UserState[] en memoria
    const userStates: UserState[] = users.map(u => {
        const prefMap = new Map<string, { type: 'PREFERENCE' | 'BLOCK' | 'LOCK'; points: number }>()
        u.preferences.forEach(p => {
            prefMap.set(p.date, { type: p.type as any, points: p.points })
        })

        const vacSet = new Set<string>()
        u.vacations.forEach(v => vacSet.add(v.date))

        // Inicializar assignedDates con lo que ya tenga asignado en DB (si re-iniciamos sobre un mes parcial)
        // PERO: Si la guardia está en existingShifts, la consideraremos "fija" en el algoritmo
        // y la añadiremos al estado inicial.
        const alreadyAssigned = existingShifts
            .filter(s => s.slot1UserId === u.id || s.slot2UserId === u.id)
            .map(s => s.date)

        return {
            id: u.id,
            name: u.name,
            group: u.group,
            monthlyLimit: u.monthlyLimit,
            preferenceByDate: prefMap,
            vacationDates: vacSet,
            assignedDates: alreadyAssigned,
            totalShiftsAllTime: u._count.shiftsSlot1 + u._count.shiftsSlot2
        }
    })

    // Mapa de guardias fijas: date -> Shift
    // Si existe guardia en DB, se respeta tal cual.
    const fixedShiftsMap = new Map<string, { slot1UserId: number; slot2UserId: number; id?: number }>()
    existingShifts.forEach(s => {
        fixedShiftsMap.set(s.date, { slot1UserId: s.slot1UserId, slot2UserId: s.slot2UserId, id: s.id })
    })

    let attempts = 0

    // 3. Backtracking
    function backtrack(dayIndex: number): Array<{ date: string; slot1UserId: number; slot2UserId: number }> | null {
        if (attempts++ > MAX_ATTEMPTS) return null
        if (dayIndex === days.length) return [] // Éxito

        const dateObj = days[dayIndex]
        const dateStr = format(dateObj, 'yyyy-MM-dd')

        // A) Si el día ya tiene guardia fija en DB, la usamos y avanzamos
        if (fixedShiftsMap.has(dateStr)) {
            const fixed = fixedShiftsMap.get(dateStr)!
            // Nota: Los usuarios ya tienen esta fecha en assignedDates desde la inicialización.
            // No necesitamos hacer push/pop aquí porque es inmutable para el algoritmo.
            const res = backtrack(dayIndex + 1)
            if (res) return [{ date: dateStr, ...fixed }, ...res]
            return null
        }

        // B) Buscar candidatos válidos
        // Filtrar usuarios que rompen Hard Constraints
        const validUsers = userStates.filter(u => checkHardConstraints(u, dateStr, dateObj))

        // Ordenar candidatos (Soft Constraints) - Criterios de Preferencia
        // 1. Preferencia declarada (PREFERENCE): Mayor prioridad.
        // 2. Equidad: Se prioriza a quien menos guardias tenga (Total histórico + Asignadas este mes).
        // 3. Evitar bloqueos (BLOCK): Se penaliza a quien prefirió no trabajar.

        validUsers.sort((a, b) => {
            const scoreA = calculateScore(a, dateStr)
            const scoreB = calculateScore(b, dateStr)
            return scoreB - scoreA // Mayor score primero
        })

        // Probar parejas (Combinaciones de candidatos válidos)
        for (let i = 0; i < validUsers.length; i++) {
            for (let j = i + 1; j < validUsers.length; j++) {
                const u1 = validUsers[i]
                const u2 = validUsers[j]

                // Validar Conflicto de Pareja (Reglas de Grupo)
                if (!validatePair(u1, u2)) continue

                // Intentar asignar (Marcar fecha en estado temporal)
                u1.assignedDates.push(dateStr)
                u2.assignedDates.push(dateStr)

                // Recursión: Continuar al siguiente día
                const res = backtrack(dayIndex + 1)

                if (res) {
                    // Éxito: Retornar solución construida
                    return [{ date: dateStr, slot1UserId: u1.id, slot2UserId: u2.id }, ...res]
                }

                // Backtrack: Si el camino falla, deshacer los cambios y probar siguiente pareja
                u1.assignedDates.pop()
                u2.assignedDates.pop()
            }
        }

        return null
    }

    // --- Helpers en memoria ---

    /**
     * Verifica TODAS las restricciones estrictas (Hard Constraints) para un usuario individual.
     * Si retorna false, el usuario NO puede ser asignado a 'dateObj'.
     */
    function checkHardConstraints(u: UserState, dateStr: string, dateObj: Date): boolean {
        // 1. Vacaciones: Si tiene vacación aprobada, descartar.
        if (u.vacationDates.has(dateStr)) return false

        // 2. Límite mensual: No exceder el número máximo de guardias del usuario.
        const limit = u.monthlyLimit === 999 ? MAX_SHIFTS_DEFAULT : u.monthlyLimit
        if (u.assignedDates.length >= limit) return false

        // 3. Separación mínima: 2 días completos de descanso entre guardias.
        // Se comprueba si hay alguna guardia asignada a menos de 3 días de distancia.
        const hasCloseShift = u.assignedDates.some(d => Math.abs(differenceInCalendarDays(parseISO(d), dateObj)) < 3)
        if (hasCloseShift) return false

        // 4. Límites por día de semana
        const dayOfWeek = getDay(dateObj) // 0=Domingo, ..., 4=Jueves, 5=Viernes, 6=Sábado

        // Jueves: Máximo 1 al mes
        if (dayOfWeek === 4) {
            const thursdays = u.assignedDates.filter(d => getDay(parseISO(d)) === 4).length
            if (thursdays >= 1) return false
        }

        // Viernes: Máximo 1 al mes
        if (dayOfWeek === 5) {
            const fridays = u.assignedDates.filter(d => getDay(parseISO(d)) === 5).length
            if (fridays >= 1) return false
        }

        // Fines de semana: Máximo 2 al mes
        const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
        if (isWeekendDay) {
            // Contar fines de semana únicos (usando número de semana ISO como ID)
            const myWeekends = new Set<number>()
            u.assignedDates.forEach(d => {
                const dObj = parseISO(d)
                const dDay = getDay(dObj)
                if (dDay === 0 || dDay === 6) {
                    myWeekends.add(getISOWeek(dObj))
                }
            })

            const currentWeek = getISOWeek(dateObj)
            // Si es un fin de semana nuevo y ya llevo 2, bloquear.
            if (!myWeekends.has(currentWeek) && myWeekends.size >= 2) return false
        }

        return true
    }

    /**
     * Valida la compatibilidad entre dos usuarios seleccionados (Hard Constraints de Pareja).
     */
    function validatePair(u1: UserState, u2: UserState): boolean {
        // 1. Conflictos de Grupo: Mismo grupo no puede coincidir (salvo STANDARD)
        if (u1.group && u2.group && u1.group === u2.group && u1.group !== 'STANDARD') return false

        // 2. Conflicto MAMA vs URGENCIAS: Incompatibles entre sí
        const g1 = u1.group
        const g2 = u2.group
        if ((g1 === 'MAMA' && g2 === 'URGENCIAS') || (g1 === 'URGENCIAS' && g2 === 'MAMA')) return false

        return true
    }

    function calculateScore(u: UserState, dateStr: string): number {
        let score = 0
        const pref = u.preferenceByDate.get(dateStr)

        // A. Preferencia declarada (Alta prioridad)
        if (pref && pref.type === 'PREFERENCE') {
            score += 1000 + pref.points // Gran boost
        }

        // B. Evitar Bloqueos (Penalización)
        if (pref && pref.type === 'BLOCK') {
            score -= (1000 + pref.points) // Gran penalización
        }

        // C. Equidad (Menos guardias -> Más score)
        // Usar total shifts (histórico + actual)
        // Multiplicador negativo pequeño para desempatar
        const total = u.totalShiftsAllTime + u.assignedDates.length
        score -= (total * 10)

        return score
    }

    // --- Ejecución ---
    const result = backtrack(0)
    return result
}
