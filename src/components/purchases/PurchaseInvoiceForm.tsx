/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Save, Printer, MessageCircle, Package, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  unit: string;
}

interface Warehouse {
  id: string;
  name: string;
  branch?: { name: string };
}

interface PurchaseItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  isNew: boolean;
}

interface PurchaseInvoiceFormProps {
  tabId?: string;
}

export function PurchaseInvoiceForm({ tabId }: PurchaseInvoiceFormProps) {
  const { currentUser } = useAppStore();
  
  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [supplierName, setSupplierName] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  
  const [items, setItems] = useState<PurchaseItem[]>([createEmptyItem()]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [showNewMaterialDialog, setShowNewMaterialDialog] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  
  // جدول الأحجام
  const tableSizes = [
    { name: 'صغير', text: 'text-sm', padding: 'p-2', rowHeight: 'h-10', inputHeight: 'h-8' },
    { name: 'متوسط', text: 'text-base', padding: 'p-3', rowHeight: 'h-12', inputHeight: 'h-10' },
    { name: 'كبير', text: 'text-lg', padding: 'p-4', rowHeight: 'h-14', inputHeight: 'h-12' },
    { name: 'كبير جداً', text: 'text-xl', padding: 'p-5', rowHeight: 'h-16', inputHeight: 'h-14' },
  ];
  
  const [tableSizeIndex, setTableSizeIndex] = useState(2); // الافتراضي كبير
  
  // عرض أعمدة الجدول القابلة للتغيير
  const defaultColumnWidths = { material: 300, price: 120, quantity: 100, total: 120, notes: 100, actions: 50 };
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);
  
  // ارتفاع الجدول القابل للتغيير
  const defaultTableHeight = 400;
  const [tableHeight, setTableHeight] = useState(defaultTableHeight);
  const [resizingHeight, setResizingHeight] = useState<{ startY: number; startHeight: number } | null>(null);
  
  // Refs
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Create empty item
  function createEmptyItem(): PurchaseItem {
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
        if (settings.purchaseTableSize !== undefined) {
          setTableSizeIndex(settings.purchaseTableSize);
        }
        if (settings.purchaseColumnWidths) {
          setColumnWidths(settings.purchaseColumnWidths);
        }
        if (settings.purchaseTableHeight) {
          setTableHeight(settings.purchaseTableHeight);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
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
          settings: { purchaseTableHeight: height }
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
          settings: { purchaseColumnWidths: widths }
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
      const diff = resizing.startX - e.clientX;
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
          settings: { purchaseTableSize: newIndex }
        })
      });
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  };
  
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
  
  const searchMaterials = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/materials?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.materials || []);
      
      // If no results, show option to add new material
      if (data.materials?.length === 0) {
        setNewMaterialName(query);
      }
    } catch (error) {
      console.error('Failed to search materials:', error);
    }
  };
  
  // Handlers
  const handleMaterialSelect = (material: Material, index: number) => {
    const newItems = [...items];
    newItems[index] = {
      id: `item-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      quantity: 1,
      price: material.purchasePrice,
      total: material.purchasePrice,
      isNew: false
    };
    
    if (index === items.length - 1) {
      newItems.push(createEmptyItem());
    }
    
    setItems(newItems);
    setMaterialSearch('');
    setShowMaterialSearch(false);
    setSearchResults([]);
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
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
  
  const handleNewMaterial = (name: string) => {
    // Add new material as item
    const index = currentItemIndex;
    const newItems = [...items];
    newItems[index] = {
      id: `item-${Date.now()}`,
      materialId: '', // Will be created on save
      materialName: name,
      quantity: 1,
      price: 0,
      total: 0,
      isNew: false
    };
    
    if (index === items.length - 1) {
      newItems.push(createEmptyItem());
    }
    
    setItems(newItems);
    setShowNewMaterialDialog(false);
    setNewMaterialName('');
    setMaterialSearch('');
    setShowMaterialSearch(false);
    setSearchResults([]);
  };
  
  const handleSave = async (printAfter = false) => {
    const validItems = items.filter(item => item.materialName && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('يجب إضافة مواد للقائمة');
      return;
    }
    
    try {
      const invoiceData = {
        supplierName,
        warehouseId: selectedWarehouse,
        items: validItems.map(item => ({
          materialId: item.materialId,
          materialName: item.materialName,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        discount,
        notes,
        createdBy: currentUser?.id
      };
      
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('تم حفظ قائمة الشراء بنجاح');
        
        // Reset form
        setItems([createEmptyItem()]);
        setSupplierName('');
        setDiscount(0);
        setNotes('');
        
        if (printAfter) {
          window.print();
        }
      }
    } catch (error) {
      toast.error('حدث خطأ في حفظ القائمة');
    }
  };
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    const totalRows = items.length;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'materialName') {
        const input = (e.target as HTMLInputElement).value;
        if (input && searchResults.length > 0) {
          handleMaterialSelect(searchResults[0], rowIndex);
        } else if (input && searchResults.length === 0) {
          // Show new material dialog
          setNewMaterialName(input);
          setShowNewMaterialDialog(true);
        }
      } else if (rowIndex < totalRows - 1) {
        const nextRef = inputRefs.current[`row-${rowIndex + 1}-materialName`];
        nextRef?.focus();
      }
    }
  };
  
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">قائمة شراء جديدة</h1>
        <p className="text-muted-foreground">إنشاء قائمة شراء جديدة</p>
      </div>
      
      {/* Supplier Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>اسم المورد</Label>
              <Input
                placeholder="اسم المورد..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="mt-1"
              />
            </div>
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
        </CardContent>
      </Card>
      
      {/* Items Table */}
      <Card className="border-blue-200 flex-1">
        <CardContent className="p-0">
          {/* Table Size Controls */}
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
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
            <table className={`w-full ${tableSizes[tableSizeIndex].text}`} style={{ tableLayout: 'fixed' }}>
              <thead className="bg-blue-100">
                <tr>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.material }}
                  >
                    المادة
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 group-hover:bg-blue-400 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'material')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.price }}
                  >
                    السعر
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 group-hover:bg-blue-400 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'price')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.quantity }}
                  >
                    العدد
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 group-hover:bg-blue-400 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'quantity')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.total }}
                  >
                    المجموع
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 group-hover:bg-blue-400 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, 'total')}
                    />
                  </th>
                  <th 
                    className={`${tableSizes[tableSizeIndex].padding} text-right font-semibold relative group`}
                    style={{ width: columnWidths.notes }}
                  >
                    ملاحظة
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 group-hover:bg-blue-400 transition-colors"
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
                  <tr key={item.id} className={`border-t border-blue-100 ${tableSizes[tableSizeIndex].rowHeight}`}>
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
                        {showMaterialSearch && currentItemIndex === index && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 bg-white border rounded-lg shadow-xl z-50 mt-1"
                            style={{ top: '100%' }}
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((material) => (
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
                                      <span className="text-blue-600 font-medium">سعر الشراء: {material.purchasePrice.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : materialSearch ? (
                              <button
                                onMouseDown={() => handleNewMaterial(materialSearch)}
                                className="w-full p-3 text-right hover:bg-green-50 text-green-600 flex items-center gap-3"
                              >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">إضافة مادة جديدة: {materialSearch}</span>
                              </button>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                    
                    {/* Price */}
                    <td className={`${tableSizes[tableSizeIndex].padding} overflow-hidden`}>
                      <Input
                        type="number"
                        placeholder="السعر"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text} w-full`}
                      />
                    </td>
                    
                    {/* Quantity */}
                    <td className={`${tableSizes[tableSizeIndex].padding} overflow-hidden`}>
                      <Input
                        type="number"
                        placeholder="العدد"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text} w-full`}
                      />
                    </td>
                    
                    {/* Total */}
                    <td className={`${tableSizes[tableSizeIndex].padding} overflow-hidden`}>
                      <div className={`font-semibold px-3 ${tableSizes[tableSizeIndex].text}`}>
                        {item.total > 0 ? item.total.toLocaleString() : '-'}
                      </div>
                    </td>
                    
                    {/* Notes */}
                    <td className={`${tableSizes[tableSizeIndex].padding} overflow-hidden`}>
                      <Input
                        placeholder="ملاحظة"
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        className={`border-0 focus-visible:ring-1 ${tableSizes[tableSizeIndex].inputHeight} ${tableSizes[tableSizeIndex].text} w-full`}
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
        <Card className="border-blue-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-medium">{subtotal.toLocaleString()} د.ع</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">الخصم:</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
            
            <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-blue-200">
              <span>المجموع:</span>
              <span className="text-blue-600">{total.toLocaleString()} د.ع</span>
            </div>
            
            <div>
              <Label>ملاحظات</Label>
              <Input
                placeholder="ملاحظات..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <Card className="border-blue-200">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleSave(false)} className="h-9 bg-blue-600 hover:bg-blue-700 text-sm">
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </Button>
              <Button onClick={() => handleSave(true)} variant="outline" className="h-9 border-blue-300 text-sm">
                <Printer className="w-4 h-4 ml-1" />
                حفظ وطباعة
              </Button>
              <Button variant="outline" className="h-9 border-blue-300 text-sm">
                <MessageCircle className="w-4 h-4 ml-1" />
                واتساب
              </Button>
              <Button variant="destructive" className="h-9 text-sm" onClick={() => {
                setItems([createEmptyItem()]);
                setSupplierName('');
                setDiscount(0);
                setNotes('');
              }}>
                <Trash2 className="w-4 h-4 ml-1" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* New Material Dialog */}
      <Dialog open={showNewMaterialDialog} onOpenChange={setShowNewMaterialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مادة جديدة</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>اسم المادة</Label>
            <Input
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMaterialDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => handleNewMaterial(newMaterialName)}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
