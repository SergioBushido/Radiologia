import { parseISO } from 'date-fns'

type UserState = {
    id: number
    name: string
    group: string | null
    monthlyLimit: number
    preferenceByDate: Map<string, { type: 'PREFERENCE' | 'BLOCK' | 'LOCK'; points: number }>
    vacationDates: Set<string>
    assignedDates: string[]
    totalShiftsAllTime: number
}

function calculateScoreOld(u: UserState, dateStr: string): number {
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
    const total = u.totalShiftsAllTime + u.assignedDates.length
    score -= (total * 10)

    return score
}

function calculateScoreNew(u: UserState, dateStr: string): number {
    let score = 0
    const pref = u.preferenceByDate.get(dateStr)

    // A. Preferencia declarada (Alta prioridad)
    if (pref && pref.type === 'PREFERENCE') {
        score += 1000 + pref.points
    }

    // B. Evitar Bloqueos (Penalización)
    if (pref && pref.type === 'BLOCK') {
        score -= (1000 + pref.points)
    }

    // C. Equidad (Menos guardias -> Más score)
    // Reducimos drásticamente el peso del histórico para que NUNCA supere los 1000 puntos de preferencia.
    // Un multiplicador de 0.1 significa que alguien con 1000 guardias históricas pierde 100 puntos,
    // que es menos que los 1000 puntos que otorga una PREFERENCIA.
    // Damos más peso a las guardias de este mes para equilibrar equidad a corto plazo.
    const historicalPenalty = u.totalShiftsAllTime * 0.1
    const currentMonthPenalty = u.assignedDates.length * 50 // Cada guardia este mes resta 50 puntos

    score -= (historicalPenalty + currentMonthPenalty)

    return score
}


// Test cases
const users: UserState[] = [
    {
        id: 1, name: 'Doctor Senior (con Preferencia)', group: 'A', monthlyLimit: 5,
        preferenceByDate: new Map([['2023-10-01', { type: 'PREFERENCE', points: 5 }]]),
        vacationDates: new Set(),
        assignedDates: [],
        totalShiftsAllTime: 500 // Senior con muchísimas guardias
    },
    {
        id: 2, name: 'Doctor Junior (sin preferencia)', group: 'A', monthlyLimit: 5,
        preferenceByDate: new Map(),
        vacationDates: new Set(),
        assignedDates: [],
        totalShiftsAllTime: 10 // Perteneciente a plantilla reciente
    }
]

console.log("OLD SCORING:")
console.log(`${users[0].name}:`, calculateScoreOld(users[0], '2023-10-01'))
console.log(`${users[1].name}:`, calculateScoreOld(users[1], '2023-10-01'))
console.log("Winner:", calculateScoreOld(users[0], '2023-10-01') > calculateScoreOld(users[1], '2023-10-01') ? users[0].name : users[1].name)

console.log("\nNEW SCORING:")
console.log(`${users[0].name}:`, calculateScoreNew(users[0], '2023-10-01'))
console.log(`${users[1].name}:`, calculateScoreNew(users[1], '2023-10-01'))
console.log("Winner:", calculateScoreNew(users[0], '2023-10-01') > calculateScoreNew(users[1], '2023-10-01') ? users[0].name : users[1].name)

// Pair Selection Test Scenario
console.log("\nPAIR SELECTION Logic comparison (Concept):")
const cand = [
    { id: 1, score: 1005 }, // Tiene preferencia
    { id: 2, score: 900 },
    { id: 3, score: -1005 }, // Tiene BLOQUEO
    { id: 4, score: 850 }
]

// Current Logic simulates:
console.log("Old logic checks combinations:")
let found = false
for (let i = 0; i < cand.length; i++) {
    for (let j = i + 1; j < cand.length; j++) {
        // Imagina que u1 y u2 no pueden estar por restricciones de grupo, pero u1 y u3 sí.
        if (cand[i].id === 1 && cand[j].id === 2) continue; // Grupo incompatible simulado
        console.log(`Trying ${cand[i].id} and ${cand[j].id}. Combined Score: ${cand[i].score + cand[j].score}`);
        if (!found) {
            console.log(`   -> OLD LOGIC ACCEPTS THIS FIRST VALID PAIR: ${cand[i].id} and ${cand[j].id}`);
            found = true
        }
    }
}

// New logic simulates
console.log("\nNew logic would sort all valid pairs by combined score first:");
const allPairs = []
for (let i = 0; i < cand.length; i++) {
    for (let j = i + 1; j < cand.length; j++) {
        if (cand[i].id === 1 && cand[j].id === 2) continue; // Grupo incompatible simulado
        allPairs.push({
            p1: cand[i],
            p2: cand[j],
            combined: cand[i].score + cand[j].score
        })
    }
}
allPairs.sort((a, b) => b.combined - a.combined)
allPairs.forEach(p => console.log(`Pair ${p.p1.id} + ${p.p2.id} = ${p.combined} score`))
console.log(`   -> NEW LOGIC ACCEPTS HIGHEST SCORE PAIR: ${allPairs[0].p1.id} and ${allPairs[0].p2.id}`);
