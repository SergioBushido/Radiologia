import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Iniciando borrado de preferencias...')

    // Podemos borrar solo PREFERENCE y BLOCK, manteniendo los LOCK (bloqueos firmes)
    // O borrarlo todo. Dado que el sistema cambia drásticamente, lo más limpio es borrar todo 
    // lo que sea PREFERENCE o BLOCK para que repartan los 20 puntos de nuevo.
    // Los LOCK no usan puntos (value es NULL o irrelevante para los 20 puntos) pero
    // el usuario pidió "resetear", así que borraremos PREFERENCE y BLOCK.

    // NOTA: Para no afectar a meses pasados (histórico), borraremos solo de Abril 2026 en adelante,
    // o simplemente borramos todo el futuro.

    const today = new Date()
    // Obtener el mes actual en formato YYYY-MM
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const result = await prisma.shiftPreference.deleteMany({
        where: {
            date: {
                gte: `${currentMonthPrefix}-01` // Desde el día 1 de este mes en adelante
            },
            type: {
                in: ['PREFERENCE', 'BLOCK']
            }
        }
    })

    console.log(`Se han eliminado ${result.count} preferencias (PREFERENCE/BLOCK) a partir de ${currentMonthPrefix}.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
