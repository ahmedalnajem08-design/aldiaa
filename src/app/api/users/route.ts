import { NextRequest, NextResponse } from 'next/server'
import { query, getClient } from '@/lib/db-pg'
import bcrypt from 'bcryptjs'

// جلب جميع المستخدمين
export async function GET() {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.phone, u.role, u.avatar, u."branchId", u."isActive", 
             u."createdAt", u."updatedAt", b.name as "branchName"
      FROM "User" u
      LEFT JOIN "Branch" b ON u."branchId" = b.id
      ORDER BY u."createdAt" DESC
    `)

    const users = result.rows.map(user => ({
      ...user,
      active: user.isActive ?? true
    }))

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المستخدمين: ' + error.message },
      { status: 500 }
    )
  }
}

// إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  const client = await getClient()
  
  try {
    await client.query('BEGIN')
    
    const body = await request.json()
    const { name, phone, password, role, avatar, permissions, branchId } = body

    if (!name || !password) {
      return NextResponse.json(
        { error: 'الاسم وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // توليد ID فريد
    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

    // إنشاء المستخدم
    await client.query(
      `INSERT INTO "User" (id, name, phone, password, role, avatar, "branchId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
      [userId, name, phone || null, hashedPassword, role || 'user', avatar || null, branchId || null]
    )

    // إنشاء الصلاحيات
    if (permissions && Object.keys(permissions).length > 0) {
      const permId = 'perm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      const permFields = ['id', 'userId']
      const permValues = [permId, userId]
      const permPlaceholders = ['$1', '$2']
      let paramIndex = 3

      for (const [key, value] of Object.entries(permissions)) {
        if (value !== undefined) {
          permFields.push(`"${key}"`)
          permValues.push(value as boolean)
          permPlaceholders.push(`$${paramIndex}`)
          paramIndex++
        }
      }

      await client.query(
        `INSERT INTO "Permission" (${permFields.join(', ')}, "createdAt", "updatedAt")
         VALUES (${permPlaceholders.join(', ')}, NOW(), NOW())`,
        permValues
      )
    }

    await client.query('COMMIT')

    // جلب بيانات المستخدم
    const userResult = await query(
      `SELECT u.id, u.name, u.phone, u.role, u.avatar, u."branchId", u."isActive", 
              b.name as "branchName"
       FROM "User" u
       LEFT JOIN "Branch" b ON u."branchId" = b.id
       WHERE u.id = $1`,
      [userId]
    )

    return NextResponse.json({
      ...userResult.rows[0],
      active: true
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستخدم: ' + error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

// تحديث مستخدم
export async function PUT(request: NextRequest) {
  const client = await getClient()
  
  try {
    await client.query('BEGIN')
    
    const body = await request.json()
    const { id, name, phone, password, role, avatar, permissions, branchId, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // بناء الاستعلام
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
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push(`password = $${paramIndex}`)
      values.push(hashedPassword)
      paramIndex++
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`)
      values.push(role)
      paramIndex++
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex}`)
      values.push(avatar)
      paramIndex++
    }
    if (branchId !== undefined) {
      updates.push(`"branchId" = $${paramIndex}`)
      values.push(branchId)
      paramIndex++
    }
    if (isActive !== undefined) {
      updates.push(`"isActive" = $${paramIndex}`)
      values.push(isActive)
      paramIndex++
    }

    updates.push(`"updatedAt" = NOW()`)
    values.push(id)

    if (updates.length > 1) {
      await client.query(
        `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      )
    }

    // تحديث الصلاحيات
    if (permissions) {
      // التحقق من وجود صلاحيات
      const existingPerm = await client.query(
        'SELECT id FROM "Permission" WHERE "userId" = $1',
        [id]
      )

      if (existingPerm.rows.length > 0) {
        // تحديث الصلاحيات الموجودة
        const permUpdates: string[] = []
        const permValues: any[] = []
        let permIndex = 1

        for (const [key, value] of Object.entries(permissions)) {
          if (value !== undefined) {
            permUpdates.push(`"${key}" = $${permIndex}`)
            permValues.push(value as boolean)
            permIndex++
          }
        }

        if (permUpdates.length > 0) {
          permUpdates.push(`"updatedAt" = NOW()`)
          permValues.push(id)
          await client.query(
            `UPDATE "Permission" SET ${permUpdates.join(', ')} WHERE "userId" = $${permIndex}`,
            permValues
          )
        }
      } else {
        // إنشاء صلاحيات جديدة
        const permId = 'perm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        const permFields = ['id', 'userId']
        const permValues = [permId, id]
        const permPlaceholders = ['$1', '$2']
        let permIndex = 3

        for (const [key, value] of Object.entries(permissions)) {
          if (value !== undefined) {
            permFields.push(`"${key}"`)
            permValues.push(value as boolean)
            permPlaceholders.push(`$${permIndex}`)
            permIndex++
          }
        }

        await client.query(
          `INSERT INTO "Permission" (${permFields.join(', ')}, "createdAt", "updatedAt")
           VALUES (${permPlaceholders.join(', ')}, NOW(), NOW())`,
          permValues
        )
      }
    }

    await client.query('COMMIT')

    // جلب بيانات المستخدم المحدثة
    const userResult = await query(
      `SELECT u.id, u.name, u.phone, u.role, u.avatar, u."branchId", u."isActive", 
              b.name as "branchName"
       FROM "User" u
       LEFT JOIN "Branch" b ON u."branchId" = b.id
       WHERE u.id = $1`,
      [id]
    )

    return NextResponse.json({
      ...userResult.rows[0],
      active: userResult.rows[0]?.isActive ?? true
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المستخدم: ' + error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

// حذف مستخدم
export async function DELETE(request: NextRequest) {
  const client = await getClient()
  
  try {
    await client.query('BEGIN')
    
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من عدم حذف المدير الأخير
    const adminCount = await client.query(
      'SELECT COUNT(*) as count FROM "User" WHERE role = $1',
      ['admin']
    )

    const userToDelete = await client.query(
      'SELECT role FROM "User" WHERE id = $1',
      [id]
    )

    if (userToDelete.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    if (userToDelete.rows[0].role === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'لا يمكن حذف المدير الأخير في النظام' },
        { status: 400 }
      )
    }

    // حذف الصلاحيات أولاً
    await client.query('DELETE FROM "Permission" WHERE "userId" = $1', [id])
    
    // حذف المستخدم
    await client.query('DELETE FROM "User" WHERE id = $1', [id])

    await client.query('COMMIT')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المستخدم: ' + error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
