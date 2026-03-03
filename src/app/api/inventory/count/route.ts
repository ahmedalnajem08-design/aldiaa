import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب جرد المخزون
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json([]);
    }

    // جلب المواد في المخزن
    const materials = await prisma.material.findMany({
      where: { warehouseId },
      include: { warehouse: true }
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// حفظ جرد مخزني
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // الحصول على أسماء المواد
    const materialIds = data.items.map((item: any) => item.materialId);
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } }
    });
    const materialMap = new Map(materials.map(m => [m.id, m.name]));

    // إنشاء سجل جرد
    const inventoryCount = await prisma.inventoryCount.create({
      data: {
        id: `count-${Date.now()}`,
        warehouseId: data.warehouseId,
        notes: data.notes,
        createdById: data.createdById,
        status: 'completed',
        items: {
          create: data.items.map((item: any) => ({
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            materialId: item.materialId,
            materialName: materialMap.get(item.materialId) || '',
            systemQuantity: item.systemQuantity,
            actualQuantity: item.actualQuantity,
            difference: item.difference
          }))
        }
      }
    });

    // تحديث كميات المخزون
    for (const item of data.items) {
      if (item.difference !== 0) {
        await prisma.material.update({
          where: { id: item.materialId },
          data: { quantity: item.actualQuantity }
        });
      }
    }

    return NextResponse.json({ success: true, inventoryCount });
  } catch (error) {
    console.error('Save inventory count error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حفظ الجرد' },
      { status: 500 }
    );
  }
}
