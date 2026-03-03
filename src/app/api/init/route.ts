import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    // إنشاء الجداول إذا لم تكن موجودة
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Branch" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "address" TEXT,
        "phone" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "password" TEXT NOT NULL,
        "role" TEXT DEFAULT 'user',
        "avatar" TEXT,
        "branchIds" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "branchId" TEXT REFERENCES "Branch"("id"),
        "settings" JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "Permission" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
        "canSale" BOOLEAN DEFAULT true,
        "canChangePrice" BOOLEAN DEFAULT false,
        "canCreditSale" BOOLEAN DEFAULT true,
        "canViewPurchasePrice" BOOLEAN DEFAULT false,
        "canEditSaleInvoice" BOOLEAN DEFAULT false,
        "canDeleteSaleInvoice" BOOLEAN DEFAULT false,
        "canEditSaleDate" BOOLEAN DEFAULT false,
        "canGiveFreeWash" BOOLEAN DEFAULT false,
        "canPartialPayment" BOOLEAN DEFAULT true,
        "canPurchase" BOOLEAN DEFAULT true,
        "canEditPurchaseInvoice" BOOLEAN DEFAULT false,
        "canDeletePurchaseInvoice" BOOLEAN DEFAULT false,
        "canPurchaseReturn" BOOLEAN DEFAULT false,
        "canViewMaterials" BOOLEAN DEFAULT true,
        "canEditMaterial" BOOLEAN DEFAULT false,
        "canDeleteMaterial" BOOLEAN DEFAULT false,
        "canAddMaterial" BOOLEAN DEFAULT false,
        "canWarehouseTransfer" BOOLEAN DEFAULT false,
        "canTransferBetweenBranches" BOOLEAN DEFAULT false,
        "canTransferBetweenWarehouses" BOOLEAN DEFAULT false,
        "canInventoryCount" BOOLEAN DEFAULT false,
        "canInventoryAdjustment" BOOLEAN DEFAULT false,
        "canViewAccounts" BOOLEAN DEFAULT true,
        "canEditCustomer" BOOLEAN DEFAULT false,
        "canEditSupplier" BOOLEAN DEFAULT false,
        "canPaymentVoucher" BOOLEAN DEFAULT false,
        "canPaymentDisbursement" BOOLEAN DEFAULT false,
        "canExpense" BOOLEAN DEFAULT false,
        "canViewSettings" BOOLEAN DEFAULT false,
        "canAddUser" BOOLEAN DEFAULT false,
        "canEditUser" BOOLEAN DEFAULT false,
        "canAddWarehouse" BOOLEAN DEFAULT false,
        "canBackup" BOOLEAN DEFAULT false,
        "canViewReports" BOOLEAN DEFAULT true,
        "canViewAccountStatement" BOOLEAN DEFAULT true,
        "canViewSalesReport" BOOLEAN DEFAULT true,
        "canViewPurchasesReport" BOOLEAN DEFAULT true,
        "canViewDailyMatching" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "Warehouse" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "branchId" TEXT REFERENCES "Branch"("id"),
        "isDefault" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "type" TEXT DEFAULT 'material',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "Material" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "code" TEXT,
        "categoryId" TEXT REFERENCES "Category"("id"),
        "unit" TEXT DEFAULT 'قطعة',
        "baseUnit" TEXT DEFAULT 'قطعة',
        "fillingType" TEXT DEFAULT 'single',
        "level1Name" TEXT,
        "level1Quantity" FLOAT,
        "level1SalePrice" FLOAT,
        "level2Name" TEXT,
        "level2Quantity" FLOAT,
        "level2SalePrice" FLOAT,
        "level3Name" TEXT,
        "level3Quantity" FLOAT,
        "level3SalePrice" FLOAT,
        "purchasePrice" FLOAT DEFAULT 0,
        "salePrice" FLOAT DEFAULT 0,
        "quantity" FLOAT DEFAULT 0,
        "minQuantity" FLOAT DEFAULT 0,
        "warehouseId" TEXT REFERENCES "Warehouse"("id"),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "Customer" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "carNumber" TEXT,
        "carType" TEXT,
        "odometer" INTEGER,
        "lastOdometer" INTEGER,
        "type" TEXT DEFAULT 'customer',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "SaleInvoice" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceNumber" TEXT UNIQUE DEFAULT gen_random_uuid()::text,
        "customerId" TEXT REFERENCES "Customer"("id"),
        "warehouseId" TEXT,
        "subtotal" FLOAT DEFAULT 0,
        "discount" FLOAT DEFAULT 0,
        "total" FLOAT DEFAULT 0,
        "paid" FLOAT DEFAULT 0,
        "remaining" FLOAT DEFAULT 0,
        "status" TEXT DEFAULT 'cash',
        "odometer" INTEGER,
        "notes" TEXT,
        "createdBy" TEXT,
        "branchId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "SaleItem" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceId" TEXT REFERENCES "SaleInvoice"("id") ON DELETE CASCADE,
        "materialId" TEXT REFERENCES "Material"("id"),
        "materialName" TEXT NOT NULL,
        "quantity" FLOAT DEFAULT 0,
        "price" FLOAT DEFAULT 0,
        "total" FLOAT DEFAULT 0,
        "filling" TEXT,
        "notes" TEXT,
        "warehouseId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "PurchaseInvoice" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceNumber" TEXT UNIQUE DEFAULT gen_random_uuid()::text,
        "supplierId" TEXT,
        "supplierName" TEXT,
        "warehouseId" TEXT,
        "subtotal" FLOAT DEFAULT 0,
        "discount" FLOAT DEFAULT 0,
        "total" FLOAT DEFAULT 0,
        "paid" FLOAT DEFAULT 0,
        "remaining" FLOAT DEFAULT 0,
        "status" TEXT DEFAULT 'cash',
        "notes" TEXT,
        "createdBy" TEXT,
        "branchId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "PurchaseItem" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceId" TEXT REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE,
        "materialId" TEXT REFERENCES "Material"("id"),
        "materialName" TEXT NOT NULL,
        "quantity" FLOAT DEFAULT 0,
        "price" FLOAT DEFAULT 0,
        "total" FLOAT DEFAULT 0,
        "notes" TEXT,
        "warehouseId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "voucherNumber" TEXT UNIQUE DEFAULT gen_random_uuid()::text,
        "description" TEXT NOT NULL,
        "amount" FLOAT DEFAULT 0,
        "category" TEXT,
        "branchId" TEXT,
        "notes" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "PaymentVoucher" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "voucherNumber" TEXT UNIQUE DEFAULT gen_random_uuid()::text,
        "amount" FLOAT DEFAULT 0,
        "customerId" TEXT REFERENCES "Customer"("id"),
        "paymentMethod" TEXT DEFAULT 'cash',
        "notes" TEXT,
        "createdBy" TEXT,
        "branchId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "PaymentDisbursement" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "voucherNumber" TEXT UNIQUE DEFAULT gen_random_uuid()::text,
        "amount" FLOAT DEFAULT 0,
        "customerId" TEXT REFERENCES "Customer"("id"),
        "paymentMethod" TEXT DEFAULT 'cash',
        "notes" TEXT,
        "createdBy" TEXT,
        "branchId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "FreeWashCoupon" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "couponCode" TEXT UNIQUE,
        "customerName" TEXT,
        "carNumber" TEXT DEFAULT '',
        "carType" TEXT DEFAULT '',
        "phone" TEXT DEFAULT '',
        "branchId" TEXT,
        "expiresAt" TIMESTAMP,
        "used" BOOLEAN DEFAULT false,
        "usedAt" TIMESTAMP,
        "customerId" TEXT,
        "invoiceId" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // التحقق من وجود فرع
    const branchResult = await pool.query('SELECT * FROM "Branch" LIMIT 1');
    let branchId: string;

    if (branchResult.rows.length === 0) {
      const newBranch = await pool.query(
        'INSERT INTO "Branch" (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
        ['الفرع الرئيسي', 'العنوان الافتراضي', '07700000000']
      );
      branchId = newBranch.rows[0].id;
    } else {
      branchId = branchResult.rows[0].id;
    }

    // التحقق من وجود مخزن
    const warehouseResult = await pool.query('SELECT * FROM "Warehouse" LIMIT 1');

    if (warehouseResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO "Warehouse" (name, "branchId", "isDefault") VALUES ($1, $2, $3)',
        ['المخزن الرئيسي', branchId, true]
      );
    }

    // التحقق من وجود مستخدم
    const userResult = await pool.query('SELECT * FROM "User" LIMIT 1');

    if (userResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);

      const newUser = await pool.query(
        'INSERT INTO "User" (name, phone, password, role, "branchId", "isActive") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['المدير العام', '0500000001', hashedPassword, 'admin', branchId, true]
      );

      const userId = newUser.rows[0].id;

      await pool.query(`
        INSERT INTO "Permission" ("userId", "canSale", "canChangePrice", "canCreditSale", "canViewPurchasePrice",
          "canEditSaleInvoice", "canDeleteSaleInvoice", "canEditSaleDate", "canGiveFreeWash", "canPartialPayment",
          "canPurchase", "canEditPurchaseInvoice", "canDeletePurchaseInvoice", "canPurchaseReturn",
          "canViewMaterials", "canEditMaterial", "canDeleteMaterial", "canAddMaterial",
          "canWarehouseTransfer", "canTransferBetweenBranches", "canTransferBetweenWarehouses",
          "canInventoryCount", "canInventoryAdjustment",
          "canViewAccounts", "canEditCustomer", "canEditSupplier", "canPaymentVoucher", "canPaymentDisbursement", "canExpense",
          "canViewSettings", "canAddUser", "canEditUser", "canAddWarehouse", "canBackup",
          "canViewReports", "canViewAccountStatement", "canViewSalesReport", "canViewPurchasesReport", "canViewDailyMatching")
        VALUES ($1, true, true, true, true, true, true, true, true, true,
          true, true, true, true, true, true, true, true, true, true, true, true, true,
          true, true, true, true, true, true, true, true, true, true, true,
          true, true, true, true, true)
      `, [userId]);
    }

    // جلب البيانات الحالية
    const users = await pool.query('SELECT id, name, phone, role FROM "User"');
    const branches = await pool.query('SELECT id, name FROM "Branch"');
    const warehouses = await pool.query('SELECT id, name FROM "Warehouse"');

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'تم إعداد قاعدة البيانات بنجاح!',
      data: {
        users: users.rows,
        branches: branches.rows,
        warehouses: warehouses.rows
      },
      login: {
        phone: '0500000001',
        password: '123456'
      }
    });

  } catch (error: any) {
    await pool.end();
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
