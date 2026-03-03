import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'

// جلب إحصائيات الداشبورد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    // تاريخ اليوم
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // تاريخ بداية الشهر
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // إحصائيات قوائم البيع اليوم
    const salesTodayResult = await query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total, COALESCE(SUM(paid), 0) as paid
      FROM "SaleInvoice"
      WHERE "createdAt" >= $1
    `, [today.toISOString()])

    // إحصائيات قوائم البيع الشهر
    const salesMonthResult = await query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM "SaleInvoice"
      WHERE "createdAt" >= $1
    `, [monthStart.toISOString()])

    // عدد السيارات اليوم
    const carsTodayResult = await query(`
      SELECT COUNT(*) as count
      FROM "SaleInvoice"
      WHERE "createdAt" >= $1 AND "customerId" IS NOT NULL
    `, [today.toISOString()])

    // إحصائيات المشتريات
    const purchasesTodayResult = await query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM "PurchaseInvoice"
      WHERE "createdAt" >= $1
    `, [today.toISOString()])

    const purchasesMonthResult = await query(`
      SELECT COUNT(*) as count
      FROM "PurchaseInvoice"
      WHERE "createdAt" >= $1
    `, [monthStart.toISOString()])

    // عدد المواد
    const materialsCountResult = await query(`
      SELECT COUNT(*) as count FROM "Material"
    `)

    // عدد الزبائن
    const customersCountResult = await query(`
      SELECT COUNT(*) as count FROM "Customer"
    `)

    // إجمالي المخزون
    const totalInventoryResult = await query(`
      SELECT COALESCE(SUM(quantity), 0) as total FROM "Material"
    `)

    // السندات المالية
    const vouchersTodayResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM "PaymentVoucher"
      WHERE "createdAt" >= $1
    `, [today.toISOString()])

    const disbursementsTodayResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM "PaymentDisbursement"
      WHERE "createdAt" >= $1
    `, [today.toISOString()])

    // آخر 7 أيام من المبيعات
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const daySalesResult = await query(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
        FROM "SaleInvoice"
        WHERE "createdAt" >= $1 AND "createdAt" < $2
      `, [date.toISOString(), nextDate.toISOString()])

      last7Days.push({
        date: date.toISOString().split('T')[0],
        total: parseFloat(daySalesResult.rows[0].total) || 0,
        count: parseInt(daySalesResult.rows[0].count) || 0
      })
    }

    // المواد الأكثر مبيعاً
    const topMaterialsResult = await query(`
      SELECT si."materialId", m.name as "materialName", 
        SUM(si.quantity) as "totalQuantity", COUNT(*) as count
      FROM "SaleItem" si
      LEFT JOIN "Material" m ON si."materialId" = m.id
      LEFT JOIN "SaleInvoice" inv ON si."invoiceId" = inv.id
      WHERE inv."createdAt" >= $1
      GROUP BY si."materialId", m.name
      ORDER BY SUM(si.quantity) DESC
      LIMIT 5
    `, [monthStart.toISOString()])

    return NextResponse.json({
      sales: {
        today: parseInt(salesTodayResult.rows[0].count) || 0,
        month: parseInt(salesMonthResult.rows[0].count) || 0,
        todayTotal: parseFloat(salesTodayResult.rows[0].total) || 0,
        monthTotal: parseFloat(salesMonthResult.rows[0].total) || 0,
        todayPaid: parseFloat(salesTodayResult.rows[0].paid) || 0
      },
      purchases: {
        today: parseInt(purchasesTodayResult.rows[0].count) || 0,
        month: parseInt(purchasesMonthResult.rows[0].count) || 0,
        todayTotal: parseFloat(purchasesTodayResult.rows[0].total) || 0
      },
      cars: {
        today: parseInt(carsTodayResult.rows[0].count) || 0
      },
      inventory: {
        materialsCount: parseInt(materialsCountResult.rows[0].count) || 0,
        totalQuantity: parseFloat(totalInventoryResult.rows[0].total) || 0
      },
      customers: {
        count: parseInt(customersCountResult.rows[0].count) || 0
      },
      payments: {
        vouchersToday: parseFloat(vouchersTodayResult.rows[0].total) || 0,
        disbursementsToday: parseFloat(disbursementsTodayResult.rows[0].total) || 0
      },
      charts: {
        last7Days,
        topMaterials: topMaterialsResult.rows.map(m => ({
          materialId: m.materialId,
          materialName: m.materialName,
          totalQuantity: parseFloat(m.totalQuantity) || 0,
          count: parseInt(m.count) || 0
        }))
      }
    })
  } catch (error: any) {
    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات: ' + error.message },
      { status: 500 }
    )
  }
}
