import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, amount, date, createdBy } = body;

    if (!branchId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    // Find or create cash register for branch
    let cashRegister = await db.cashRegister.findFirst({
      where: { branchId }
    });

    if (!cashRegister) {
      cashRegister = await db.cashRegister.create({
        data: {
          branchId,
          balance: 0
        }
      });
    }

    // Create transaction
    await db.cashTransaction.create({
      data: {
        registerId: cashRegister.id,
        type: 'in',
        amount,
        description: 'تحويل من ملخص الفرع',
        referenceType: 'branch_transfer'
      }
    });

    // Update balance
    await db.cashRegister.update({
      where: { id: cashRegister.id },
      data: {
        balance: { increment: amount }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cash transfer:', error);
    return NextResponse.json({ error: 'حدث خطأ في التحويل' }, { status: 500 });
  }
}
