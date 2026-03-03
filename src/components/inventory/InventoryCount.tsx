'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Save,
  Search,
  Package,
  CheckCircle,
  XCircle
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
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';

interface InventoryItem {
  id: string;
  materialId: string;
  materialName: string;
  code?: string;
  unit: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
}

interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  branch?: { id: string; name: string };
}

export function InventoryCount() {
  const { currentUser } = useAppStore();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const loadInventory = async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?warehouseId=${selectedWarehouse}`);
      if (res.ok) {
        const data = await res.json();
        // التعامل مع تنسيقات البيانات المختلفة
        const materialsData = data.materials || data || [];
        const inventoryItems: InventoryItem[] = (Array.isArray(materialsData) ? materialsData : []).map((item: any) => ({
          id: `inv-${item.id || item.materialId}`,
          materialId: item.id || item.materialId,
          materialName: item.name || item.material?.name || '',
          code: item.code || item.material?.code || '',
          unit: item.unit || item.material?.unit || 'قطعة',
          systemQuantity: item.quantity || 0,
          actualQuantity: 0,
          difference: -(item.quantity || 0),
        }));
        setItems(inventoryItems);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWarehouse) {
      loadInventory();
    }
  }, [selectedWarehouse]);

  const updateActualQuantity = useCallback((id: string, quantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const diff = quantity - item.systemQuantity;
        return { ...item, actualQuantity: quantity, difference: diff };
      }
      return item;
    }));
  }, []);

  const handleSave = async () => {
    if (!selectedWarehouse) {
      alert('يرجى اختيار المخزن');
      return;
    }

    if (items.every(i => i.actualQuantity === 0)) {
      alert('يرجى إدخال الكميات الفعلية');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/inventory/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          notes,
          items: items.map(i => ({
            materialId: i.materialId,
            systemQuantity: i.systemQuantity,
            actualQuantity: i.actualQuantity,
            difference: i.difference,
          })),
          createdById: currentUser?.id,
        }),
      });

      if (res.ok) {
        alert('تم حفظ الجرد بنجاح');
        loadInventory();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving inventory count:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const itemsWithDifferences = items.filter(i => i.difference !== 0);
  const positiveDifferences = itemsWithDifferences.filter(i => i.difference > 0);
  const negativeDifferences = itemsWithDifferences.filter(i => i.difference < 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الجرد المخزني</h1>
            <p className="text-muted-foreground">مطابقة الكميات الفعلية مع النظام</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">إعدادات الجرد</CardTitle>
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
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الأصناف:</span>
                  <span className="font-bold">{items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">زيادة:</span>
                  <Badge variant="default" className="bg-green-500">
                    {positiveDifferences.length} صنف
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">نقص:</span>
                  <Badge variant="destructive">
                    {negativeDifferences.length} صنف
                  </Badge>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ الجرد'}
              </Button>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">الأصناف</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    {selectedWarehouse ? 'لا توجد أصناف' : 'اختر المخزن أولاً'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الكود</TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right">رصيد النظام</TableHead>
                        <TableHead className="text-right">الكمية الفعلية</TableHead>
                        <TableHead className="text-right">الفرق</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.code || '-'}</TableCell>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.systemQuantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={item.actualQuantity}
                              onChange={e => updateActualQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <span className={item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.difference === 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
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
