'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Trash2,
  Save,
  Search,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';

interface AdjustmentItem {
  id: string;
  materialId: string;
  materialName: string;
  unit: string;
  currentQuantity: number;
  adjustmentQuantity: number;
  adjustmentType: 'increase' | 'decrease';
  newQuantity: number;
  reason: string;
}

interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  branch?: { id: string; name: string };
}

interface Material {
  id: string;
  name: string;
  code?: string;
  unit: string;
  quantity: number;
}

export function InventoryAdjustment() {
  const { currentUser } = useAppStore();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [items, setItems] = useState<AdjustmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/warehouses');
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data.warehouses || data || []);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) {
      setMaterials([]);
      return;
    }
    const fetchMaterials = async () => {
      try {
        const res = await fetch(`/api/materials?warehouseId=${selectedWarehouse}`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data.materials || data || []);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };
    fetchMaterials();
  }, [selectedWarehouse]);

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addItem = useCallback((material: Material) => {
    const exists = items.find(i => i.materialId === material.id);
    if (exists) return;

    const newItem: AdjustmentItem = {
      id: `adj-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      unit: material.unit,
      currentQuantity: material.quantity,
      adjustmentQuantity: 0,
      adjustmentType: 'increase',
      newQuantity: material.quantity,
      reason: '',
    };
    setItems(prev => [...prev, newItem]);
    setSearchTerm('');
    setShowMaterialSearch(false);
  }, [items]);

  const updateItem = useCallback((id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'adjustmentQuantity' || field === 'adjustmentType') {
          const qty = field === 'adjustmentQuantity' ? value : item.adjustmentQuantity;
          const type = field === 'adjustmentType' ? value : item.adjustmentType;
          updated.newQuantity = type === 'increase'
            ? item.currentQuantity + qty
            : item.currentQuantity - qty;
        }
        return updated;
      }
      return item;
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleSave = async () => {
    if (!selectedWarehouse) {
      alert('يرجى اختيار المخزن');
      return;
    }

    const validItems = items.filter(i => i.adjustmentQuantity > 0);
    if (validItems.length === 0) {
      alert('يرجى إضافة أصناف مع كميات تعديل');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          notes,
          items: validItems.map(i => ({
            materialId: i.materialId,
            currentQuantity: i.currentQuantity,
            adjustmentQuantity: i.adjustmentQuantity,
            adjustmentType: i.adjustmentType,
            newQuantity: i.newQuantity,
            reason: i.reason,
          })),
          createdById: currentUser?.id,
        }),
      });

      if (res.ok) {
        alert('تم حفظ التسوية بنجاح');
        setItems([]);
        setNotes('');
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving adjustment:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const totalIncrease = items.filter(i => i.adjustmentType === 'increase').reduce((sum, i) => sum + i.adjustmentQuantity, 0);
  const totalDecrease = items.filter(i => i.adjustmentType === 'decrease').reduce((sum, i) => sum + i.adjustmentQuantity, 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التسوية المخزنية</h1>
            <p className="text-muted-foreground">تعديل أرصدة المخزون</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">إعدادات التسوية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المخزن</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخزن" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} - {w.branch?.name || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الأصناف:</span>
                  <span className="font-bold">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي زيادة:</span>
                  <span className="text-green-600 font-bold">+{totalIncrease}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي نقص:</span>
                  <span className="text-red-600 font-bold">-{totalDecrease}</span>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ التسوية'}
              </Button>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">الأصناف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item */}
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setShowMaterialSearch(true);
                    }}
                    onFocus={() => setShowMaterialSearch(true)}
                    placeholder="ابحث عن مادة..."
                    disabled={!selectedWarehouse}
                  />
                  <Button variant="outline" disabled={!selectedWarehouse}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {showMaterialSearch && searchTerm && selectedWarehouse && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredMaterials.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        لا توجد نتائج
                      </div>
                    ) : (
                      filteredMaterials.map(material => (
                        <button
                          key={material.id}
                          onClick={() => addItem(material)}
                          className="w-full px-4 py-2 text-right hover:bg-muted flex items-center gap-2"
                        >
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{material.name}</span>
                          <span className="text-muted-foreground text-sm">
                            (الرصيد: {material.quantity})
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <ScrollArea className="h-[400px]">
                {items.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {selectedWarehouse ? 'أضف أصنافاً للتسوية' : 'اختر المخزن أولاً'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">الرصيد الحالي</TableHead>
                        <TableHead className="text-right">نوع التسوية</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">الرصيد الجديد</TableHead>
                        <TableHead className="text-right">السبب</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell>{item.currentQuantity} {item.unit}</TableCell>
                          <TableCell>
                            <Select
                              value={item.adjustmentType}
                              onValueChange={v => updateItem(item.id, 'adjustmentType', v)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="increase">زيادة</SelectItem>
                                <SelectItem value="decrease">نقص</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={item.adjustmentQuantity}
                              onChange={e => updateItem(item.id, 'adjustmentQuantity', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className={item.newQuantity > item.currentQuantity ? 'text-green-600' : item.newQuantity < item.currentQuantity ? 'text-red-600' : ''}>
                            {item.newQuantity} {item.unit}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.reason}
                              onChange={e => updateItem(item.id, 'reason', e.target.value)}
                              placeholder="السبب..."
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
