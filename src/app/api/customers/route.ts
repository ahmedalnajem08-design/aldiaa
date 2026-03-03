import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// جلب جميع الزبائن أو البحث
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const phone = searchParams.get('phone');
    const carNumber = searchParams.get('carNumber');
    
    let sql = 'SELECT * FROM "Customer"';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR "carNumber" ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (phone) {
      conditions.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }
    
    if (carNumber) {
      conditions.push(`"carNumber" = $${paramIndex}`);
      params.push(carNumber);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY name ASC LIMIT 50';
    
    const result = await query(sql, params);
    
    return NextResponse.json({ customers: result.rows });
  } catch (error: any) {
    console.error('Get customers error:', error);
    return NextResponse.json({ customers: [], error: error.message }, { status: 500 });
  }
}

// إضافة زبون جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // توليد ID فريد
    const id = 'cust-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const result = await query(
      `INSERT INTO "Customer" (id, name, phone, address, "carNumber", "carType", odometer, type, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        id,
        data.name,
        data.phone || null,
        data.address || null,
        data.carNumber || null,
        data.carType || null,
        data.odometer || null,
        data.type || 'customer'
      ]
    );
    
    return NextResponse.json({ success: true, customer: result.rows[0] });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إضافة الزبون: ' + error.message },
      { status: 500 }
    );
  }
}

// تحديث زبون
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await query(
      `UPDATE "Customer" SET
        name = $2, phone = $3, address = $4, "carNumber" = $5, "carType" = $6, 
        odometer = $7, "lastOdometer" = $8, "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        data.id,
        data.name,
        data.phone || null,
        data.address || null,
        data.carNumber || null,
        data.carType || null,
        data.odometer || null,
        data.lastOdometer || null
      ]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'الزبون غير موجود' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, customer: result.rows[0] });
  } catch (error: any) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث الزبون: ' + error.message },
      { status: 500 }
    );
  }
}
