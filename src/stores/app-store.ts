import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== الأنواع ====================

export interface User {
  id: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
  permissions?: Permission;
  branchId?: string;
  branchIds?: string;
}

export interface Permission {
  canSale?: boolean;
  canPurchase?: boolean;
  canChangePrice?: boolean;
  canCreditSale?: boolean;
  canViewPurchasePrice?: boolean;
  canEditSaleInvoice?: boolean;
  canDeleteSaleInvoice?: boolean;
  canEditSaleDate?: boolean;
  canGiveFreeWash?: boolean;
  canPartialPayment?: boolean;
  canEditPurchaseInvoice?: boolean;
  canDeletePurchaseInvoice?: boolean;
  canPurchaseReturn?: boolean;
  canViewMaterials?: boolean;
  canEditMaterial?: boolean;
  canDeleteMaterial?: boolean;
  canAddMaterial?: boolean;
  canWarehouseTransfer?: boolean;
  canTransferBetweenBranches?: boolean;
  canTransferBetweenWarehouses?: boolean;
  canInventoryCount?: boolean;
  canInventoryAdjustment?: boolean;
  canViewAccounts?: boolean;
  canEditCustomer?: boolean;
  canEditSupplier?: boolean;
  canPaymentVoucher?: boolean;
  canPaymentDisbursement?: boolean;
  canExpense?: boolean;
  canViewSettings?: boolean;
  canAddUser?: boolean;
  canEditUser?: boolean;
  canAddWarehouse?: boolean;
  canBackup?: boolean;
  canViewReports?: boolean;
  canViewAccountStatement?: boolean;
  canViewSalesReport?: boolean;
  canViewPurchasesReport?: boolean;
  canViewDailyMatching?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  carNumber?: string;
  carType?: string;
  odometer?: number;
  lastOdometer?: number;
  type?: string;
}

export interface Material {
  id: string;
  name: string;
  code?: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  warehouseId?: string;
  fillingType?: string;
  level1Name?: string;
  level1Quantity?: number;
  level2Name?: string;
  level2Quantity?: number;
  level3Name?: string;
  level3Quantity?: number;
}

export interface SaleItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  price: number;
  total: number;
  filling?: string;
  notes?: string;
  warehouseId?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  warehouseId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  status: 'cash' | 'credit' | 'partial';
  odometer?: number;
  notes?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  branch?: { id: string; name: string };
  isDefault: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface OpenTab {
  id: string;
  type: string;
  title: string;
  data?: any;
}

// ==================== حالة التطبيق ====================

interface AppState {
  // المستخدم
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // التنقل
  activeTab: string;
  openTabs: OpenTab[];
  activeTabId: string | null;
  
  // الإعدادات
  theme: 'light' | 'dark';
  defaultWarehouse: string;
  defaultBranch: string;
  
  // الأفعال - المصادقة
  login: (user: User) => void;
  logout: () => void;
  
  // الأفعال - التنقل
  setActiveTab: (tab: string) => void;
  openNewTab: (type: string, title: string, data?: any) => string;
  closeTab: (id: string) => void;
  setActiveTabId: (id: string) => void;
  
  // الأفعال - الإعدادات
  setTheme: (theme: 'light' | 'dark') => void;
  setDefaultWarehouse: (id: string) => void;
  setDefaultBranch: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // القيم الافتراضية
      currentUser: null,
      isAuthenticated: false,
      activeTab: 'dashboard',
      openTabs: [],
      activeTabId: null,
      theme: 'light',
      defaultWarehouse: '',
      defaultBranch: '',
      
      // المصادقة
      login: (user) => set({ 
        currentUser: user, 
        isAuthenticated: true, 
        activeTab: 'dashboard',
        openTabs: [],
        activeTabId: null
      }),
      
      logout: () => set({ 
        currentUser: null, 
        isAuthenticated: false, 
        activeTab: 'dashboard',
        openTabs: [],
        activeTabId: null
      }),
      
      // التنقل
      setActiveTab: (tab) => set({ activeTab: tab, activeTabId: null }),
      
      openNewTab: (type, title, data) => {
        const id = `${type}-${Date.now()}`;
        set((state) => ({
          openTabs: [...state.openTabs, { id, type, title, data }],
          activeTabId: id,
        }));
        return id;
      },
      
      closeTab: (id) => set((state) => {
        const newTabs = state.openTabs.filter((t) => t.id !== id);
        const newActiveId = state.activeTabId === id 
          ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
          : state.activeTabId;
        return { openTabs: newTabs, activeTabId: newActiveId };
      }),
      
      setActiveTabId: (id) => set({ activeTabId: id }),
      
      // الإعدادات
      setTheme: (theme) => set({ theme }),
      setDefaultWarehouse: (id) => set({ defaultWarehouse: id }),
      setDefaultBranch: (id) => set({ defaultBranch: id }),
    }),
    {
      name: 'aldiaa-storage',
      partialize: (state) => ({
        theme: state.theme,
        defaultWarehouse: state.defaultWarehouse,
        defaultBranch: state.defaultBranch,
      }),
    }
  )
);
