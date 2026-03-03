import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const getPool = () => new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

// تسجيل الدخول
export async function POST(request: NextRequest) {
  const pool = getPool();

  try {
    const { userId, password } = await request.json();

    console.log('Login attempt:', { userId });

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: 'معرف المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم
    const result = await pool.query(
      'SELECT * FROM "User" WHERE id = $1 OR name = $1 OR phone = $1',
      [userId]
    );

    const user = result.rows[0];

    console.log('Found user:', user ? { id: user.id, name: user.name } : 'Not found');

    if (!user) {
      await pool.end();
      return NextResponse.json(
        { success: false, message: 'المستخدم غير موجود' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    let isValidPassword = false;

    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (e) {
      // مقارنة نصية
      isValidPassword = password === user.password;
    }

    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      await pool.end();
      return NextResponse.json(
        { success: false, message: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // جلب الصلاحيات
    const permResult = await pool.query(
      'SELECT * FROM "Permission" WHERE "userId" = $1',
      [user.id]
    );

    const permissions = permResult.rows[0] || {};

    await pool.end();

    // إرجاع بيانات المستخدم
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
        permissions: permissions
      }
    });
  } catch (error: any) {
    await pool.end();
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ: ' + error.message },
      { status: 500 }
    );
  }
}

// جلب المستخدمين
export async function GET() {
  const pool = getPool();

  try {
    const result = await pool.query(
      'SELECT id, name, phone, role, "branchId" FROM "User" ORDER BY name'
    );

    await pool.end();
    return NextResponse.json({ users: result.rows });
  } catch (error: any) {
    await pool.end();
    console.error('Get users error:', error);
    return NextResponse.json({ users: [] });
  }
}
