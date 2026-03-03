import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب الجرد أو التسوية
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'count';
    const warehouseId = searchParams.get('warehouseId');
    
    if (type === 'count') {
      const counts = await prisma.inventoryCount.findMany({
        where: warehouseId ? { warehouseId } : {},
        include: {
          items: { include: { material: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return NextResponse.json({ counts });
    }
    
    if (type === 'adjustment') {
      const adjustments = await prisma.inventoryAdjustment.findMany({
        where: warehouseId ? { warehouseId } : {},
        include: {
          items: { include: { material: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return NextResponse.json({ adjustments });
    }
    
    // جلب المواد مع كمياتها للمخزن
    if (warehouseId) {
      const materials = await prisma.material.findMany({
        where: { warehouseId },
        include: { warehouse: true },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json({ materials });
    }
    
    return NextResponse.json({});
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

// إنشاء جرد أو تسوية
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (data.type === 'count') {
      // إنشاء جرد
      const items = data.items.map((item: any) => ({
        materialId: item.materialId,
        materialName: item.materialName,
        systemQuantity: item.systemQuantity,
        actualQuantity: item.actualQuantity,
        difference: item.actualQuantity - item.systemQuantity,
        notes: item.notes || null
      }));
      
      const count = await prisma.inventoryCount.create({
        data: {
          warehouseId: data.warehouseId,
          status: data.status || 'draft',
          notes: data.notes || null,
          createdBy: data.createdBy || null,
          items: {
            create: items
          }
        },
        include: {
          items: true
        }
      });
      
      return NextResponse.json({ success: true, count });
    }
    
    if (data.type === 'adjustment') {
      // إنشاء تسوية
      const items = await Promise.all(data.items.map(async (item: any) => {
        const difference = item.actualQuantity - item.systemQuantity;
        
        // تحديث كمية المادة
        await prisma.material.update({
          where: { id: item.materialId },
          data: {
            quantity: item.actualQuantity
          }
        });
        
        return {
          materialId: item.materialId,
          materialName: item.materialName,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          difference,
          notes: item.notes || null
        };
      }));
      
      const adjustment = await prisma.inventoryAdjustment.create({
        data: {
          warehouseId: data.warehouseId,
          notes: data.notes || null,
          createdBy: data.createdBy || null,
          items: {
            create: items
          }
        },
        include: {
          items: true
        }
      });
      
      return NextResponse.json({ success: true, adjustment });
    }
    
    return NextResponse.json(
      { success: false, message: 'نوع العملية غير معروف' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في إنشاء العملية' },
      { status: 500 }
    );
  }
}
