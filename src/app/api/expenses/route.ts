import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب المصاريف
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('fromDate');
    const branchId = searchParams.get('branchId');
    const expenseType = searchParams.get('expenseType');
    
    const where: any = {};
    
    if (fromDate && toDate) {
      where.createdAt = {
        gte: new Date(fromDate),
        lte: new Date(toDate + 'T23:59:59')
      };
    }
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (expenseType) {
      where.expenseType = expenseType;
    }
    
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ expenses: [] }, { status: 500 });
  }
}

// إنشاء مصروف جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const count = await prisma.expense.count();
    const voucherNumber = data.voucherNumber || `EXP-${String(count + 1).padStart(6, '0')}`;
    
    const expense = await prisma.expense.create({
      data: {
        voucherNumber,
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category || 'general',
        expenseType: data.expenseType || 'general',
        userId: data.userId || null,
        employeePaymentType: data.employeePaymentType || null,
        branchId: data.branchId || null,
        notes: data.notes || null,
        createdBy: data.createdById || data.createdBy || null
      }
    });

    // إذا كان صرف لموظف، نحتاج لتسجيله في كشف الحساب
    // هذا يتم عبر PaymentDisbursement للحفاظ على توحيد البيانات
    if (data.expenseType === 'employee' && data.userId) {
      // إنشاء سجل في PaymentDisbursement لتوثيق حركة الحساب
      await prisma.paymentDisbursement.create({
        data: {
          id: `expense-emp-${Date.now()}`,
          voucherNumber: `EMP-${Date.now().toString().slice(-8)}`,
          amount: parseFloat(data.amount),
          userId: data.userId,
          payeeType: 'employee',
          employeePaymentType: data.employeePaymentType || 'salary',
          paymentMethod: data.paymentMethod || 'cash',
          notes: data.notes || data.description,
          createdBy: data.createdById || data.createdBy || null
        }
      });
    }
    
    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إنشاء المصروف' },
      { status: 500 }
    );
  }
}

// تحديث مصروف
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const expense = await prisma.expense.update({
      where: { id: data.id },
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        notes: data.notes
      }
    });
    
    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث المصروف' },
      { status: 500 }
    );
  }
}

// حذف مصروف
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.expense.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في حذف المصروف' },
      { status: 500 }
    );
  }
}
