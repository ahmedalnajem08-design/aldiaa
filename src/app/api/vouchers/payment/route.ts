import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// حفظ سند دفع
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const voucher = await db.paymentDisbursement.create({
      data: {
        id: `payment-${Date.now()}`,
        voucherNumber: data.voucherNumber,
        supplierId: data.supplierId || null,
        customerId: data.customerId || null,
        userId: data.userId || null,
        payeeType: data.payeeType || 'supplier',
        employeePaymentType: data.employeePaymentType || null,
        amount: data.amount,
        paymentMethod: data.paymentMethod || 'cash',
        notes: data.notes,
        createdById: data.createdById,
        status: 'completed'
      }
    });

    // تحديث رصيد المورد
    if (data.supplierId && data.payeeType === 'supplier') {
      const supplier = await db.customer.findUnique({
        where: { id: data.supplierId }
      });

      if (supplier) {
        await db.customer.update({
          where: { id: data.supplierId },
          data: {
            balance: { decrement: data.amount }
          }
        });
      }
    }

    // تحديث رصيد الزبون (إذا كان سند دفع لزبون - مثلاً إرجاع مبلغ)
    if (data.customerId && data.payeeType === 'customer') {
      const customer = await db.customer.findUnique({
        where: { id: data.customerId }
      });

      if (customer) {
        await db.customer.update({
          where: { id: data.customerId },
          data: {
            balance: { increment: data.amount }
          }
        });
      }
    }

    return NextResponse.json({ success: true, voucher });
  } catch (error) {
    console.error('Save payment voucher error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حفظ سند الدفع' },
      { status: 500 }
    );
  }
}

// جلب سندات الدفع
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const branchId = searchParams.get('branchId');

    const where: any = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const vouchers = await db.paymentDisbursement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate total
    const total = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);

    return NextResponse.json({
      vouchers,
      total
    });
  } catch (error) {
    console.error('Fetch payment vouchers error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السندات' },
      { status: 500 }
    );
  }
}
