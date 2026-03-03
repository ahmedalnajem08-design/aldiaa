import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');

    // Get materials with their purchase prices
    const materials = await prisma.material.findMany({
      include: {
        warehouse: {
          include: { branch: true }
        }
      }
    });

    // Filter by branch if specified
    const filteredMaterials = branchId
      ? materials.filter(m => m.warehouse?.branchId === branchId)
      : materials;

    // Calculate total inventory value (quantity * purchase price)
    const totalValue = filteredMaterials.reduce((sum, m) => {
      return sum + ((m.quantity || 0) * (m.purchasePrice || 0));
    }, 0);

    // Calculate total quantity
    const totalQuantity = filteredMaterials.reduce((sum, m) => sum + (m.quantity || 0), 0);

    // Group by warehouse
    const byWarehouse = filteredMaterials.reduce((acc, m) => {
      const warehouseName = m.warehouse?.name || 'غير محدد';
      if (!acc[warehouseName]) {
        acc[warehouseName] = { value: 0, quantity: 0, count: 0 };
      }
      acc[warehouseName].value += (m.quantity || 0) * (m.purchasePrice || 0);
      acc[warehouseName].quantity += m.quantity || 0;
      acc[warehouseName].count += 1;
      return acc;
    }, {} as Record<string, { value: number; quantity: number; count: number }>);

    return NextResponse.json({
      materials: filteredMaterials,
      totalValue,
      totalQuantity,
      materialsCount: filteredMaterials.length,
      byWarehouse
    });
  } catch (error) {
    console.error('Get materials summary error:', error);
    return NextResponse.json({
      materials: [],
      totalValue: 0,
      totalQuantity: 0,
      materialsCount: 0,
      byWarehouse: {}
    }, { status: 500 });
  }
}
