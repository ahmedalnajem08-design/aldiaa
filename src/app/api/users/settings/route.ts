import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب إعدادات المستخدم
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });
    
    return NextResponse.json({ settings: user?.settings || {} });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

// PUT - حفظ إعدادات المستخدم
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }
    
    // جلب الإعدادات الحالية ودمجها مع الجديدة
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });
    
    const currentSettings = (user?.settings as Record<string, any>) || {};
    const newSettings = { ...currentSettings, ...settings };
    
    await db.user.update({
      where: { id: userId },
      data: { settings: newSettings }
    });
    
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error('Error saving user settings:', error);
    return NextResponse.json({ error: 'حدث خطأ في حفظ الإعدادات' }, { status: 500 });
  }
}
