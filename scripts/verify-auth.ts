
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting verification...')

    const email = 'verify_test_' + Date.now() + '@example.com'
    const password = 'TestPassword123!'

    try {
        // 1. Create User directly (simulating Admin API)
        console.log(`1. Creating user ${email}...`)
        const passwordHash = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                name: 'Verification User',
                email,
                passwordHash,
                role: 'USER',
            }
        })
        console.log('User created:', user.id)

        // 2. Validate Credentials (simulating Login API)
        console.log('2. Validating credentials...')
        const fetchedUser = await prisma.user.findUnique({ where: { email } })
        if (!fetchedUser) throw new Error('User not found')

        const isValid = await bcrypt.compare(password, fetchedUser.passwordHash)
        console.log(`Password valid: ${isValid}`)

        if (!isValid) {
            console.error('ERROR: Password validation failed for initial password')
        }

        // 3. Update Password (simulating Admin Edit API)
        console.log('3. Updating password...')
        const newPassword = 'NewPassword456!'
        const newPasswordHash = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash }
        })
        console.log('Password updated')

        // 4. Validate New Credentials
        console.log('4. Validating new credentials...')
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
        const isNewValid = await bcrypt.compare(newPassword, updatedUser!.passwordHash)
        console.log(`New password valid: ${isNewValid}`)

        const isOldValid = await bcrypt.compare(password, updatedUser!.passwordHash)
        console.log(`Old password invalid (expected false): ${isOldValid}`)

        if (!isNewValid) {
            console.error('ERROR: Password validation failed for new password')
        }

    } catch (error) {
        console.error('Verification failed:', error)
    } finally {
        // Cleanup
        console.log('Cleaning up...')
        try {
            await prisma.user.deleteMany({ where: { email: { startsWith: 'verify_test_' } } })
        } catch (e) {
            console.error('Cleanup failed', e)
        }
    }
}

main()
