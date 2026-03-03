import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// جلب الكوبونات
export async function GET() {
  try {
    // التأكد من وجود الجدول
    await query(`
      CREATE TABLE IF NOT EXISTS "FreeWashCoupon" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "couponCode" TEXT UNIQUE,
        "customerName" TEXT,
        "carNumber" TEXT DEFAULT '',
        "carType" TEXT DEFAULT '',
        "phone" TEXT DEFAULT '',
        "branchId" TEXT,
        "expiresAt" TIMESTAMP,
        "used" BOOLEAN DEFAULT false,
        "usedAt" TIMESTAMP,
        "customerId" TEXT,
        "invoiceId" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await query(`
      SELECT * FROM "FreeWashCoupon"
      ORDER BY "createdAt" DESC
    `);

    const coupons = result.rows.map(c => ({
      id: c.id,
      couponNumber: c.couponCode || c.id?.slice(-8)?.toUpperCase() || 'N/A',
      customerName: c.customerName || 'غير محدد',
      carNumber: c.carNumber || '',
      carType: c.carType || '',
      phone: c.phone || '',
      status: c.used ? 'used' : 'active',
      issuedAt: c.createdAt,
      usedAt: c.usedAt,
      expiryDate: c.expiresAt,
    }));

    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error('Get coupons error:', error);
    return NextResponse.json([]);
  }
}

// إضافة كوبون
export async function POST(request: NextRequest) {
  try {
    // التأكد من وجود الجدول
    await query(`
      CREATE TABLE IF NOT EXISTS "FreeWashCoupon" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "couponCode" TEXT UNIQUE,
        "customerName" TEXT,
        "carNumber" TEXT DEFAULT '',
        "carType" TEXT DEFAULT '',
        "phone" TEXT DEFAULT '',
        "branchId" TEXT,
        "expiresAt" TIMESTAMP,
        "used" BOOLEAN DEFAULT false,
        "usedAt" TIMESTAMP,
        "customerId" TEXT,
        "invoiceId" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    const data = await request.json();

    // التحقق من البيانات المطلوبة
    if (!data.customerName || !data.customerName.trim()) {
      return NextResponse.json(
        { error: 'اسم العميل مطلوب' },
        { status: 400 }
      );
    }

    // الحصول على عدد الكوبونات لإنشاء رقم جديد
    const countResult = await query('SELECT COUNT(*) as count FROM "FreeWashCoupon"');
    const count = parseInt(countResult.rows[0]?.count || '0') + 1;
    const couponCode = `FW-${String(count).padStart(6, '0')}`;
    
    // تاريخ الانتهاء - 23 ساعة من الآن
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);

    // إدخال الكوبون
    const result = await query(`
      INSERT INTO "FreeWashCoupon" (
        "couponCode", "customerName", "carNumber", "carType", "phone", 
        "expiresAt", "used", "createdBy", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW())
      RETURNING *
    `, [
      couponCode,
      data.customerName.trim(),
      data.carNumber || '-',
      data.carType || '',
      data.phone || '-',
      expiresAt,
      data.createdById || null
    ]);

    return NextResponse.json({ 
      success: true, 
      coupon: {
        id: result.rows[0]?.id,
        couponCode,
        customerName: data.customerName,
        carNumber: data.carNumber,
        carType: data.carType,
        phone: data.phone,
        expiresAt
      }
    });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الكوبون: ' + error.message },
      { status: 500 }
    );
  }
}
