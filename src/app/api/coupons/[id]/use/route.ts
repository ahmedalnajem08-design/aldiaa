import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// استخدام كوبون
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(`
      UPDATE "FreeWashCoupon" 
      SET used = true, "usedAt" = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'الكوبون غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, coupon: result.rows[0] });
  } catch (error: any) {
    console.error('Use coupon error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في استخدام الكوبون: ' + error.message },
      { status: 500 }
    );
  }
}
