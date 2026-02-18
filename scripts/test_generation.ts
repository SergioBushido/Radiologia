
import { generateSchedule } from '../lib/shiftGenerator'
import { prisma } from '../lib/prisma'

async function main() {
    const month = '2026-03'
    console.log(`Generating schedule for ${month}...`)

    const result = await generateSchedule(month)

    if (result) {
        console.log(`Success! Assignments count: ${result.length}`)

        // Verify Nieto
        const nieto = await prisma.user.findFirst({ where: { name: { contains: 'Nieto' } } })
        if (nieto) {
            const count = result.filter(s => s.slot1UserId === nieto.id || s.slot2UserId === nieto.id).length
            console.log(`Nieto (Limit 2) assigned: ${count}`)
            if (count > 2) {
                console.error('FAIL: Nieto assigned more than 2 shifts!')
                process.exit(1)
            }
        }

        // Verify Muñoz
        const munoz = await prisma.user.findFirst({ where: { name: { contains: 'Muñoz' } } })
        if (munoz) {
            const count = result.filter(s => s.slot1UserId === munoz.id || s.slot2UserId === munoz.id).length
            console.log(`Muñoz (Limit 1) assigned: ${count}`)
            if (count > 1) {
                console.error('FAIL: Muñoz assigned more than 1 shift!')
                process.exit(1)
            }
        }

        console.log('VERIFICATION PASSED')

    } else {
        console.error('Failed to generate schedule (null result).')
        process.exit(1)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
