'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Receipt,
  ArrowRightLeft,
  ClipboardList,
  ReceiptIndianRupee,
  Banknote,
  HandCoins,
  Car,
  Gift,
  BarChart3,
  Wallet,
  Building2
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardContent } from './DashboardContent';
import { SaleInvoiceForm } from '@/components/sales/SaleInvoiceForm';
import { SalesReport } from '@/components/sales/SalesReport';
import { PurchaseInvoiceForm } from '@/components/purchases/PurchaseInvoiceForm';
import { PurchasesReport } from '@/components/purchases/PurchasesReport';
import { PurchaseReturn } from '@/components/purchases/PurchaseReturn';
import { MaterialsList } from '@/components/inventory/MaterialsList';
import { WarehousesList } from '@/components/inventory/WarehousesList';
import { TransferForm } from '@/components/inventory/TransferForm';
import { TransferReport } from '@/components/inventory/TransferReport';
import { InventoryCount } from '@/components/inventory/InventoryCount';
import { InventoryAdjustment } from '@/components/inventory/InventoryAdjustment';
import { CustomersList } from '@/components/accounts/CustomersList';
import { AccountStatement } from '@/components/accounts/AccountStatement';
import { AccountsPage } from '@/components/accounts/AccountsPage';
import { ReceiptVoucher } from '@/components/vouchers/ReceiptVoucher';
import { PaymentVoucher } from '@/components/vouchers/PaymentVoucher';
import { ExpenseVoucher } from '@/components/vouchers/ExpenseVoucher';
import { FreeWashCoupons } from '@/components/coupons/FreeWashCoupons';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { BranchesManagement } from '@/components/branches/BranchesManagement';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  {
    id: 'sales',
    label: 'المبيعات',
    icon: ShoppingCart,
    children: [
      { id: 'sale-invoice', label: 'قائمة بيع', icon: Receipt },
      { id: 'sales-report', label: 'كشف مبيعات', icon: FileText },
    ]
  },
  {
    id: 'purchases',
    label: 'المشتريات',
    icon: Package,
    children: [
      { id: 'purchase-invoice', label: 'قائمة شراء', icon: Receipt },
      { id: 'purchase-return', label: 'إرجاع شراء', icon: ReceiptIndianRupee },
      { id: 'purchases-report', label: 'كشف مشتريات', icon: FileText },
    ]
  },
  {
    id: 'inventory',
    label: 'إدارة المخازن',
    icon: Warehouse,
    children: [
      { id: 'materials', label: 'عرض المواد', icon: Package },
      { id: 'warehouses', label: 'المخازن', icon: Warehouse },
      { id: 'transfer', label: 'نقل مخزني', icon: ArrowRightLeft },
      { id: 'transfer-report', label: 'كشف نقل مخزني', icon: FileText },
      { id: 'inventory-count', label: 'جرد مخزني', icon: ClipboardList },
      { id: 'inventory-adjustment', label: 'تسوية مخزنية', icon: ClipboardList },
    ]
  },
  {
    id: 'vouchers',
    label: 'السندات',
    icon: Banknote,
    children: [
      { id: 'receipt-voucher', label: 'سند قبض', icon: HandCoins },
      { id: 'payment-voucher', label: 'سند دفع', icon: Banknote },
      { id: 'expense-voucher', label: 'سند صرف', icon: Receipt },
    ]
  },
  { id: 'customers', label: 'العملاء', icon: Users },
  {
    id: 'accounts',
    label: 'الحسابات',
    icon: FileText,
    children: [
      { id: 'accounts-page', label: 'عرض الحسابات', icon: Users },
      { id: 'account-statement', label: 'كشف حساب', icon: FileText },
    ]
  },
  { id: 'coupons', label: 'كوبونات الغسيل', icon: Gift },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'cash', label: 'إدارة الصندوق', icon: Wallet },
  { id: 'branches', label: 'إدارة الفروع', icon: Building2 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

// Sidebar Item Component - خارج المكون الرئيسي
interface SidebarItemProps {
  item: SidebarItem;
  level: number;
  activeTab: string;
  expandedItems: string[];
  onItemClick: (item: SidebarItem) => void;
}

const SidebarItemComponent = memo(function SidebarItemComponent({ 
  item, 
  level, 
  activeTab, 
  expandedItems, 
  onItemClick 
}: SidebarItemProps) {
  const isActive = activeTab === item.id;
  const isExpanded = expandedItems.includes(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  return (
    <div>
      <button
        onClick={() => onItemClick(item)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? 'bg-gradient-to-l from-amber-400 to-amber-500 text-sidebar font-semibold'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        } ${level > 0 ? 'pr-8' : ''}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-right">{item.label}</span>
        {hasChildren && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 mr-4 space-y-1">
              {item.children!.map((child) => (
                <SidebarItemComponent
                  key={child.id}
                  item={child}
                  level={level + 1}
                  activeTab={activeTab}
                  expandedItems={expandedItems}
                  onItemClick={onItemClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export function MainDashboard() {
  const { currentUser, logout, activeTab, setActiveTab, openTabs, openNewTab, closeTab, activeTabId, setActiveTabId } = useAppStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['sales', 'purchases', 'inventory', 'vouchers', 'accounts']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const handleItemClick = useCallback((item: SidebarItem) => {
    if (item.children) {
      toggleExpand(item.id);
    } else {
      setActiveTab(item.id);
      setIsMobileMenuOpen(false);
    }
  }, [toggleExpand, setActiveTab]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Render content based on active tab
  const renderContent = useCallback(() => {
    // Check for open tabs
    const activeOpenTab = openTabs.find(t => t.id === activeTabId);
    if (activeOpenTab) {
      switch (activeOpenTab.type) {
        case 'sale-invoice':
          return <SaleInvoiceForm tabId={activeOpenTab.id} />;
        case 'purchase-invoice':
          return <PurchaseInvoiceForm tabId={activeOpenTab.id} />;
        default:
          return <DashboardContent />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'sale-invoice':
        return <SaleInvoiceForm />;
      case 'sales-report':
        return <SalesReport />;
      case 'purchase-invoice':
        return <PurchaseInvoiceForm />;
      case 'purchase-return':
        return <PurchaseReturn />;
      case 'purchases-report':
        return <PurchasesReport />;
      case 'materials':
        return <MaterialsList />;
      case 'warehouses':
        return <WarehousesList />;
      case 'transfer':
        return <TransferForm />;
      case 'transfer-report':
        return <TransferReport />;
      case 'inventory-count':
        return <InventoryCount />;
      case 'inventory-adjustment':
        return <InventoryAdjustment />;
      case 'customers':
        return <CustomersList />;
      case 'accounts-page':
        return <AccountsPage />;
      case 'account-statement':
        return <AccountStatement />;
      case 'receipt-voucher':
        return <ReceiptVoucher />;
      case 'payment-voucher':
        return <PaymentVoucher />;
      case 'expense-voucher':
        return <ExpenseVoucher />;
      case 'coupons':
        return <FreeWashCoupons />;
      case 'settings':
        return <SettingsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'cash':
        return <SalesReport />;
      case 'branches':
        return <BranchesManagement />;
      default:
        return <DashboardContent />;
    }
  }, [activeTab, activeTabId, openTabs]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative lg:flex flex-col h-screen bg-sidebar z-40 shadow-xl w-72 overflow-hidden ${
          isMobileMenuOpen ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Menu Items - قابل للتمرير */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => (
              <SidebarItemComponent
                key={item.id}
                item={item}
                level={0}
                activeTab={activeTab}
                expandedItems={expandedItems}
                onItemClick={handleItemClick}
              />
            ))}
          </nav>
        </div>

        {/* Logout Button - صغير في الركن */}
        <div className="flex-shrink-0 p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-sidebar-foreground/70 hover:bg-red-500/20 hover:text-red-400 justify-center gap-1.5 h-8 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Open Tabs Bar */}
        {openTabs.length > 0 && (
          <div className="bg-white border-b shadow-sm">
            <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors min-w-max ${
                    activeTabId === tab.id
                      ? 'bg-background border-t border-x text-primary font-medium'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="text-sm">{tab.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
