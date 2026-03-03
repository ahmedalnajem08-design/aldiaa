import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب حركات مادة معينة
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const materialId = searchParams.get('materialId');
    const warehouseId = searchParams.get('warehouseId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!materialId) {
      return NextResponse.json({ movements: [] }, { status: 400 });
    }
    
    const movements: any[] = [];
    
    // 1. جلب حركات البيع (SaleItems)
    const saleItems = await prisma.saleItem.findMany({
      where: {
        materialId,
        ...(warehouseId && { warehouseId })
      },
      include: {
        invoice: {
          include: {
            customer: true,
            user: true
          }
        },
        warehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    for (const item of saleItems) {
      movements.push({
        id: item.id,
        type: 'sale',
        typeName: 'بيع',
        date: item.createdAt,
        invoiceNumber: item.invoice?.invoiceNumber,
        quantity: -item.quantity, // سالب لأنه بيع
        price: item.price,
        total: item.total,
        customerName: item.invoice?.customer?.name || 'زبون نقدي',
        warehouseName: item.warehouse?.name || '-',
        userName: item.invoice?.user?.name || '-',
        notes: item.notes
      });
    }
    
    // 2. جلب حركات الشراء (PurchaseItems)
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        materialId,
        ...(warehouseId && { warehouseId })
      },
      include: {
        invoice: {
          include: {
            user: true
          }
        },
        warehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    for (const item of purchaseItems) {
      movements.push({
        id: item.id,
        type: 'purchase',
        typeName: 'شراء',
        date: item.createdAt,
        invoiceNumber: item.invoice?.invoiceNumber,
        quantity: item.quantity, // موجب لأنه شراء
        price: item.price,
        total: item.total,
        supplierName: item.invoice?.supplierName || '-',
        warehouseName: item.warehouse?.name || '-',
        userName: item.invoice?.user?.name || '-',
        notes: item.notes
      });
    }
    
    // 3. جلب حركات النقل المخزني (TransferItems)
    const transferItems = await prisma.transferItem.findMany({
      where: { materialId },
      include: {
        transfer: {
          include: {
            fromWarehouse: true,
            toWarehouse: true,
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    for (const item of transferItems) {
      // إذا كانت المادة في المخزن المحدد كـ "من"، فهي صادر
      // إذا كانت في المخزن المحدد كـ "إلى"، فهي وارد
      const isOut = warehouseId && item.transfer.fromWarehouseId === warehouseId;
      const isIn = warehouseId && item.transfer.toWarehouseId === warehouseId;
      
      if (!warehouseId || isOut || isIn) {
        movements.push({
          id: item.id,
          type: isOut ? 'transfer_out' : (isIn ? 'transfer_in' : 'transfer'),
          typeName: isOut ? 'نقل صادر' : (isIn ? 'نقل وارد' : 'نقل مخزني'),
          date: item.createdAt,
          invoiceNumber: item.transfer?.transferNumber,
          quantity: isOut ? -item.quantity : item.quantity,
          fromWarehouse: item.transfer?.fromWarehouse?.name,
          toWarehouse: item.transfer?.toWarehouse?.name,
          userName: item.transfer?.user?.name || '-',
          notes: item.notes
        });
      }
    }
    
    // 4. جلب حركات الجرد (InventoryItems)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { materialId },
      include: {
        count: {
          include: {
            warehouse: true,
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    for (const item of inventoryItems) {
      if (item.count?.status === 'completed') {
        movements.push({
          id: item.id,
          type: 'inventory',
          typeName: 'جرد',
          date: item.createdAt,
          invoiceNumber: item.count?.countNumber,
          quantity: item.difference, // الفرق (قد يكون سالب أو موجب)
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          warehouseName: item.count?.warehouse?.name || '-',
          userName: item.count?.user?.name || '-',
          notes: item.notes
        });
      }
    }
    
    // 5. جلب حركات التسوية (AdjustmentItems)
    const adjustmentItems = await prisma.adjustmentItem.findMany({
      where: { materialId },
      include: {
        adjustment: {
          include: {
            warehouse: true,
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    for (const item of adjustmentItems) {
      movements.push({
        id: item.id,
        type: 'adjustment',
        typeName: 'تسوية',
        date: item.createdAt,
        invoiceNumber: item.adjustment?.adjustmentNumber,
        quantity: item.difference,
        systemQuantity: item.systemQuantity,
        actualQuantity: item.actualQuantity,
        warehouseName: item.adjustment?.warehouse?.name || '-',
        userName: item.adjustment?.user?.name || '-',
        notes: item.notes
      });
    }
    
    // 6. جلب حركات الإرجاع (PurchaseReturnItems)
    const returnItems = await prisma.purchaseReturnItem.findMany({
      where: { materialId },
      include: {
        returnInvoice: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    for (const item of returnItems) {
      movements.push({
        id: item.id,
        type: 'return',
        typeName: 'إرجاع شراء',
        date: item.createdAt,
        invoiceNumber: item.returnInvoice?.returnNumber,
        quantity: -item.quantity, // سالب لأنه إرجاع (خروج)
        price: item.price,
        total: item.total,
        userName: item.returnInvoice?.user?.name || '-',
        notes: item.notes
      });
    }
    
    // ترتيب كل الحركات حسب التاريخ (الأحدث أولاً)
    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // أخذ العدد المحدد
    const limitedMovements = movements.slice(0, limit);
    
    return NextResponse.json({ 
      movements: limitedMovements,
      total: movements.length
    });
  } catch (error) {
    console.error('Get material movements error:', error);
    return NextResponse.json({ movements: [], total: 0 }, { status: 500 });
  }
}
