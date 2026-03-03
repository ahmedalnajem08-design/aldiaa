import { NextResponse } from 'next/server';

// Session check - في هذا النظام نستخدم localStorage للحفاظ على الجلسة
export async function GET() {
  // لا يوجد session على الخادم - نعود بـ null
  // الجلسة تُدار من خلال localStorage في المتصفح
  return NextResponse.json({ user: null });
}
