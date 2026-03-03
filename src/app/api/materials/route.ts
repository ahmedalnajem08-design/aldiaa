import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// جلب المواد
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const warehouseId = searchParams.get('warehouseId');
    const id = searchParams.get('id');
    
    // إذا كان هناك id، اجلب مادة واحدة
    if (id) {
      const result = await query(
        `SELECT m.*, w.name as "warehouseName", b.name as "branchName", c.name as "categoryName"
         FROM "Material" m
         LEFT JOIN "Warehouse" w ON m."warehouseId" = w.id
         LEFT JOIN "Branch" b ON w."branchId" = b.id
         LEFT JOIN "Category" c ON m."categoryId" = c.id
         WHERE m.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, message: 'المادة غير موجودة' }, { status: 404 });
      }
      
      return NextResponse.json({ material: result.rows[0] });
    }
    
    let sql = `
      SELECT m.*, w.name as "warehouseName", b.name as "branchName", c.name as "categoryName"
      FROM "Material" m
      LEFT JOIN "Warehouse" w ON m."warehouseId" = w.id
      LEFT JOIN "Branch" b ON w."branchId" = b.id
      LEFT JOIN "Category" c ON m."categoryId" = c.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      conditions.push(`(m.name ILIKE $${paramIndex} OR m.code ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (warehouseId) {
      conditions.push(`m."warehouseId" = $${paramIndex}`);
      params.push(warehouseId);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY m.name ASC LIMIT 500';
    
    const result = await query(sql, params);
    
    return NextResponse.json({ materials: result.rows });
  } catch (error: any) {
    console.error('Get materials error:', error);
    return NextResponse.json({ materials: [], error: error.message }, { status: 500 });
  }
}

// إضافة مادة جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // توليد ID فريد
    const id = 'mat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const result = await query(
      `INSERT INTO "Material" (
        id, name, code, unit, "baseUnit", "fillingType",
        "level1Name", "level1Quantity", "level1SalePrice",
        "level2Name", "level2Quantity", "level2SalePrice",
        "level3Name", "level3Quantity", "level3SalePrice",
        "purchasePrice", "salePrice", quantity, "minQuantity",
        "warehouseId", "categoryId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
      RETURNING *`,
      [
        id,
        data.name,
        data.code || null,
        data.unit || 'قطعة',
        data.baseUnit || data.unit || 'قطعة',
        data.fillingType || 'single',
        data.level1Name || null,
        data.level1Quantity ? parseFloat(data.level1Quantity) : null,
        data.level1SalePrice ? parseFloat(data.level1SalePrice) : null,
        data.level2Name || null,
        data.level2Quantity ? parseFloat(data.level2Quantity) : null,
        data.level2SalePrice ? parseFloat(data.level2SalePrice) : null,
        data.level3Name || null,
        data.level3Quantity ? parseFloat(data.level3Quantity) : null,
        data.level3SalePrice ? parseFloat(data.level3SalePrice) : null,
        parseFloat(data.purchasePrice) || 0,
        parseFloat(data.salePrice) || 0,
        parseFloat(data.quantity) || 0,
        parseFloat(data.minQuantity) || 0,
        data.warehouseId || null,
        data.categoryId || null
      ]
    );
    
    return NextResponse.json({ success: true, material: result.rows[0] });
  } catch (error: any) {
    console.error('Create material error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إضافة المادة: ' + error.message },
      { status: 500 }
    );
  }
}

// تحديث مادة
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await query(
      `UPDATE "Material" SET
        name = $2, code = $3, unit = $4, "baseUnit" = $5, "fillingType" = $6,
        "level1Name" = $7, "level1Quantity" = $8, "level1SalePrice" = $9,
        "level2Name" = $10, "level2Quantity" = $11, "level2SalePrice" = $12,
        "level3Name" = $13, "level3Quantity" = $14, "level3SalePrice" = $15,
        "purchasePrice" = $16, "salePrice" = $17, quantity = $18, "minQuantity" = $19,
        "warehouseId" = $20, "categoryId" = $21, "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        data.id,
        data.name,
        data.code || null,
        data.unit,
        data.baseUnit || data.unit,
        data.fillingType || 'single',
        data.level1Name || null,
        data.level1Quantity ? parseFloat(data.level1Quantity) : null,
        data.level1SalePrice ? parseFloat(data.level1SalePrice) : null,
        data.level2Name || null,
        data.level2Quantity ? parseFloat(data.level2Quantity) : null,
        data.level2SalePrice ? parseFloat(data.level2SalePrice) : null,
        data.level3Name || null,
        data.level3Quantity ? parseFloat(data.level3Quantity) : null,
        data.level3SalePrice ? parseFloat(data.level3SalePrice) : null,
        parseFloat(data.purchasePrice) || 0,
        parseFloat(data.salePrice) || 0,
        parseFloat(data.quantity) || 0,
        parseFloat(data.minQuantity) || 0,
        data.warehouseId || null,
        data.categoryId || null
      ]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'المادة غير موجودة' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, material: result.rows[0] });
  } catch (error: any) {
    console.error('Update material error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث المادة: ' + error.message },
      { status: 500 }
    );
  }
}

// حذف مادة
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    const result = await query('DELETE FROM "Material" WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'المادة غير موجودة' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete material error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في حذف المادة: ' + error.message },
      { status: 500 }
    );
  }
}
