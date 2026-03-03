/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Save,
  Printer,
  MessageCircle,
  Car,
  User,
  Phone,
  Hash,
  Settings,
  Gift,
  Percent,
  History,
  ChevronDown,
  Package,
  Trash2,
  Edit,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  unit: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  carNumber?: string;
  carType?: string;
  odometer?: number;
  lastOdometer?: number;
}

interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  branch?: { name: string };
}

interface SaleItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  price: number;
  total: number;
  filling?: string;
  notes?: string;
  warehouseId?: string;
  isNew: boolean;
}

interface SaleInvoiceFormProps {
  tabId?: string;
}

export function SaleInvoiceForm({ tabId }: SaleInvoiceFormProps) {
  const { currentUser, openNewTab, openTabs, closeTab } = useAppStore();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  
  const [items, setItems] = useState<SaleItem[]>([createEmptyItem()]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [discount, setDiscount] = useState(0);
  const [odometer, setOdometer] = useState<number | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  
  const [previousInvoices, setPreviousInvoices] = useState<any[]>([]);
  const [daysBack, setDaysBack] = useState(0);
  const [showPreviousInvoices, setShowPreviousInvoices] = useState(false);
  
  const [showFreeWashDialog, setShowFreeWashDialog] = useState(false);
  const [freeWashCoupon, setFreeWashCoupon] = useState<string>('');
  
  // جدول الأحجام
  const tableSizes = [
    { name: 'صغير', text: 'text-sm', padding: 'p-2', rowHeight: 'h-10', inputHeight: 'h-8' },
    { name: 'متوسط', text: 'text-base', padding: 'p-3', rowHeight: 'h-12', inputHeight: 'h-10' },
    { name: 'كبير', text: 'text-lg', padding: 'p-4', rowHeight: 'h-14', inputHeight: 'h-12' },
    { name: 'كبير جداً', text: 'text-xl', padding: 'p-5', rowHeight: 'h-16', inputHeight: 'h-14' },
  ];
  
  const [tableSizeIndex, setTableSizeIndex] = useState(2); // الافتراضي كبير
  
  // عرض أعمدة الجدول القابلة للتغيير
  const defaultColumnWidths = { material: 300, filling: 100, price: 120, quantity: 100, total: 120, notes: 100, actions: 50 };
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);
  
  // ارتفاع الجدول القابل للتغيير
  const defaultTableHeight = 400;
  const [tableHeight, setTableHeight] = useState(defaultTableHeight);
  const [resizingHeight, setResizingHeight] = useState<{ startY: number; startHeight: number } | null>(null);
  
  // Refs
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Create empty item
  function createEmptyItem(): SaleItem {
    return {
      id: `temp-${Date.now()}-${Math.random()}`,
      materialId: '',
      materialName: '',
      quantity: 0,
      price: 0,
      total: 0,
      isNew: true
    };
  }
  
  // Fetch data on mount
  useEffect(() => {
    fetchWarehouses();
    fetchPreviousInvoices(0);
    fetchUserSettings();
  }, []);
  
  // جلب إعدادات المستخدم
  const fetchUserSettings = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/users/settings?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.settings) {
        const settings = data.settings as Record<string, any>;
        if (settings.saleTableSize !== undefined) {
          setTableSizeIndex(settings.saleTableSize);
        }
        if (settings.saleColumnWidths) {
          setColumnWidths(settings.saleColumnWidths);
        }
        if (settings.saleTableHeight) {
          setTableHeight(settings.saleTableHeight);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
    }
  };
  
  // حفظ إعدادات المستخدم
  const saveTableSize = async (newIndex: number) => {
    setTableSizeIndex(newIndex);
    if (!currentUser?.id) return;
    try {
      await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          settings: { saleTableSize: newIndex }
        })
      });
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  };
  
  // حفظ ارتفاع الجدول
  const saveTableHeight = async (height: number) => {
    setTableHeight(height);
    if (!currentUser?.id) return;
    try {
      await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          settings: { saleTableHeight: height }
        })
      });
    } catch (error) {
      console.error('Failed to save table height:', error);
    }
  };
  
  // حفظ عرض الأعمدة
  const saveColumnWidths = async (widths: typeof columnWidths) => {
    setColumnWidths(widths);
    if (!currentUser?.id) return;
    try {
      await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          settings: { saleColumnWidths: widths }
        })
      });
    } catch (error) {
      console.error('Failed to save column widths:', error);
    }
  };
  
  // بدء تغيير حجم العمود
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column as keyof typeof columnWidths]
    });
  };
  
  // تغيير حجم العمود أثناء السحب
  useEffect(() => {
    if (!resizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = resizing.startX - e.clientX; // عكس الاتجاه للـ RTL
      const newWidth = Math.max(50, Math.min(500, resizing.startWidth + diff));
      const newWidths = { ...columnWidths, [resizing.column]: newWidth };
      setColumnWidths(newWidths);
    };
    
    const handleMouseUp = () => {
      saveColumnWidths(columnWidths);
      setResizing(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);
  
  // بدء تغيير ارتفاع الجدول
  const handleHeightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizingHeight({
      startY: e.clientY,
      startHeight: tableHeight
    });
  };
  
  // تغيير ارتفاع الجدول أثناء السحب
  useEffect(() => {
    if (!resizingHeight) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - resizingHeight.startY;
      const newHeight = Math.max(200, Math.min(800, resizingHeight.startHeight + diff));
      setTableHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      saveTableHeight(tableHeight);
      setResizingHeight(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingHeight]);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;
  
  // Fetch functions
  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      setWarehouses(data.warehouses || []);
      if (data.warehouses?.length > 0) {
        setSelectedWarehouse(data.warehouses[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };
  
  const fetchPreviousInvoices = async (days: number) => {
    try {
      const res = await fetch(`/api/sales?days=${days}`);
      const data = await res.json();
      setPreviousInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch previous invoices:', error);
    }
  };
  
  const searchCustomers = async (query: string) => {
    if (!query) {
      setCustomers([]);
      return;
    }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  };
  
  const searchMaterials = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/materials?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.materials || []);
    } catch (error) {
      console.error('Failed to search materials:', error);
    }
  };
  
  // Handlers
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerSearch(false);
    if (customer.odometer) {
      setOdometer(undefined);
    }
  };
  
  const handleNewCustomer = async (data: { name: string; phone: string; carNumber: string; carType: string }) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        setSelectedCustomer(result.customer);
        setCustomerSearch(result.customer.name);
        setShowNewCustomerDialog(false);
        toast.success('تم إضافة الزبون بنجاح');
      }
    } catch (error) {
      toast.error('حدث خطأ في إضافة الزبون');
    }
  };
  
  const handleMaterialSelect = (material: Material, index: number) => {
    const newItems = [...items];
    newItems[index] = {
      id: `item-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      quantity: 1,
      price: material.salePrice,
      total: material.salePrice,
      isNew: false
    };
    
    // Add new empty row if this was the last row
    if (index === items.length - 1) {
      newItems.push(createEmptyItem());
    }
    
    setItems(newItems);
    setMaterialSearch('');
    setShowMaterialSearch(false);
    setSearchResults([]);
  };
  
  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    
    setItems(newItems);
  };
  
  const handleDeleteItem = (index: number) => {
    if (items.length === 1) {
      setItems([createEmptyItem()]);
    } else {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };
  
  const handleGenerateFreeWash = () => {
    if (!selectedCustomer?.phone || !selectedCustomer?.carNumber) {
      toast.error('يجب تحديد الزبون ورقم السيارة أولاً');
      return;
    }
    
    // Generate coupon code
    const couponCode = `${selectedCustomer.phone}${selectedCustomer.carNumber}`;
    setFreeWashCoupon(couponCode);
    setShowFreeWashDialog(true);
    
    // Save coupon to database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 23);
    
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'coupon',
        phone: selectedCustomer.phone,
        carNumber: selectedCustomer.carNumber,
        customerId: selectedCustomer.id,
        expiresAt: expiresAt.toISOString()
      })
    });
  };
  
  const handleSave = async (printAfter = false) => {
    // Validate
    const validItems = items.filter(item => item.materialId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('يجب إضافة مواد للقائمة');
      return;
    }
    
    try {
      const invoiceData = {
        customerId: selectedCustomer?.id || null,
        warehouseId: selectedWarehouse,
        items: validItems.map(item => ({
          materialId: item.materialId,
          materialName: item.materialName,
          quantity: item.quantity,
          price: item.price,
          filling: item.filling,
          notes: item.notes
        })),
        discount,
        status: paymentStatus,
        paid: paymentStatus === 'cash' ? total : paymentStatus === 'partial' ? paidAmount : 0,
        odometer,
        createdBy: currentUser?.id
      };
      
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('تم حفظ قائمة البيع بنجاح');
        
        // Reset form
        setItems([createEmptyItem()]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setDiscount(0);
        setOdometer(undefined);
        setPaymentStatus('cash');
        setPaidAmount(0);
        
        if (printAfter) {
          // Handle printing
          window.print();
        }
        
        // Update customer odometer
        if (selectedCustomer && odometer) {
          await fetch('/api/customers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedCustomer.id,
              odometer,
              lastOdometer: selectedCustomer.odometer
            })
          });
        }
      }
    } catch (error) {
      toast.error('حدث خطأ في حفظ القائمة');
    }
  };
  
  const handleOpenPreviousInvoice = (invoice: any) => {
    // Open invoice in new tab
    openNewTab('sale-invoice', `قائمة ${invoice.invoiceNumber}`, { invoiceId: invoice.id });
    setShowPreviousInvoices(false);
  };
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    const totalRows = items.length;
    
    switch (e.key) {
      case 'Tab':
        // Let default tab behavior work
        break;
      case 'Enter':
        e.preventDefault();
        if (field === 'materialName') {
          const input = (e.target as HTMLInputElement).value;
          if (input && searchResults.length > 0) {
            handleMaterialSelect(searchResults[0], rowIndex);
          }
        } else if (rowIndex < totalRows - 1) {
          // Move to next row
          const nextRef = inputRefs.current[`row-${rowIndex + 1}-materialName`];
          nextRef?.focus();
        }
        break;
      case 'ArrowDown':
        if (rowIndex < totalRows - 1) {
          e.preventDefault();
          const downRef = inputRefs.current[`row-${rowIndex + 1}-${field}`];
          downRef?.focus();
        }
        break;
      case 'ArrowUp':
        if (rowIndex > 0) {
          e.preventDefault();
          const upRef = inputRefs.current[`row-${rowIndex - 1}-${field}`];
          upRef?.focus();
        }
        break;
    }
  };
  
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">قائمة بيع جديدة</h1>
          <p className="text-muted-foreground">إنشاء قائمة بيع جديدة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreviousInvoices(true)}>
            <History className="w-4 h-4 ml-2" />
            قوائم سابقة ({daysBack})
          </Button>
          <Button variant="outline" onClick={() => setDaysBack(d => d + 1)} className="px-3">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Customer Section */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Search */}
            <div className="relative">
              <Label>الزبون</Label>
              <div className="relative mt-1">
                <Input
                  placeholder="بحث عن زبون..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    searchCustomers(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              {/* Customer Search Results */}
              {showCustomerSearch && customers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full p-3 text-right hover:bg-muted flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>{customer.name}</span>
                      {customer.phone && <span className="text-muted-foreground text-sm">({customer.phone})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Add Customer Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setShowNewCustomerDialog(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة زبون جديد
              </Button>
            </div>
            
            {/* Warehouse Select */}
            <div>
              <Label>المخزن</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المخزن" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} {wh.branch?.name && `(${wh.branch.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Customer Info */}
          {selectedCustomer && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الاسم:</span>
                  <span className="font-medium mr-2">{selectedCustomer.name}</span>
                </div>
                {selectedCustomer.phone && (
                  <div>
                    <span className="text-muted-foreground">الهاتف:</span>
                    <span className="font-medium mr-2">{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.carNumber && (
                  <div>
                    <span className="text-muted-foreground">رقم السيارة:</span>
                    <span className="font-medium mr-2">{selectedCustomer.carNumber}</span>
                  </div>
                )}
                {selectedCustomer.carType && (
                  <div>
                    <span className="text-muted-foreground">نوع السيارة:</span>
                    <span className="font-medium mr-2">{selectedCustomer.carType}</span>
                  </div>
                )}
              </div>
              
              {/* Odometer */}
              <div className="mt-3 flex items-center gap-4">
                <div>
                  <Label className="text-sm">عداد الكيلومترات</Label>
                  <Input
                    type="number"
                    placeholder="العداد الحالي"
                    value={odometer || ''}
                    onChange={(e) => setOdometer(parseInt(e.target.value) || undefined)}
                    className="w-40 mt-1"
                  />
                </div>
                {selectedCustomer.odometer && (
                  <div className="text-sm text-muted-foreground">
                    آخر عداد: {selectedCustomer.odometer.toLocaleString()} كم
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Items Table */}
      <Card className="flex-1">
        <CardContent className="p-0">
          {/* Table Size Controls */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
            <span className="text-sm text-muted-foreground">حجم الجدول: {tableSizes[tableSizeIndex].name}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={tableSizeIndex === 0}
                onClick={() => saveTableSize(tableSizeIndex - 1)}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={tableSizeIndex === tableSizes.length - 1}
                onClick={() => saveTableSize(tableSizeIndex + 1)}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div 
            className="overflow-x-auto overflow-y-auto" 
            style={{ height: `${tableHeight}px`, maxHeight: '800px', minHeight: '200px' }}
          >
            <table ref={tableRef} className={`w-full ${tableSizes[tableSizeIndex].text}`} style={{ tableLayout: 'fixed' }}>
              <thead className="bg-muted/50">
                <tr>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.material }}
                  >
                    المادة
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 group-hover:bg-blue-300 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'material')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.filling }}
                  >
                    التعبئة
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 group-hover:bg-blue-300 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'filling')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.price }}
                  >
                    السعر
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 group-hover:bg-blue-300 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'price')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.quantity }}
                  >
                    العدد
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 group-hover:bg-blue-300 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'quantity')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.total }}
                  >
                    المجموع
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 group-hover:bg-blue-300 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'total')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.notes }}
                  >
                    ملاحظة
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 group-hover:bg-blue-300 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'notes')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding}`}
                    style={{ width: columnWidths.actions }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className={`border-t ${tableSizes[tableSizeIndex].rowHeight}`}>
                    {/* Material Name */}
                    <td className={`${tableSizes[tableSizeIndex].padding} relative overflow-hidden`}>
                      <Input
                        ref={(el) => { if (el) inputRefs.current[`row-${index}-materialName`] = el }}
                        placeholder="اسم المادة"
                        value={item.materialName || materialSearch}
                        onChange={(e) => {
                          setMaterialSearch(e.target.value);
                          searchMaterials(e.target.value);
                          setShowMaterialSearch(index === currentItemIndex);
                          handleItemChange(index, 'materialName', e.target.value);
                        }}
                        onFocus={() => {
                          setCurrentItemIndex(index);
                          if (materialSearch) {
                            searchMaterials(materialSearch);
                            setShowMaterialSearch(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown items
                          setTimeout(() => setShowMaterialSearch(false), 200);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'materialName')}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text} w-full`}
                      />
                      
                      {/* Material Search Results Dropdown */}
                      <AnimatePresence>
                        {showMaterialSearch && currentItemIndex === index && searchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 bg-white border rounded-lg shadow-xl z-50 mt-1"
                            style={{ top: '100%' }}
                          >
                            {searchResults.map((material) => (
                              <button
                                key={material.id}
                                onMouseDown={() => handleMaterialSelect(material, index)}
                                className="w-full p-3 text-right hover:bg-blue-50 border-b last:border-b-0 flex items-center gap-3 transition-colors"
                              >
                                <Package className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{material.name}</div>
                                  <div className="text-sm text-gray-500 flex gap-4">
                                    <span>الرصيد: {material.quantity} {material.unit}</span>
                                    <span className="text-green-600 font-medium">السعر: {material.salePrice.toLocaleString()}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                    
                    {/* Filling */}
                    <td className={tableSizes[tableSizeIndex].padding}>
                      <Input
                        ref={(el) => { if (el) inputRefs.current[`row-${index}-filling`] = el }}
                        placeholder="تعبئة"
                        value={item.filling || ''}
                        onChange={(e) => handleItemChange(index, 'filling', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'filling')}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text}`}
                      />
                    </td>
                    
                    {/* Price */}
                    <td className={tableSizes[tableSizeIndex].padding}>
                      <Input
                        type="number"
                        placeholder="السعر"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'price')}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text}`}
                      />
                    </td>
                    
                    {/* Quantity */}
                    <td className={tableSizes[tableSizeIndex].padding}>
                      <Input
                        type="number"
                        placeholder="العدد"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text}`}
                      />
                    </td>
                    
                    {/* Total */}
                    <td className={tableSizes[tableSizeIndex].padding}>
                      <div className={`font-semibold px-3 ${tableSizes[tableSizeIndex].text}`}>
                        {item.total > 0 ? item.total.toLocaleString() : '-'}
                      </div>
                    </td>
                    
                    {/* Notes */}
                    <td className={tableSizes[tableSizeIndex].padding}>
                      <Input
                        placeholder="ملاحظة"
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text}`}
                      />
                    </td>
                    
                    {/* Delete */}
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* مقبض تغيير ارتفاع الجدول */}
          <div 
            className="h-2 bg-muted hover:bg-blue-400 cursor-row-resize flex items-center justify-center transition-colors group"
            onMouseDown={handleHeightResizeStart}
          >
            <div className="w-16 h-1 bg-gray-400 group-hover:bg-blue-600 rounded-full transition-colors" />
          </div>
        </CardContent>
      </Card>
      
      {/* Summary & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Summary */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-medium">{subtotal.toLocaleString()} د.ع</span>
            </div>
            
            {/* Discount */}
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">الخصم:</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <Button variant="outline" size="icon" onClick={() => setDiscount(total * 0.1)}>
                <Percent className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xl font-bold pt-2 border-t">
              <span>المجموع:</span>
              <span className="text-green-600">{total.toLocaleString()} د.ع</span>
            </div>
            
            {/* Payment Status */}
            <div className="pt-2 border-t">
              <Label>حالة الدفع</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={paymentStatus === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentStatus('cash')}
                  className="flex-1"
                >
                  نقد
                </Button>
                <Button
                  variant={paymentStatus === 'credit' ? 'default' : 'outline'}
                  onClick={() => setPaymentStatus('credit')}
                  className="flex-1"
                >
                  آجل
                </Button>
                <Button
                  variant={paymentStatus === 'partial' ? 'default' : 'outline'}
                  onClick={() => setPaymentStatus('partial')}
                  className="flex-1"
                >
                  جزئي
                </Button>
              </div>
              
              {paymentStatus === 'partial' && (
                <div className="mt-3">
                  <Label>المبلغ المدفوع</Label>
                  <Input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    المتبقي: {(total - paidAmount).toLocaleString()} د.ع
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleSave(false)} className="h-9 bg-green-600 hover:bg-green-700 text-sm">
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </Button>
              <Button onClick={() => handleSave(true)} variant="outline" className="h-9 text-sm">
                <Printer className="w-4 h-4 ml-1" />
                حفظ وطباعة
              </Button>
              <Button variant="outline" className="h-9 text-sm">
                <MessageCircle className="w-4 h-4 ml-1" />
                واتساب
              </Button>
              <Button variant="outline" onClick={handleGenerateFreeWash} className="h-9 text-sm">
                <Gift className="w-4 h-4 ml-1" />
                غسل مجاني
              </Button>
              <Button variant="destructive" className="h-9 col-span-2 text-sm" onClick={() => {
                setItems([createEmptyItem()]);
                setSelectedCustomer(null);
                setCustomerSearch('');
                setDiscount(0);
              }}>
                <Trash2 className="w-4 h-4 ml-1" />
                إلغاء القائمة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة زبون جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleNewCustomer({
              name: formData.get('name') as string,
              phone: formData.get('phone') as string,
              carNumber: formData.get('carNumber') as string,
              carType: formData.get('carType') as string
            });
          }}>
            <div className="space-y-4 py-4">
              <div>
                <Label>الاسم *</Label>
                <Input name="name" required className="mt-1" />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input name="phone" type="tel" className="mt-1" />
              </div>
              <div>
                <Label>رقم السيارة</Label>
                <Input name="carNumber" className="mt-1" />
              </div>
              <div>
                <Label>نوع السيارة</Label>
                <Input name="carType" className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Free Wash Coupon Dialog */}
      <Dialog open={showFreeWashDialog} onOpenChange={setShowFreeWashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كوبون غسل مجاني</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="text-lg mb-2">تم إنشاء الكوبون بنجاح!</div>
            <div className="bg-muted p-4 rounded-lg text-2xl font-mono font-bold tracking-wider">
              {freeWashCoupon}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              صالح لمدة 23 ساعة
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFreeWashDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Previous Invoices Dialog */}
      <Dialog open={showPreviousInvoices} onOpenChange={setShowPreviousInvoices}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>قوائم البيع السابقة</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal">عدد الأيام:</span>
                <Input
                  type="number"
                  value={daysBack}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 0;
                    setDaysBack(days);
                    fetchPreviousInvoices(days);
                  }}
                  className="w-20"
                />
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {previousInvoices.length > 0 ? (
              <div className="space-y-2">
                {previousInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer flex items-center justify-between"
                    onClick={() => handleOpenPreviousInvoice(invoice)}
                  >
                    <div>
                      <div className="font-medium">{invoice.customer?.name || 'زبون نقدي'}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleString('ar-SA')}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{invoice.total.toLocaleString()} د.ع</div>
                      <Badge variant={
                        invoice.status === 'cash' ? 'default' :
                        invoice.status === 'credit' ? 'destructive' : 'secondary'
                      }>
                        {invoice.status === 'cash' ? 'نقد' :
                         invoice.status === 'credit' ? 'آجل' : 'جزئي'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد قوائم في هذه الفترة
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
