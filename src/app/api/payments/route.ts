import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// جلب السندات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'voucher' or 'disbursement'
    const customerId = searchParams.get('customerId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) {
        const fromDate = new Date(from)
        fromDate.setHours(0, 0, 0, 0)
        dateFilter.gte = fromDate
      }
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        dateFilter.lte = toDate
      }
      where.createdAt = dateFilter
    }

    if (type === 'voucher') {
      const vouchers = await db.paymentVoucher.findMany({
        where,
        include: {
          customer: true
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(vouchers)
    } else if (type === 'disbursement') {
      const disbursements = await db.paymentDisbursement.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(disbursements)
    }

    // إرجاع كلا النوعين
    const [vouchers, disbursements] = await Promise.all([
      db.paymentVoucher.findMany({
        where,
        include: { customer: true },
        orderBy: { createdAt: 'desc' }
      }),
      db.paymentDisbursement.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({ vouchers, disbursements })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السندات' },
      { status: 500 }
    )
  }
}

// إنشاء سند
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, amount, customerId, supplierName, notes, createdBy } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    if (type === 'voucher') {
      const voucher = await db.paymentVoucher.create({
        data: {
          amount,
          customerId,
          notes,
          createdBy
        },
        include: {
          customer: true
        }
      })
      return NextResponse.json(voucher)
    } else if (type === 'disbursement') {
      const disbursement = await db.paymentDisbursement.create({
        data: {
          amount,
          supplierName,
          notes,
          createdBy
        }
      })
      return NextResponse.json(disbursement)
    }

    return NextResponse.json({ error: 'نوع السند غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء السند' },
      { status: 500 }
    )
  }
}
