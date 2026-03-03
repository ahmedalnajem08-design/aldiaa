import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db-pg';

// جلب قوائم الشراء
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supplierName = searchParams.get('supplierName');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const invoiceId = searchParams.get('id');
    
    if (invoiceId) {
      const invoiceResult = await query(
        `SELECT pi.*, w.name as "warehouseName", b.name as "branchName"
         FROM "PurchaseInvoice" pi
         LEFT JOIN "Warehouse" w ON pi."warehouseId" = w.id
         LEFT JOIN "Branch" b ON w."branchId" = b.id
         WHERE pi.id = $1`,
        [invoiceId]
      );
      
      if (invoiceResult.rows.length === 0) {
        return NextResponse.json({ invoice: null });
      }
      
      const invoice = invoiceResult.rows[0];
      
      const itemsResult = await query(
        `SELECT pi.*, m.name as "materialName"
         FROM "PurchaseItem" pi
         LEFT JOIN "Material" m ON pi."materialId" = m.id
         WHERE pi."invoiceId" = $1`,
        [invoiceId]
      );
      
      invoice.items = itemsResult.rows;
      
      return NextResponse.json({ invoice });
    }
    
    let sql = `
      SELECT pi.*, w.name as "warehouseName", b.name as "branchName", u.name as "userName"
      FROM "PurchaseInvoice" pi
      LEFT JOIN "Warehouse" w ON pi."warehouseId" = w.id
      LEFT JOIN "Branch" b ON w."branchId" = b.id
      LEFT JOIN "User" u ON pi."createdBy" = u.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (supplierName) {
      conditions.push(`pi."supplierName" ILIKE $${paramIndex}`);
      params.push(`%${supplierName}%`);
      paramIndex++;
    }
    
    if (fromDate && toDate) {
      conditions.push(`pi."createdAt" >= $${paramIndex} AND pi."createdAt" <= $${paramIndex + 1}`);
      params.push(fromDate);
      params.push(toDate + 'T23:59:59');
      paramIndex += 2;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY pi."createdAt" DESC LIMIT 200';
    
    const result = await query(sql, params);
    const invoices = result.rows;
    
    // جلب العناصر لكل فاتورة
    for (const invoice of invoices) {
      const itemsResult = await query(
        `SELECT pi.*, m.name as "materialName"
         FROM "PurchaseItem" pi
         LEFT JOIN "Material" m ON pi."materialId" = m.id
         WHERE pi."invoiceId" = $1`,
        [invoice.id]
      );
      invoice.items = itemsResult.rows;
    }
    
    const stats = {
      total: invoices.length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0)
    };
    
    return NextResponse.json({ invoices, stats });
  } catch (error: any) {
    console.error('Get purchases error:', error);
    return NextResponse.json({ invoices: [], stats: null, error: error.message }, { status: 500 });
  }
}

// إنشاء قائمة شراء جديدة
export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const data = await request.json();
    
    let subtotal = 0;
    const items = [];
    
    for (const item of data.items) {
      const total = item.quantity * item.price;
      subtotal += total;
      
      // التحقق من وجود المادة
      let materialResult = await client.query(
        'SELECT * FROM "Material" WHERE name = $1 LIMIT 1',
        [item.materialName]
      );
      
      let materialId;
      
      // إذا المادة غير موجودة، إنشاء مادة جديدة
      if (materialResult.rows.length === 0) {
        materialId = 'mat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        await client.query(
          `INSERT INTO "Material" (id, name, "purchasePrice", "salePrice", quantity, "warehouseId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            materialId, item.materialName, item.price,
            item.price * 1.15, item.quantity, data.warehouseId || null
          ]
        );
      } else {
        materialId = materialResult.rows[0].id;
        // تحديث الكمية والسعر
        await client.query(
          `UPDATE "Material" SET 
            quantity = quantity + $1, 
            "purchasePrice" = $2,
            "updatedAt" = NOW()
          WHERE id = $3`,
          [item.quantity, item.price, materialId]
        );
      }
      
      items.push({
        materialId,
        materialName: item.materialName,
        quantity: item.quantity,
        price: item.price,
        total,
        notes: item.notes || null
      });
    }
    
    const discount = data.discount || 0;
    const total = subtotal - discount;
    
    // توليد ID فريد
    const invoiceId = 'pur-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const invoiceNumber = 'PUR-' + Date.now();
    
    // إنشاء الفاتورة
    await client.query(
      `INSERT INTO "PurchaseInvoice" (
        id, "invoiceNumber", "supplierName", "warehouseId", subtotal, discount, total,
        notes, "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        invoiceId, invoiceNumber, data.supplierName || null, data.warehouseId || null,
        subtotal, discount, total, data.notes || null, data.createdBy || null
      ]
    );
    
    // إضافة العناصر
    for (const item of items) {
      const itemId = 'pitem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await client.query(
        `INSERT INTO "PurchaseItem" (
          id, "invoiceId", "materialId", "materialName", quantity, price, total, notes, "warehouseId", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          itemId, invoiceId, item.materialId, item.materialName,
          item.quantity, item.price, item.total, item.notes, data.warehouseId || null
        ]
      );
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true, invoice: { id: invoiceId, invoiceNumber, total } });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Create purchase error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إنشاء قائمة الشراء: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// حذف قائمة شراء
export async function DELETE(request: NextRequest) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = await request.json();
    
    // جلب العناصر
    const itemsResult = await client.query(
      'SELECT * FROM "PurchaseItem" WHERE "invoiceId" = $1',
      [id]
    );
    
    // خصم الكميات من المخزن
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE "Material" SET quantity = quantity - $1, "updatedAt" = NOW() WHERE id = $2`,
        [item.quantity, item.materialId]
      );
    }
    
    // حذف العناصر
    await client.query('DELETE FROM "PurchaseItem" WHERE "invoiceId" = $1', [id]);
    
    // حذف الفاتورة
    const result = await client.query('DELETE FROM "PurchaseInvoice" WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: 'قائمة الشراء غير موجودة' },
        { status: 404 }
      );
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Delete purchase error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في حذف قائمة الشراء: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
