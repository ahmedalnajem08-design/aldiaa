import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب عمليات النقل
export async function GET(request: NextRequest) {
  try {
    const transfers = await prisma.warehouseTransfer.findMany({
      include: {
        fromWarehouse: {
          include: { branch: true }
        },
        toWarehouse: {
          include: { branch: true }
        },
        items: {
          include: { material: true }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Transform data to match expected format
    const formattedTransfers = transfers.map(t => ({
      id: t.id,
      transferNumber: t.transferNumber || t.id.slice(-8).toUpperCase(),
      sourceWarehouse: {
        id: t.fromWarehouseId,
        name: t.fromWarehouse?.name || 'غير محدد'
      },
      targetWarehouse: {
        id: t.toWarehouseId,
        name: t.toWarehouse?.name || 'غير محدد'
      },
      notes: t.notes,
      status: 'completed',
      createdAt: t.createdAt,
      createdBy: t.user ? { id: t.user.id, name: t.user.name } : null,
      items: t.items.map(item => ({
        id: item.id,
        materialId: item.materialId,
        material: { name: item.material?.name || item.materialName, unit: item.material?.unit || '' },
        quantity: item.quantity
      }))
    }));

    return NextResponse.json(formattedTransfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// إنشاء نقل مخزني جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // الحصول على رقم التحويل
    const count = await prisma.warehouseTransfer.count();
    const transferNumber = `TR-${String(count + 1).padStart(6, '0')}`;

    const transfer = await prisma.warehouseTransfer.create({
      data: {
        id: `transfer-${Date.now()}`,
        transferNumber,
        fromWarehouseId: data.sourceWarehouseId,
        toWarehouseId: data.targetWarehouseId,
        notes: data.notes,
        createdBy: data.createdById,
        items: {
          create: data.items.map((item: any) => ({
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            materialId: item.materialId,
            materialName: item.materialName || '',
            quantity: item.quantity
          }))
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { material: true } }
      }
    });

    // تحديث كميات المخزون
    for (const item of data.items) {
      // تقليل من المخزن المصدر
      const sourceMaterial = await prisma.material.findFirst({
        where: {
          id: item.materialId,
          warehouseId: data.sourceWarehouseId
        }
      });

      if (sourceMaterial) {
        await prisma.material.update({
          where: { id: sourceMaterial.id },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // زيادة في المخزن الهدف
      const targetMaterial = await prisma.material.findFirst({
        where: {
          id: item.materialId,
          warehouseId: data.targetWarehouseId
        }
      });

      if (targetMaterial) {
        await prisma.material.update({
          where: { id: targetMaterial.id },
          data: { quantity: { increment: item.quantity } }
        });
      } else {
        // إنشاء سجل جديد في المخزن الهدف
        const originalMaterial = await prisma.material.findUnique({
          where: { id: item.materialId }
        });
        if (originalMaterial) {
          await prisma.material.create({
            data: {
              id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: originalMaterial.name,
              code: originalMaterial.code,
              unit: originalMaterial.unit,
              purchasePrice: originalMaterial.purchasePrice,
              salePrice: originalMaterial.salePrice,
              quantity: item.quantity,
              warehouseId: data.targetWarehouseId
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    console.error('Create transfer error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء النقل المخزني' },
      { status: 500 }
    );
  }
}
