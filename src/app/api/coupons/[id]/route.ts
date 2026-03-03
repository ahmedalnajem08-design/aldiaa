import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-pg';

// حذف كوبون
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      'DELETE FROM "FreeWashCoupon" WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'الكوبون غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الكوبون: ' + error.message },
      { status: 500 }
    );
  }
}
