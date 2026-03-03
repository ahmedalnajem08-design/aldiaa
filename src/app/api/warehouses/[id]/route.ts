import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب مخزن محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const warehouse = await db.warehouse.findUnique({
      where: { id },
      include: {
        branch: true,
        materials: {
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!warehouse) {
      return NextResponse.json(
        { error: 'المخزن غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Get warehouse error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المخزن' },
      { status: 500 }
    )
  }
}

// تحديث مخزن
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, branchId } = body

    const warehouse = await db.warehouse.update({
      where: { id },
      data: {
        name,
        branchId
      },
      include: {
        branch: true
      }
    })

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Update warehouse error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المخزن' },
      { status: 500 }
    )
  }
}

// حذف مخزن
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من عدم وجود مواد مرتبطة
    const warehouse = await db.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: { materials: true }
        }
      }
    })

    if (warehouse && warehouse._count.materials > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف المخزن لوجود مواد مرتبطة' },
        { status: 400 }
      )
    }

    await db.warehouse.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'تم حذف المخزن بنجاح' })
  } catch (error) {
    console.error('Delete warehouse error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المخزن' },
      { status: 500 }
    )
  }
}
