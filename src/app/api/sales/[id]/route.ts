import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب قائمة بيع محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.saleInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: {
          include: {
            branch: true
          }
        },
        items: {
          include: {
            material: true
          }
        },
        coupon: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'قائمة البيع غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Get sale invoice error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب قائمة البيع' },
      { status: 500 }
    )
  }
}

// تحديث قائمة بيع
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, warehouseId, items, total, status, discount, paidAmount, odometer, notes, cancelled } = body

    // الحصول على القائمة الحالية
    const currentInvoice = await db.saleInvoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!currentInvoice) {
      return NextResponse.json(
        { error: 'قائمة البيع غير موجودة' },
        { status: 404 }
      )
    }

    // إذا كان الإلغاء
    if (cancelled) {
      const invoice = await db.$transaction(async (tx) => {
        // إرجاع الكميات للمخزون
        for (const item of currentInvoice.items) {
          await tx.material.update({
            where: { id: item.materialId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          })
        }

        return await tx.saleInvoice.update({
          where: { id },
          data: { cancelled: true },
          include: {
            customer: true,
            warehouse: true,
            items: {
              include: {
                material: true
              }
            }
          }
        })
      })

      return NextResponse.json(invoice)
    }

    // تحديث القائمة مع إعادة حساب المخزون
    const invoice = await db.$transaction(async (tx) => {
      // إرجاع كميات العناصر القديمة
      for (const item of currentInvoice.items) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        })
      }

      // حذف العناصر القديمة
      await tx.saleItem.deleteMany({
        where: { invoiceId: id }
      })

      // تحديث القائمة
      const updatedInvoice = await tx.saleInvoice.update({
        where: { id },
        data: {
          customerId,
          warehouseId,
          total,
          status,
          discount,
          paidAmount,
          odometer,
          notes,
          items: {
            create: items.map((item: { materialId: string; quantity: number; price: number; notes?: string }) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes
            }))
          }
        },
        include: {
          customer: true,
          warehouse: true,
          items: {
            include: {
              material: true
            }
          }
        }
      })

      // خصم الكميات الجديدة
      for (const item of items) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        })
      }

      return updatedInvoice
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Update sale invoice error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث قائمة البيع' },
      { status: 500 }
    )
  }
}

// حذف قائمة بيع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // إرجاع الكميات وحذف القائمة
    await db.$transaction(async (tx) => {
      const invoice = await tx.saleInvoice.findUnique({
        where: { id },
        include: { items: true }
      })

      if (invoice) {
        for (const item of invoice.items) {
          await tx.material.update({
            where: { id: item.materialId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          })
        }
      }

      await tx.saleInvoice.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'تم حذف قائمة البيع بنجاح' })
  } catch (error) {
    console.error('Delete sale invoice error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف قائمة البيع' },
      { status: 500 }
    )
  }
}
