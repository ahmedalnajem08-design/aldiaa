import { Pool } from 'pg';

// إنشاء pool للاتصال بقاعدة البيانات
const globalForPool = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool = globalForPool.pool ?? new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  // إعدادات للعمل مع Supabase
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

// Helper function لتنفيذ الاستعلامات
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper function للحصول على client
export async function getClient() {
  return pool.connect();
}

export default pool;
