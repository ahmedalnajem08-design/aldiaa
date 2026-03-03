import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب قائمة شراء محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        warehouse: {
          include: {
            branch: true
          }
        },
        items: {
          include: {
            material: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'قائمة الشراء غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Get purchase invoice error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب قائمة الشراء' },
      { status: 500 }
    )
  }
}

// حذف قائمة شراء
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id },
        include: { items: true }
      })

      if (invoice) {
        for (const item of invoice.items) {
          await tx.material.update({
            where: { id: item.materialId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          })
        }
      }

      await tx.purchaseInvoice.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'تم حذف قائمة الشراء بنجاح' })
  } catch (error) {
    console.error('Delete purchase invoice error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف قائمة الشراء' },
      { status: 500 }
    )
  }
}
