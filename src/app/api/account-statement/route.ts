import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'customer' | 'supplier' | 'employee';
    const id = searchParams.get('id');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!type || !id) {
      return NextResponse.json({ error: 'نوع الحساب والمعرف مطلوبان' }, { status: 400 });
    }

    const transactions: any[] = [];
    let openingBalance = 0;

    // Calculate opening balance (balance before fromDate)
    if (type === 'customer') {
      // Sales before fromDate
      const salesBefore = await db.saleInvoice.findMany({
        where: {
          customerId: id,
          date: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { total: true, paid: true }
      });

      // Receipt vouchers before fromDate
      const receiptsBefore = await db.paymentVoucher.findMany({
        where: {
          customerId: id,
          createdAt: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { amount: true }
      });

      // Payment vouchers before fromDate
      const paymentsBefore = await db.paymentDisbursement.findMany({
        where: {
          customerId: id,
          createdAt: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { amount: true }
      });

      // Calculate opening balance for customer
      const salesTotal = salesBefore.reduce((sum, s) => sum + (s.total || 0), 0);
      const salesPaid = salesBefore.reduce((sum, s) => sum + (s.paid || 0), 0);
      const receiptsTotal = receiptsBefore.reduce((sum, r) => sum + (r.amount || 0), 0);
      const paymentsTotal = paymentsBefore.reduce((sum, p) => sum + (p.amount || 0), 0);

      openingBalance = (salesTotal - salesPaid) - receiptsTotal + paymentsTotal;
    } else if (type === 'supplier') {
      // Supplier
      // Purchases before fromDate
      const purchasesBefore = await db.purchaseInvoice.findMany({
        where: {
          supplierId: id,
          date: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { total: true, paid: true }
      });

      // Payment vouchers before fromDate
      const paymentsBefore = await db.paymentDisbursement.findMany({
        where: {
          supplierId: id,
          createdAt: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { amount: true }
      });

      // Receipt vouchers before fromDate
      const receiptsBefore = await db.paymentVoucher.findMany({
        where: {
          customerId: id,
          payerType: 'supplier',
          createdAt: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { amount: true }
      });

      // Calculate opening balance for supplier
      const purchasesTotal = purchasesBefore.reduce((sum, p) => sum + (p.total || 0), 0);
      const purchasesPaid = purchasesBefore.reduce((sum, p) => sum + (p.paid || 0), 0);
      const paymentsTotal = paymentsBefore.reduce((sum, p) => sum + (p.amount || 0), 0);
      const receiptsTotal = receiptsBefore.reduce((sum, r) => sum + (r.amount || 0), 0);

      openingBalance = -(purchasesTotal - purchasesPaid) + paymentsTotal - receiptsTotal;
    } else if (type === 'employee') {
      // Employee - vouchers only
      const receiptsBefore = await db.paymentVoucher.findMany({
        where: {
          userId: id,
          createdAt: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { amount: true }
      });

      const paymentsBefore = await db.paymentDisbursement.findMany({
        where: {
          userId: id,
          createdAt: { lt: new Date(fromDate || '1970-01-01') }
        },
        select: { amount: true }
      });

      const receiptsTotal = receiptsBefore.reduce((sum, r) => sum + (r.amount || 0), 0);
      const paymentsTotal = paymentsBefore.reduce((sum, p) => sum + (p.amount || 0), 0);

      openingBalance = paymentsTotal - receiptsTotal;
    }

    // Fetch transactions in date range
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const createdDateFilter: any = {};
    if (fromDate) createdDateFilter.gte = new Date(fromDate);
    if (toDate) createdDateFilter.lte = new Date(toDate);

    if (type === 'customer') {
      // Fetch sales
      const sales = await db.saleInvoice.findMany({
        where: {
          customerId: id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          invoiceNumber: true,
          date: true,
          total: true,
          paid: true,
          status: true
        }
      });

      sales.forEach(sale => {
        const remaining = (sale.total || 0) - (sale.paid || 0);
        if (sale.paid && sale.paid > 0) {
          transactions.push({
            id: `sale-paid-${sale.id}`,
            date: sale.date || sale.createdAt,
            type: 'sale',
            reference: sale.invoiceNumber,
            description: `فاتورة بيع ${sale.invoiceNumber} - مدفوع`,
            debit: 0,
            credit: sale.paid
          });
        }
        if (remaining > 0) {
          transactions.push({
            id: `sale-credit-${sale.id}`,
            date: sale.date || sale.createdAt,
            type: 'sale',
            reference: sale.invoiceNumber,
            description: `فاتورة بيع ${sale.invoiceNumber} - آجل`,
            debit: remaining,
            credit: 0
          });
        }
      });

      // Fetch receipt vouchers (customer pays us)
      const receipts = await db.paymentVoucher.findMany({
        where: {
          customerId: id,
          ...(Object.keys(createdDateFilter).length > 0 && { createdAt: createdDateFilter })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          voucherNumber: true,
          createdAt: true,
          amount: true
        }
      });

      receipts.forEach(receipt => {
        transactions.push({
          id: `receipt-${receipt.id}`,
          date: receipt.createdAt,
          type: 'receipt',
          reference: receipt.voucherNumber,
          description: `سند قبض ${receipt.voucherNumber}`,
          debit: 0,
          credit: receipt.amount || 0
        });
      });

      // Fetch payment vouchers (we pay customer - refund)
      const payments = await db.paymentDisbursement.findMany({
        where: {
          customerId: id,
          ...(Object.keys(createdDateFilter).length > 0 && { createdAt: createdDateFilter })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          voucherNumber: true,
          createdAt: true,
          amount: true
        }
      });

      payments.forEach(payment => {
        transactions.push({
          id: `payment-${payment.id}`,
          date: payment.createdAt,
          type: 'payment',
          reference: payment.voucherNumber,
          description: `سند دفع ${payment.voucherNumber}`,
          debit: payment.amount || 0,
          credit: 0
        });
      });
    } else if (type === 'supplier') {
      // Supplier
      // Fetch purchases
      const purchases = await db.purchaseInvoice.findMany({
        where: {
          supplierId: id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          invoiceNumber: true,
          date: true,
          total: true,
          paid: true,
          status: true
        }
      });

      purchases.forEach(purchase => {
        const remaining = (purchase.total || 0) - (purchase.paid || 0);
        if (purchase.paid && purchase.paid > 0) {
          transactions.push({
            id: `purchase-paid-${purchase.id}`,
            date: purchase.date || purchase.createdAt,
            type: 'purchase',
            reference: purchase.invoiceNumber,
            description: `فاتورة شراء ${purchase.invoiceNumber} - مدفوع`,
            debit: purchase.paid,
            credit: 0
          });
        }
        if (remaining > 0) {
          transactions.push({
            id: `purchase-credit-${purchase.id}`,
            date: purchase.date || purchase.createdAt,
            type: 'purchase',
            reference: purchase.invoiceNumber,
            description: `فاتورة شراء ${purchase.invoiceNumber} - آجل`,
            debit: 0,
            credit: remaining
          });
        }
      });

      // Fetch payment vouchers (we pay supplier)
      const payments = await db.paymentDisbursement.findMany({
        where: {
          supplierId: id,
          ...(Object.keys(createdDateFilter).length > 0 && { createdAt: createdDateFilter })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          voucherNumber: true,
          createdAt: true,
          amount: true
        }
      });

      payments.forEach(payment => {
        transactions.push({
          id: `payment-${payment.id}`,
          date: payment.createdAt,
          type: 'payment',
          reference: payment.voucherNumber,
          description: `سند دفع ${payment.voucherNumber}`,
          debit: payment.amount || 0,
          credit: 0
        });
      });

      // Fetch receipt vouchers (supplier pays us - refund)
      const receipts = await db.paymentVoucher.findMany({
        where: {
          customerId: id,
          payerType: 'supplier',
          ...(Object.keys(createdDateFilter).length > 0 && { createdAt: createdDateFilter })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          voucherNumber: true,
          createdAt: true,
          amount: true
        }
      });

      receipts.forEach(receipt => {
        transactions.push({
          id: `receipt-${receipt.id}`,
          date: receipt.createdAt,
          type: 'receipt',
          reference: receipt.voucherNumber,
          description: `سند قبض ${receipt.voucherNumber}`,
          debit: 0,
          credit: receipt.amount || 0
        });
      });
    } else if (type === 'employee') {
      // Employee - vouchers only
      const receipts = await db.paymentVoucher.findMany({
        where: {
          userId: id,
          ...(Object.keys(createdDateFilter).length > 0 && { createdAt: createdDateFilter })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          voucherNumber: true,
          createdAt: true,
          amount: true
        }
      });

      receipts.forEach(receipt => {
        transactions.push({
          id: `receipt-${receipt.id}`,
          date: receipt.createdAt,
          type: 'receipt',
          reference: receipt.voucherNumber,
          description: `سند قبض ${receipt.voucherNumber}`,
          debit: 0,
          credit: receipt.amount || 0
        });
      });

      const payments = await db.paymentDisbursement.findMany({
        where: {
          userId: id,
          ...(Object.keys(createdDateFilter).length > 0 && { createdAt: createdDateFilter })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          voucherNumber: true,
          createdAt: true,
          amount: true,
          employeePaymentType: true
        }
      });

      payments.forEach(payment => {
        // Get payment type label
        const paymentTypeLabel = payment.employeePaymentType === 'salary' ? 'راتب' :
                                 payment.employeePaymentType === 'advance' ? 'سلفة' :
                                 payment.employeePaymentType === 'bonus' ? 'مكافأة' :
                                 payment.employeePaymentType === 'deduction' ? 'خصم' : 'صرف';
        
        transactions.push({
          id: `payment-${payment.id}`,
          date: payment.createdAt,
          type: 'payment',
          reference: payment.voucherNumber,
          description: `${paymentTypeLabel} - سند دفع ${payment.voucherNumber}`,
          paymentType: payment.employeePaymentType,
          debit: payment.amount || 0,
          credit: 0
        });
      });
    }

    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = openingBalance;
    transactions.forEach(t => {
      runningBalance = runningBalance + t.debit - t.credit;
      t.balance = runningBalance;
    });

    return NextResponse.json({
      transactions,
      openingBalance
    });
  } catch (error) {
    console.error('Error fetching account statement:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 });
  }
}
