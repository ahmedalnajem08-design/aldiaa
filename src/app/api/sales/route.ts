import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db-pg';

// جلب قوائم البيع
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const days = parseInt(searchParams.get('days') || '0');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const invoiceId = searchParams.get('id');
    
    // إذا كان البحث عن قائمة محددة
    if (invoiceId) {
      const invoiceResult = await query(
        `SELECT si.*, c.name as "customerName", c.phone as "customerPhone"
         FROM "SaleInvoice" si
         LEFT JOIN "Customer" c ON si."customerId" = c.id
         WHERE si.id = $1`,
        [invoiceId]
      );
      
      if (invoiceResult.rows.length === 0) {
        return NextResponse.json({ invoice: null });
      }
      
      const invoice = invoiceResult.rows[0];
      
      // جلب العناصر
      const itemsResult = await query(
        `SELECT si.*, m.name as "materialName"
         FROM "SaleItem" si
         LEFT JOIN "Material" m ON si."materialId" = m.id
         WHERE si."invoiceId" = $1`,
        [invoiceId]
      );
      
      invoice.items = itemsResult.rows;
      
      return NextResponse.json({ invoice });
    }
    
    // بناء الاستعلام
    let sql = `
      SELECT si.*, c.name as "customerName", c.phone as "customerPhone"
      FROM "SaleInvoice" si
      LEFT JOIN "Customer" c ON si."customerId" = c.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    // فلترة بالزبون
    if (customerId) {
      conditions.push(`si."customerId" = $${paramIndex}`);
      params.push(customerId);
      paramIndex++;
    }
    
    // فلترة بالتاريخ
    if (fromDate && toDate) {
      conditions.push(`si."createdAt" >= $${paramIndex} AND si."createdAt" <= $${paramIndex + 1}`);
      params.push(fromDate);
      params.push(toDate + 'T23:59:59');
      paramIndex += 2;
    } else if (days >= 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days);
      conditions.push(`si."createdAt" >= $${paramIndex}`);
      params.push(startDate.toISOString());
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY si."createdAt" DESC LIMIT 200';
    
    const result = await query(sql, params);
    const invoices = result.rows;
    
    // جلب العناصر لكل فاتورة
    for (const invoice of invoices) {
      const itemsResult = await query(
        `SELECT si.*, m.name as "materialName"
         FROM "SaleItem" si
         LEFT JOIN "Material" m ON si."materialId" = m.id
         WHERE si."invoiceId" = $1`,
        [invoice.id]
      );
      invoice.items = itemsResult.rows;
    }
    
    // حساب الإحصائيات
    const stats = {
      total: invoices.length,
      totalCash: invoices.filter(i => i.status === 'cash').reduce((sum, i) => sum + (i.total || 0), 0),
      totalCredit: invoices.filter(i => i.status === 'credit').reduce((sum, i) => sum + (i.total || 0), 0),
      totalPartial: invoices.filter(i => i.status === 'partial').reduce((sum, i) => sum + (i.total || 0), 0),
      countCash: invoices.filter(i => i.status === 'cash').length,
      countCredit: invoices.filter(i => i.status === 'credit').length,
      countPartial: invoices.filter(i => i.status === 'partial').length
    };
    
    return NextResponse.json({ invoices, stats });
  } catch (error: any) {
    console.error('Get sales error:', error);
    return NextResponse.json({ invoices: [], stats: null, error: error.message }, { status: 500 });
  }
}

// إنشاء قائمة بيع جديدة
export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const data = await request.json();
    
    // حساب المجاميع
    let subtotal = 0;
    const items = data.items.map((item: any) => {
      const total = item.quantity * item.price;
      subtotal += total;
      return {
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: item.quantity,
        price: item.price,
        total,
        filling: item.filling || null,
        notes: item.notes || null,
        warehouseId: item.warehouseId || null
      };
    });
    
    const discount = data.discount || 0;
    const total = subtotal - discount;
    
    // توليد ID فريد
    const invoiceId = 'sale-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const invoiceNumber = 'INV-' + Date.now();
    
    // إنشاء القائمة
    await client.query(
      `INSERT INTO "SaleInvoice" (
        id, "invoiceNumber", "customerId", "warehouseId", subtotal, discount, total, paid, status,
        odometer, notes, "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        invoiceId, invoiceNumber, data.customerId || null, data.warehouseId || null,
        subtotal, discount, total, data.paid || total, data.status || 'cash',
        data.odometer || null, data.notes || null, data.createdBy || null
      ]
    );
    
    // إضافة العناصر
    for (const item of items) {
      const itemId = 'sitem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await client.query(
        `INSERT INTO "SaleItem" (
          id, "invoiceId", "materialId", "materialName", quantity, price, total, filling, notes, "warehouseId", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          itemId, invoiceId, item.materialId, item.materialName,
          item.quantity, item.price, item.total, item.filling, item.notes, item.warehouseId
        ]
      );
      
      // تحديث كمية المادة
      await client.query(
        `UPDATE "Material" SET quantity = quantity - $1, "updatedAt" = NOW() WHERE id = $2`,
        [item.quantity, item.materialId]
      );
    }
    
    // تحديث عداد الزبون
    if (data.customerId && data.odometer) {
      const customerResult = await client.query('SELECT odometer FROM "Customer" WHERE id = $1', [data.customerId]);
      if (customerResult.rows.length > 0) {
        const oldOdometer = customerResult.rows[0].odometer;
        await client.query(
          `UPDATE "Customer" SET odometer = $1, "lastOdometer" = $2, "updatedAt" = NOW() WHERE id = $3`,
          [data.odometer, oldOdometer || data.odometer, data.customerId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true, invoice: { id: invoiceId, invoiceNumber, total } });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Create sale error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إنشاء قائمة البيع: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// تحديث قائمة بيع
export async function PUT(request: NextRequest) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const data = await request.json();
    
    // جلب القائمة القديمة
    const oldInvoiceResult = await client.query(
      'SELECT * FROM "SaleInvoice" WHERE id = $1',
      [data.id]
    );
    
    if (oldInvoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: 'قائمة البيع غير موجودة' },
        { status: 404 }
      );
    }
    
    // جلب العناصر القديمة
    const oldItemsResult = await client.query(
      'SELECT * FROM "SaleItem" WHERE "invoiceId" = $1',
      [data.id]
    );
    
    // إعادة الكميات القديمة للمخزن
    for (const item of oldItemsResult.rows) {
      await client.query(
        `UPDATE "Material" SET quantity = quantity + $1, "updatedAt" = NOW() WHERE id = $2`,
        [item.quantity, item.materialId]
      );
    }
    
    // حذف العناصر القديمة
    await client.query('DELETE FROM "SaleItem" WHERE "invoiceId" = $1', [data.id]);
    
    // حساب المجاميع الجديدة
    let subtotal = 0;
    const items = data.items.map((item: any) => {
      const total = item.quantity * item.price;
      subtotal += total;
      return {
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: item.quantity,
        price: item.price,
        total,
        filling: item.filling || null,
        notes: item.notes || null,
        warehouseId: item.warehouseId || null
      };
    });
    
    const discount = data.discount || 0;
    const total = subtotal - discount;
    
    // تحديث القائمة
    await client.query(
      `UPDATE "SaleInvoice" SET
        "customerId" = $2, "warehouseId" = $3, subtotal = $4, discount = $5, total = $6,
        paid = $7, status = $8, odometer = $9, notes = $10, "editedCount" = "editedCount" + 1,
        "isEdited" = true, "editedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = $1`,
      [
        data.id, data.customerId || null, data.warehouseId || null,
        subtotal, discount, total, data.paid || total, data.status || 'cash',
        data.odometer || null, data.notes || null
      ]
    );
    
    // إضافة العناصر الجديدة وخصم الكميات
    for (const item of items) {
      const itemId = 'sitem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await client.query(
        `INSERT INTO "SaleItem" (
          id, "invoiceId", "materialId", "materialName", quantity, price, total, filling, notes, "warehouseId", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          itemId, data.id, item.materialId, item.materialName,
          item.quantity, item.price, item.total, item.filling, item.notes, item.warehouseId
        ]
      );
      
      // خصم الكمية من المخزن
      await client.query(
        `UPDATE "Material" SET quantity = quantity - $1, "updatedAt" = NOW() WHERE id = $2`,
        [item.quantity, item.materialId]
      );
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true, invoice: { id: data.id } });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Update sale error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث قائمة البيع: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// حذف قائمة بيع
export async function DELETE(request: NextRequest) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = await request.json();
    
    // جلب العناصر
    const itemsResult = await client.query(
      'SELECT * FROM "SaleItem" WHERE "invoiceId" = $1',
      [id]
    );
    
    // إعادة الكميات للمخزن
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE "Material" SET quantity = quantity + $1, "updatedAt" = NOW() WHERE id = $2`,
        [item.quantity, item.materialId]
      );
    }
    
    // حذف العناصر
    await client.query('DELETE FROM "SaleItem" WHERE "invoiceId" = $1', [id]);
    
    // حذف القائمة
    const result = await client.query('DELETE FROM "SaleInvoice" WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: 'قائمة البيع غير موجودة' },
        { status: 404 }
      );
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Delete sale error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في حذف قائمة البيع: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
