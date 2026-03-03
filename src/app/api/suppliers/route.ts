import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب الموردين
export async function GET() {
  try {
    const suppliers = await prisma.customer.findMany({
      where: { type: 'supplier' },
      orderBy: { name: 'asc' }
    });

    // إضافة حقل balance
    const suppliersWithBalance = suppliers.map(s => ({
      ...s,
      balance: 0 // يمكن حسابه من الفواتير لاحقاً
    }));

    return NextResponse.json(suppliersWithBalance);
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// إضافة مورد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const supplier = await prisma.customer.create({
      data: {
        id: `supplier-${Date.now()}`,
        name: data.name,
        phone: data.phone,
        address: data.address,
        type: 'supplier',
        notes: data.notes
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المورد' },
      { status: 500 }
    );
  }
}
