import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// جلب المخازن
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    
    let sql = `
      SELECT w.*, b.name as "branchName",
        (SELECT COUNT(*) FROM "Material" m WHERE m."warehouseId" = w.id) as "materialsCount"
      FROM "Warehouse" w
      LEFT JOIN "Branch" b ON w."branchId" = b.id
    `;
    
    const params: any[] = [];
    
    if (branchId) {
      sql += ' WHERE w."branchId" = $1';
      params.push(branchId);
    }
    
    sql += ' ORDER BY w.name ASC';
    
    const result = await query(sql, params);
    
    return NextResponse.json({ warehouses: result.rows });
  } catch (error: any) {
    console.error('Get warehouses error:', error);
    return NextResponse.json({ warehouses: [], error: error.message }, { status: 500 });
  }
}

// إضافة مخزن جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // توليد ID فريد
    const id = 'wh-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const result = await query(
      `INSERT INTO "Warehouse" (id, name, "branchId", "isDefault", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [id, data.name, data.branchId, data.isDefault || false]
    );
    
    // جلب اسم الفرع
    const warehouse = result.rows[0];
    const branchResult = await query('SELECT name FROM "Branch" WHERE id = $1', [data.branchId]);
    warehouse.branchName = branchResult.rows[0]?.name || null;
    
    return NextResponse.json({ success: true, warehouse });
  } catch (error: any) {
    console.error('Create warehouse error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إضافة المخزن: ' + error.message },
      { status: 500 }
    );
  }
}

// تحديث مخزن
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await query(
      `UPDATE "Warehouse" SET name = $2, "branchId" = $3, "isDefault" = $4, "updatedAt" = NOW()
       WHERE id = $1
       RETURNING *`,
      [data.id, data.name, data.branchId, data.isDefault || false]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'المخزن غير موجود' }, { status: 404 });
    }
    
    // جلب اسم الفرع
    const warehouse = result.rows[0];
    const branchResult = await query('SELECT name FROM "Branch" WHERE id = $1', [data.branchId]);
    warehouse.branchName = branchResult.rows[0]?.name || null;
    
    return NextResponse.json({ success: true, warehouse });
  } catch (error: any) {
    console.error('Update warehouse error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث المخزن: ' + error.message },
      { status: 500 }
    );
  }
}

// حذف مخزن
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    // التحقق من وجود مواد في المخزن
    const materialsResult = await query(
      'SELECT COUNT(*) as count FROM "Material" WHERE "warehouseId" = $1',
      [id]
    );
    
    if (parseInt(materialsResult.rows[0].count) > 0) {
      return NextResponse.json(
        { success: false, message: 'لا يمكن حذف مخزن يحتوي على مواد' },
        { status: 400 }
      );
    }
    
    const result = await query('DELETE FROM "Warehouse" WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'المخزن غير موجود' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete warehouse error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في حذف المخزن: ' + error.message },
      { status: 500 }
    );
  }
}
