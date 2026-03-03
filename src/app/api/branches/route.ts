import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// جلب الفروع
export async function GET() {
  try {
    const result = await query(`
      SELECT b.*,
        (SELECT COUNT(*) FROM "Warehouse" w WHERE w."branchId" = b.id) as "warehousesCount",
        (SELECT COUNT(*) FROM "User" u WHERE u."branchId" = b.id) as "usersCount"
      FROM "Branch" b
      ORDER BY b.name ASC
    `);
    
    return NextResponse.json({ branches: result.rows });
  } catch (error: any) {
    console.error('Get branches error:', error);
    return NextResponse.json({ branches: [], error: error.message }, { status: 500 });
  }
}

// إضافة فرع جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // توليد ID فريد
    const id = 'branch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const result = await query(
      `INSERT INTO "Branch" (id, name, address, phone, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [id, data.name, data.address || null, data.phone || null]
    );
    
    return NextResponse.json({ success: true, branch: result.rows[0] });
  } catch (error: any) {
    console.error('Create branch error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إضافة الفرع: ' + error.message },
      { status: 500 }
    );
  }
}

// تحديث فرع
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await query(
      `UPDATE "Branch" SET name = $2, address = $3, phone = $4, "updatedAt" = NOW()
       WHERE id = $1
       RETURNING *`,
      [data.id, data.name, data.address || null, data.phone || null]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'الفرع غير موجود' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, branch: result.rows[0] });
  } catch (error: any) {
    console.error('Update branch error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث الفرع: ' + error.message },
      { status: 500 }
    );
  }
}

// حذف فرع
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    // التحقق من وجود مخازن
    const warehousesResult = await query(
      'SELECT COUNT(*) as count FROM "Warehouse" WHERE "branchId" = $1',
      [id]
    );
    
    if (parseInt(warehousesResult.rows[0].count) > 0) {
      return NextResponse.json(
        { success: false, message: 'لا يمكن حذف فرع يحتوي على مخازن' },
        { status: 400 }
      );
    }
    
    const result = await query('DELETE FROM "Branch" WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'الفرع غير موجود' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete branch error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في حذف الفرع: ' + error.message },
      { status: 500 }
    );
  }
}
