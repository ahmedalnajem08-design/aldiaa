import { Pool } from 'pg';

// إنشاء pool للاتصال بقاعدة البيانات
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// دالة لتنفيذ الاستعلامات بأمان
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// دالة للحصول على صف واحد
export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// دالة للحصول على صفوف متعددة
export async function queryMany(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

// دالة للإدراج
export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.map(k => `"${k}"`).join(', ');

  const text = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`;
  return queryOne(text, values);
}

// دالة للتحديث
export async function update(table: string, id: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');

  const text = `UPDATE "${table}" SET ${setClause}, "updatedAt" = NOW() WHERE id = $${keys.length + 1} RETURNING *`;
  return queryOne(text, [...values, id]);
}

// دالة للحذف
export async function remove(table: string, id: string) {
  const text = `DELETE FROM "${table}" WHERE id = $1 RETURNING id`;
  return queryOne(text, [id]);
}

// دالة لإنشاء ID فريد
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
