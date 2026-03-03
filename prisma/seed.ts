import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create branches
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch' },
    create: {
      id: 'default-branch',
      name: 'الفرع الرئيسي',
      address: 'العنوان الرئيسي',
      phone: '0123456789',
    },
    update: {},
  });
  console.log('✅ Created branch:', branch.name);

  // Create warehouses
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'default-warehouse' },
    create: {
      id: 'default-warehouse',
      name: 'المخزن الرئيسي',
      branchId: branch.id,
      isDefault: true,
    },
    update: {},
  });
  console.log('✅ Created warehouse:', warehouse.name);

  // Create category
  const category = await prisma.category.upsert({
    where: { id: 'default-category' },
    create: {
      id: 'default-category',
      name: 'وقود',
      type: 'material',
    },
    update: {},
  });
  console.log('✅ Created categories');

  // Create materials
  const materials = [
    { name: 'بنزين 91', purchasePrice: 2.0, salePrice: 2.5, quantity: 10000, unit: 'لتر' },
    { name: 'بنزين 95', purchasePrice: 2.2, salePrice: 2.7, quantity: 8000, unit: 'لتر' },
    { name: 'ديزل', purchasePrice: 1.8, salePrice: 2.2, quantity: 15000, unit: 'لتر' },
    { name: 'زيت محرك 5W30', purchasePrice: 80, salePrice: 100, quantity: 50, unit: 'قطعة' },
    { name: 'زيت محرك 10W40', purchasePrice: 70, salePrice: 90, quantity: 40, unit: 'قطعة' },
    { name: 'زيت فرامل', purchasePrice: 30, salePrice: 45, quantity: 30, unit: 'قطعة' },
    { name: 'مياه تبريد', purchasePrice: 15, salePrice: 25, quantity: 20, unit: 'قطعة' },
    { name: 'فلاتر زيت', purchasePrice: 25, salePrice: 40, quantity: 100, unit: 'قطعة' },
    { name: 'فلاتر هواء', purchasePrice: 20, salePrice: 35, quantity: 60, unit: 'قطعة' },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: { id: `material-${material.name}` },
      create: {
        id: `material-${material.name}`,
        name: material.name,
        purchasePrice: material.purchasePrice,
        salePrice: material.salePrice,
        quantity: material.quantity,
        unit: material.unit,
        baseUnit: material.unit,
        warehouseId: warehouse.id,
        categoryId: category.id,
      },
      update: {},
    });
  }
  console.log('✅ Created materials:', materials.length);

  // Create users with permissions
  const users = [
    { 
      name: 'مدير النظام', 
      phone: '0500000001',
      password: '123456', 
      role: 'admin',
      permissions: {
        canSale: true,
        canPurchase: true,
        canChangePrice: true,
        canCreditSale: true,
        canViewPurchasePrice: true,
        canEditSaleInvoice: true,
        canDeleteSaleInvoice: true,
        canEditSaleDate: true,
        canGiveFreeWash: true,
        canPartialPayment: true,
        canEditPurchaseInvoice: true,
        canDeletePurchaseInvoice: true,
        canPurchaseReturn: true,
        canViewMaterials: true,
        canEditMaterial: true,
        canDeleteMaterial: true,
        canAddMaterial: true,
        canWarehouseTransfer: true,
        canTransferBetweenBranches: true,
        canTransferBetweenWarehouses: true,
        canInventoryCount: true,
        canInventoryAdjustment: true,
        canViewAccounts: true,
        canEditCustomer: true,
        canEditSupplier: true,
        canPaymentVoucher: true,
        canPaymentDisbursement: true,
        canExpense: true,
        canViewSettings: true,
        canAddUser: true,
        canEditUser: true,
        canAddWarehouse: true,
        canBackup: true,
        canViewReports: true,
        canViewAccountStatement: true,
        canViewSalesReport: true,
        canViewPurchasesReport: true,
        canViewDailyMatching: true,
      }
    },
    { 
      name: 'محمد', 
      phone: '0500000002',
      password: '123456', 
      role: 'user',
      permissions: {
        canSale: true,
        canPurchase: false,
        canChangePrice: false,
        canCreditSale: true,
        canViewPurchasePrice: false,
        canEditSaleInvoice: false,
        canDeleteSaleInvoice: false,
        canEditSaleDate: false,
        canGiveFreeWash: true,
        canPartialPayment: true,
        canViewMaterials: true,
        canViewReports: true,
      }
    },
    { 
      name: 'أحمد', 
      phone: '0500000003',
      password: '123456', 
      role: 'user',
      permissions: {
        canSale: true,
        canPurchase: true,
        canChangePrice: false,
        canCreditSale: false,
        canViewPurchasePrice: false,
        canGiveFreeWash: false,
        canPartialPayment: false,
        canViewMaterials: true,
        canViewReports: true,
      }
    },
    { 
      name: 'خالد', 
      phone: '0500000004',
      password: '123456', 
      role: 'manager',
      permissions: {
        canSale: true,
        canPurchase: true,
        canChangePrice: true,
        canCreditSale: true,
        canViewPurchasePrice: true,
        canEditSaleInvoice: true,
        canDeleteSaleInvoice: true,
        canGiveFreeWash: true,
        canPartialPayment: true,
        canEditPurchaseInvoice: true,
        canDeletePurchaseInvoice: true,
        canPurchaseReturn: true,
        canViewMaterials: true,
        canEditMaterial: true,
        canAddMaterial: true,
        canWarehouseTransfer: true,
        canInventoryCount: true,
        canViewAccounts: true,
        canPaymentVoucher: true,
        canPaymentDisbursement: true,
        canViewReports: true,
        canViewAccountStatement: true,
        canViewSalesReport: true,
        canViewPurchasesReport: true,
        canViewDailyMatching: true,
      }
    },
  ];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { id: `user-${user.name}` },
      create: {
        id: `user-${user.name}`,
        name: user.name,
        phone: user.phone,
        password: user.password,
        role: user.role,
        branchId: branch.id,
      },
      update: {},
    });

    // Create permissions for user
    if (user.permissions) {
      await prisma.permission.upsert({
        where: { userId: createdUser.id },
        create: {
          userId: createdUser.id,
          ...user.permissions,
        },
        update: user.permissions,
      });
    }
  }
  console.log('✅ Created users:', users.map(u => u.name).join(', '));

  // Create sample customers
  const customers = [
    { name: 'عميل نقدي', type: 'customer' },
    { name: 'شركة الأمل', phone: '0551234567', type: 'customer' },
    { name: 'محمد أحمد', phone: '0559876543', carNumber: 'ABC 123', carType: 'تويوتا كامري', type: 'customer' },
    { name: 'مورد الوقود', type: 'supplier' },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: `customer-${customer.name}` },
      create: {
        id: `customer-${customer.name}`,
        name: customer.name,
        phone: customer.phone || null,
        carNumber: customer.carNumber || null,
        carType: customer.carType || null,
        type: customer.type,
      },
      update: {},
    });
  }
  console.log('✅ Created customers:', customers.length);

  // Create cash register
  await prisma.cashRegister.upsert({
    where: { id: 'default-register' },
    create: {
      id: 'default-register',
      branchId: branch.id,
      balance: 0,
    },
    update: {},
  });
  console.log('✅ Created cash register');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Default Login Credentials:');
  console.log('   مدير النظام: 123456');
  console.log('   محمد: 123456');
  console.log('   أحمد: 123456');
  console.log('   خالد: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
