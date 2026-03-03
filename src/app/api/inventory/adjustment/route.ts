import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// حفظ تسوية مخزنية
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // الحصول على أسماء المواد
    const materialIds = data.items.map((item: any) => item.materialId);
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } }
    });
    const materialMap = new Map(materials.map(m => [m.id, m.name]));

    // إنشاء سجل تسوية
    const adjustment = await prisma.inventoryAdjustment.create({
      data: {
        id: `adj-${Date.now()}`,
        warehouseId: data.warehouseId,
        notes: data.notes,
        createdById: data.createdById,
        items: {
          create: data.items.map((item: any) => ({
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            materialId: item.materialId,
            materialName: materialMap.get(item.materialId) || '',
            systemQuantity: item.currentQuantity,
            actualQuantity: item.newQuantity,
            difference: item.adjustmentType === 'increase' 
              ? item.adjustmentQuantity 
              : -item.adjustmentQuantity,
            notes: item.reason
          }))
        }
      }
    });

    // تحديث كميات المخزون
    for (const item of data.items) {
      const material = await prisma.material.findFirst({
        where: {
          id: item.materialId,
          warehouseId: data.warehouseId
        }
      });

      if (material) {
        await prisma.material.update({
          where: { id: material.id },
          data: { quantity: item.newQuantity }
        });
      }
    }

    return NextResponse.json({ success: true, adjustment });
  } catch (error) {
    console.error('Save inventory adjustment error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حفظ التسوية' },
      { status: 500 }
    );
  }
}
