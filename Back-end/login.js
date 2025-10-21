import { PrismaClient } from './generated/prisma/index.js'
const prisma = new PrismaClient();

async function login(username, password) {
  const user = await prisma.login.findUnique({
    where: { username }
  });

  if (!user) {
    console.log('❌ Usuario no encontrado');
    return false;
  }

  if (user.password !== password) {
    console.log('❌ Contraseña incorrecta');
    return false;
  }

  console.log('✅ Inicio de sesión exitoso');
  return true;
}

// Ejemplo de uso:
login('admin', '12345')
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('Error en el login:', err);
    prisma.$disconnect();
  });
