import { NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

export async function GET() {
  try {
    // إنشاء جدول الكوبونات إذا لم يكن موجوداً
    await query(`
      CREATE TABLE IF NOT EXISTS "FreeWashCoupon" (
        id TEXT PRIMARY KEY,
        "couponCode" TEXT UNIQUE,
        "customerName" TEXT,
        "carNumber" TEXT DEFAULT '',
        "carType" TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        "branchId" TEXT,
        "expiresAt" TIMESTAMP,
        used BOOLEAN DEFAULT false,
        "usedAt" TIMESTAMP,
        "customerId" TEXT,
        "invoiceId" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // التحقق من عدد الكوبونات
    const countResult = await query('SELECT COUNT(*) as count FROM "FreeWashCoupon"');

    return NextResponse.json({
      success: true,
      message: 'جدول الكوبونات جاهز',
      couponsCount: countResult.rows[0]?.count || 0
    });
  } catch (error: any) {
    console.error('Setup coupons error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
