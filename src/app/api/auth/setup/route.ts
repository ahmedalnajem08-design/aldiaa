import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// إنشاء مستخدم افتراضي للنظام
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, password, role, branchId } = body

    if (!name || !password) {
      return NextResponse.json(
        { error: 'الاسم وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        password: hashedPassword,
        role: role || 'user',
        branchId: branchId || null
      }
    })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'تم إنشاء المستخدم بنجاح'
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستخدم' },
      { status: 500 }
    )
  }
}

// التحقق من وجود مستخدمين في النظام
export async function GET() {
  try {
    const count = await db.user.count()
    return NextResponse.json({ hasUsers: count > 0, count })
  } catch (error) {
    console.error('Check users error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التحقق من المستخدمين' },
      { status: 500 }
    )
  }
}
