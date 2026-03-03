import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب مادة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const material = await db.material.findUnique({
      where: { id },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json(
        { error: 'المادة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error('Get material error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المادة' },
      { status: 500 }
    )
  }
}

// تحديث مادة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, purchasePrice, salePrice, quantity, warehouseId } = body

    const material = await db.material.update({
      where: { id },
      data: {
        name,
        purchasePrice,
        salePrice,
        quantity,
        warehouseId
      },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        }
      }
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Update material error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المادة' },
      { status: 500 }
    )
  }
}

// حذف مادة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.material.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'تم حذف المادة بنجاح' })
  } catch (error) {
    console.error('Delete material error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المادة' },
      { status: 500 }
    )
  }
}
