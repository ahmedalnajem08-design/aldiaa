import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// تنزيل نسخة احتياطية
export async function GET() {
  try {
    // مسار قاعدة البيانات الصحيح
    const dbPath = path.join(process.cwd(), 'db', 'custom.db');

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'قاعدة البيانات غير موجودة' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const fileName = `aldiaa-backup-${new Date().toISOString().split('T')[0]}.db`;

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في النسخ الاحتياطي' },
      { status: 500 }
    );
  }
}

// استيراد نسخة احتياطية
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم رفع ملف' },
        { status: 400 }
      );
    }

    const dbPath = path.join(process.cwd(), 'db', 'custom.db');
    const backupPath = path.join(process.cwd(), 'db', `backup-${Date.now()}.db`);
    
    // إنشاء نسخة احتياطية من الحالية قبل الاستبدال
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    }
    
    // كتابة الملف الجديد
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(dbPath, buffer);
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم استعادة النسخة الاحتياطية بنجاح' 
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في استعادة النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
