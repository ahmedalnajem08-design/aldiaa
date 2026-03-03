import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب فرع محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        warehouses: true,
        users: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'الفرع غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Get branch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الفرع' },
      { status: 500 }
    )
  }
}

// تحديث فرع
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, address } = body

    const branch = await db.branch.update({
      where: { id },
      data: {
        name,
        address
      }
    })

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Update branch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الفرع' },
      { status: 500 }
    )
  }
}

// حذف فرع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من عدم وجود مستخدمين أو مخازن مرتبطة
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, warehouses: true }
        }
      }
    })

    if (branch && (branch._count.users > 0 || branch._count.warehouses > 0)) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الفرع لوجود مستخدمين أو مخازن مرتبطة' },
        { status: 400 }
      )
    }

    await db.branch.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'تم حذف الفرع بنجاح' })
  } catch (error) {
    console.error('Delete branch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الفرع' },
      { status: 500 }
    )
  }
}
