import { NextRequest, NextResponse } from 'next/server'
import { query, getClient } from '@/lib/db-pg'
import bcrypt from 'bcryptjs'

// جلب بيانات المستخدم الحالي
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const result = await query(
      `SELECT u.id, u.name, u.phone, u.role, u.avatar, u."branchId", u."isActive",
              b.name as "branchName"
       FROM "User" u
       LEFT JOIN "Branch" b ON u."branchId" = b.id
       WHERE u.id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات المستخدم: ' + error.message },
      { status: 500 }
    )
  }
}

// تحديث بيانات المستخدم الحالي
export async function PUT(request: NextRequest) {
  const client = await getClient()
  
  try {
    await client.query('BEGIN')
    
    const body = await request.json()
    const { currentPassword, newPassword, name, phone, avatar } = body

    // الحصول على معرف المستخدم من الطلب
    const userId = body.userId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // جلب المستخدم الحالي
    const userResult = await client.query(
      'SELECT * FROM "User" WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // التحقق من كلمة المرور الحالية عند تغيير كلمة المرور
    if (newPassword) {
      if (!currentPassword) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'كلمة المرور الحالية مطلوبة' },
          { status: 400 }
        )
      }

      let isValidPassword = false
      try {
        isValidPassword = await bcrypt.compare(currentPassword, user.password)
      } catch {
        isValidPassword = currentPassword === user.password
      }

      if (!isValidPassword) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        )
      }
    }

    // بناء التحديثات
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(name)
      paramIndex++
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`)
      values.push(phone)
      paramIndex++
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex}`)
      values.push(avatar)
      paramIndex++
    }
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      updates.push(`password = $${paramIndex}`)
      values.push(hashedPassword)
      paramIndex++
    }

    if (updates.length > 0) {
      updates.push(`"updatedAt" = NOW()`)
      values.push(userId)
      
      await client.query(
        `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      )
    }

    await client.query('COMMIT')

    // جلب البيانات المحدثة
    const updatedResult = await query(
      `SELECT u.id, u.name, u.phone, u.role, u.avatar, u."branchId",
              b.name as "branchName"
       FROM "User" u
       LEFT JOIN "Branch" b ON u."branchId" = b.id
       WHERE u.id = $1`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      user: updatedResult.rows[0]
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث البيانات: ' + error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
