// Back-end/create-user.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Hasheando contraseña...');

    // ✅ CORRECTO: Hashear la contraseña
    const hashedPassword = await bcrypt.hash('Admin123', 10);

    console.log('📝 Contraseña hasheada:', hashedPassword);
    console.log('📝 Longitud del hash:', hashedPassword.length);

    const user = await prisma.login.upsert({
        where: { username: 'Admin' },
        update: {
            password: hashedPassword  // ✅ Usar el hash
        },
        create: {
            username: 'Admin',
            password: hashedPassword,  // ✅ Usar el hash
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@sdgku.edu',
            role: 'Super Admin',
            status: 'Active'
        }
    });

    console.log('✅ Usuario creado/actualizado:', {
        id: user.id,
        username: user.username,
        passwordHash: user.password.substring(0, 20) + '...', // Solo mostrar inicio del hash
        firstName: user.firstName,
        email: user.email
    });
}

main()
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());