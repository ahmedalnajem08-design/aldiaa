import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// تعطيل prepared statements للعمل مع Supabase Pooler
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper function to execute queries with retry for connection issues
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (retries > 0 && (
      error.code === 'P1001' ||
      error.code === 'P1002' ||
      error.message?.includes('prepared statement') ||
      error.message?.includes('Connection')
    )) {
      console.log(`Retrying database operation... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return withRetry(fn, retries - 1)
    }
    throw error
  }
}

export default db
