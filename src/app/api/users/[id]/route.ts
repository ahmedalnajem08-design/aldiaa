import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// جلب مستخدم محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        permissions: true,
        branchId: true,
        branch: true,
        shortcuts: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...user,
      active: user.isActive ?? true
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المستخدم' },
      { status: 500 }
    )
  }
}

// تحديث مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, password, role, avatar, permissions, branchId } = body

    const updateData: Record<string, unknown> = {}

    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (password) updateData.password = await bcrypt.hash(password, 10)
    if (role) updateData.role = role
    if (avatar !== undefined) updateData.avatar = avatar
    if (branchId !== undefined) updateData.branchId = branchId

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
        permissions: true
      }
    })

    // تحديث الصلاحيات إذا تم إرسالها
    if (permissions !== undefined) {
      await db.permission.upsert({
        where: { userId: id },
        create: {
          userId: id,
          ...permissions
        },
        update: {
          ...permissions
        }
      })
    }

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      ...userWithoutPassword,
      active: user.isActive ?? true
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المستخدم' },
      { status: 500 }
    )
  }
}

// حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // حذف الصلاحيات أولاً
    await db.permission.deleteMany({
      where: { userId: id }
    })

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المستخدم' },
      { status: 500 }
    )
  }
}
