import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب زبون محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        saleInvoices: {
          include: {
            items: {
              include: {
                material: true
              }
            },
            warehouse: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'الزبون غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الزبون' },
      { status: 500 }
    )
  }
}

// تحديث زبون
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, carNumber, carType, odometer, lastOdometer } = body

    const customer = await db.customer.update({
      where: { id },
      data: {
        name,
        phone,
        carNumber,
        carType,
        odometer,
        lastOdometer
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الزبون' },
      { status: 500 }
    )
  }
}

// حذف زبون
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من عدم وجود قوائم بيع مرتبطة
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { saleInvoices: true }
        }
      }
    })

    if (customer && customer._count.saleInvoices > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الزبون لوجود قوائم بيع مرتبطة' },
        { status: 400 }
      )
    }

    await db.customer.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'تم حذف الزبون بنجاح' })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الزبون' },
      { status: 500 }
    )
  }
}
