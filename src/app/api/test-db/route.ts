import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    // اختبار الاتصال
    const testResult = await pool.query('SELECT NOW()');

    // جلب المستخدمين
    const usersResult = await pool.query('SELECT id, name, phone, role FROM "User"');

    // جلب المواد
    const materialsResult = await pool.query('SELECT id, name, quantity FROM "Material" LIMIT 5');

    return NextResponse.json({
      success: true,
      connection: 'OK',
      time: testResult.rows[0].now,
      usersCount: usersResult.rowCount,
      users: usersResult.rows,
      materialsCount: materialsResult.rowCount,
      materials: materialsResult.rows
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      env: {
        hasDirectUrl: !!process.env.DIRECT_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
