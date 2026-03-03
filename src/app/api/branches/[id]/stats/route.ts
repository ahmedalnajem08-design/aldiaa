import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date();
    
    if (!start) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get warehouses for this branch
    const warehouses = await db.warehouse.findMany({
      where: { branchId },
      select: { id: true }
    });
    const warehouseIds = warehouses.map(w => w.id);

    // Cash Sales (status = 'cash')
    const cashSales = await db.saleInvoice.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'cash'
      },
      _sum: { total: true }
    });

    // Credit Sales (status = 'credit' or 'partial')
    const creditSales = await db.saleInvoice.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['credit', 'partial'] }
      },
      _sum: { total: true }
    });

    // Cash Purchases
    const cashPurchases = await db.purchaseInvoice.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'cash'
      },
      _sum: { total: true }
    });

    // Credit Purchases
    const creditPurchases = await db.purchaseInvoice.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['credit', 'partial'] }
      },
      _sum: { total: true }
    });

    // Expenses
    const expenses = await db.expense.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        branchId
      },
      _sum: { amount: true }
    });

    // Receipts (سندات قبض)
    const receipts = await db.paymentVoucher.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        customerId: { not: null }
      },
      _sum: { amount: true }
    });

    // Payments (سندات دفع)
    const payments = await db.paymentDisbursement.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    });

    const cashSalesTotal = cashSales._sum.total || 0;
    const creditSalesTotal = creditSales._sum.total || 0;
    const cashPurchasesTotal = cashPurchases._sum.total || 0;
    const creditPurchasesTotal = creditPurchases._sum.total || 0;
    const expensesTotal = expenses._sum.amount || 0;
    const receiptsTotal = receipts._sum.amount || 0;
    const paymentsTotal = payments._sum.amount || 0;

    const net = cashSalesTotal + receiptsTotal - cashPurchasesTotal - expensesTotal - paymentsTotal;

    return NextResponse.json({
      stats: {
        cashSales: cashSalesTotal,
        creditSales: creditSalesTotal,
        cashPurchases: cashPurchasesTotal,
        creditPurchases: creditPurchasesTotal,
        expenses: expensesTotal,
        receipts: receiptsTotal,
        payments: paymentsTotal,
        net
      }
    });
  } catch (error) {
    console.error('Error fetching branch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
