// Back-end/src/auth/constants.ts

// Validar que JWT_SECRET exista
if (!process.env.JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET no está configurado en .env');
}

// Asegurar tipo string (no string | undefined)
const JWT_SECRET: string = process.env.JWT_SECRET;

const isDevelopment = process.env.NODE_ENV === 'development';

export const jwtConstants = {
    secret: JWT_SECRET,
    expiresIn: isDevelopment ? '24h' : '8h'
} as const;