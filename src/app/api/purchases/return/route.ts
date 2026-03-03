import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// إرجاع مشتريات
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { originalInvoiceId, purchaseId, items, notes, createdBy } = data;
    
    // Use either originalInvoiceId or purchaseId
    const invoiceId = originalInvoiceId || purchaseId;
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لا توجد أصناف للإرجاع' },
        { status: 400 }
      );
    }

    // إنشاء سجل الإرجاع
    const returnRecord = await prisma.purchaseReturn.create({
      data: {
        purchaseId: invoiceId,
        notes,
        createdBy,
        total: items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId || 'unknown',
            materialName: item.materialName,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          }))
        }
      },
      include: {
        items: true
      }
    });

    // تحديث كميات المواد (تقليل الكمية لأنها مرجعة)
    for (const item of items) {
      if (item.materialId) {
        try {
          await prisma.material.update({
            where: { id: item.materialId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        } catch (e) {
          console.error('Could not update material quantity:', e);
        }
      }
    }

    const totalReturn = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    return NextResponse.json({
      success: true,
      return: returnRecord,
      totalReturn
    });
  } catch (error) {
    console.error('Purchase return error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الإرجاع' },
      { status: 500 }
    );
  }
}

// جلب سجلات الإرجاع
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    const where: any = {};
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate + 'T23:59:59');
    }
    
    const returns = await prisma.purchaseReturn.findMany({
      where,
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    return NextResponse.json({ returns });
  } catch (error) {
    console.error('Get purchase returns error:', error);
    return NextResponse.json({ returns: [] }, { status: 500 });
  }
}
