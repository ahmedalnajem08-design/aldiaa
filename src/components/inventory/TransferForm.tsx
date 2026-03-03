'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Save,
  Search,
  Package,
  Warehouse
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
import { useAppStore } from '@/stores/app-store';

interface TransferItem {
  id: string;
  materialId: string;
  materialName: string;
  unit: string;
  availableQty: number;
  quantity: number;
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
  warehouseId?: string;
}

export function TransferForm() {
  const { currentUser } = useAppStore();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);

  // Fetch warehouses
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

  // Fetch materials when source warehouse changes
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!sourceWarehouse) {
        setMaterials([]);
        return;
      }
      try {
        const res = await fetch(`/api/materials?warehouseId=${sourceWarehouse}`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data.materials || data || []);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };
    fetchMaterials();
  }, [sourceWarehouse]);

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addItem = useCallback((material: Material) => {
    const exists = items.find(i => i.materialId === material.id);
    if (exists) return;

    const newItem: TransferItem = {
      id: `item-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      unit: material.unit,
      availableQty: material.quantity,
      quantity: 0,
    };
    setItems(prev => [...prev, newItem]);
    setSearchTerm('');
    setShowMaterialSearch(false);
  }, [items]);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.min(quantity, item.availableQty) } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleSave = async () => {
    if (!sourceWarehouse || !targetWarehouse) {
      alert('يرجى اختيار المخزن المصدر والمخزن الهدف');
      return;
    }

    if (sourceWarehouse === targetWarehouse) {
      alert('لا يمكن التحويل لنفس المخزن');
      return;
    }

    if (items.length === 0) {
      alert('يرجى إضافة مواد للتحويل');
      return;
    }

    const invalidItems = items.filter(i => i.quantity <= 0 || i.quantity > i.availableQty);
    if (invalidItems.length > 0) {
      alert('يرجى التحقق من الكميات المدخلة');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWarehouseId: sourceWarehouse,
          targetWarehouseId: targetWarehouse,
          notes,
          items: items.map(i => ({
            materialId: i.materialId,
            quantity: i.quantity,
          })),
          createdById: currentUser?.id,
        }),
      });

      if (res.ok) {
        alert('تم حفظ التحويل بنجاح');
        setItems([]);
        setNotes('');
        setSourceWarehouse('');
        setTargetWarehouse('');
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving transfer:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">نقل مخزني</h1>
            <p className="text-muted-foreground">تحويل المواد بين المخازن</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transfer Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">بيانات التحويل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المخزن المصدر</Label>
                <Select value={sourceWarehouse} onValueChange={setSourceWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخزن المصدر" />
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
                <Label>المخزن الهدف</Label>
                <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخزن الهدف" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(w => w.id !== sourceWarehouse).map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} - {w.branch?.name || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الأصناف:</span>
                  <span className="font-bold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الكميات:</span>
                  <span className="font-bold">{totalQuantity}</span>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading || items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ التحويل'}
              </Button>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="lg:col-span-2">
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
                    disabled={!sourceWarehouse}
                  />
                  <Button variant="outline" disabled={!sourceWarehouse}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {showMaterialSearch && searchTerm && sourceWarehouse && (
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
                            (الرصيد: {material.quantity} {material.unit})
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
                    {sourceWarehouse ? 'أضف أصنافاً للتحويل' : 'اختر المخزن المصدر أولاً'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right">الرصيد المتاح</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.availableQty}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={item.availableQty}
                              value={item.quantity}
                              onChange={e => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
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
