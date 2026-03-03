import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const branchId = searchParams.get('branchId');

    const dateWhere: any = {};
    if (fromDate && toDate) {
      dateWhere.createdAt = {
        gte: new Date(fromDate),
        lte: new Date(toDate + 'T23:59:59')
      };
    }

    // Receipt vouchers (سندات قبض)
    const receiptVouchers = await prisma.paymentVoucher.findMany({
      where: {
        ...dateWhere,
        ...(branchId ? { branchId } : {})
      }
    });

    const received = receiptVouchers.reduce((sum, v) => sum + v.amount, 0);

    // Payment vouchers (سندات دفع)
    const paymentVouchers = await prisma.paymentDisbursement.findMany({
      where: {
        ...dateWhere,
        ...(branchId ? { branchId } : {})
      }
    });

    const paid = paymentVouchers.reduce((sum, v) => sum + v.amount, 0);

    return NextResponse.json({
      received,
      paid,
      receiptCount: receiptVouchers.length,
      paymentCount: paymentVouchers.length
    });
  } catch (error) {
    console.error('Get vouchers summary error:', error);
    return NextResponse.json({
      received: 0,
      paid: 0,
      receiptCount: 0,
      paymentCount: 0
    }, { status: 500 });
  }
}
