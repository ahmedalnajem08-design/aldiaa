'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Plus, Edit, Trash2, Package, ChevronDown, ChevronUp, Layers,
  Eye, ArrowUpRight, ArrowDownRight, ArrowRightLeft, ClipboardList,
  DollarSign, Hash, Warehouse
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Material {
  id: string;
  name: string;
  code?: string;
  unit: string;
  baseUnit: string;
  fillingType: string;
  level1Name?: string;
  level1Quantity?: number;
  level1SalePrice?: number;
  level2Name?: string;
  level2Quantity?: number;
  level2SalePrice?: number;
  level3Name?: string;
  level3Quantity?: number;
  level3SalePrice?: number;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantity?: number;
  warehouseId?: string;
  warehouse?: { id: string; name: string; branch?: { name: string } };
}

interface Movement {
  id: string;
  type: string;
  typeName: string;
  date: string;
  invoiceNumber?: string;
  quantity: number;
  price?: number;
  total?: number;
  customerName?: string;
  supplierName?: string;
  warehouseName?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  userName?: string;
  notes?: string;
  systemQuantity?: number;
  actualQuantity?: number;
}

interface Warehouse {
  id: string;
  name: string;
  branch?: { id: string; name: string };
}

interface Branch {
  id: string;
  name: string;
}

export function MaterialsList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialMovements, setMaterialMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: 'قطعة',
    baseUnit: 'قطعة',
    fillingType: 'single',
    level1Name: '',
    level1Quantity: 0,
    level1SalePrice: 0,
    level2Name: '',
    level2Quantity: 0,
    level2SalePrice: 0,
    level3Name: '',
    level3Quantity: 0,
    level3SalePrice: 0,
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    minQuantity: 0,
    warehouseId: ''
  });

  // حساب الوحدات الفرعية
  const calculateSubUnits = () => {
    if (formData.fillingType !== 'multi') return 1;
    
    let total = 1;
    if (formData.level1Quantity > 0) {
      total *= formData.level1Quantity;
    }
    if (formData.level2Quantity > 0) {
      total *= formData.level2Quantity;
    }
    if (formData.level3Quantity > 0) {
      total *= formData.level3Quantity;
    }
    return total;
  };

  // الحصول على وصف التعبئة
  const getFillingDescription = () => {
    if (formData.fillingType !== 'multi') return null;
    
    const parts: string[] = [];
    
    if (formData.level1Name && formData.level1Quantity > 0) {
      parts.push(`1 ${formData.level1Name} = ${formData.level1Quantity} ${formData.level2Name || formData.unit}`);
    }
    if (formData.level2Name && formData.level2Quantity > 0) {
      parts.push(`1 ${formData.level2Name} = ${formData.level2Quantity} ${formData.level3Name || formData.unit}`);
    }
    if (formData.level3Name && formData.level3Quantity > 0) {
      parts.push(`1 ${formData.level3Name} = ${formData.level3Quantity} ${formData.unit}`);
    }
    
    return parts;
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, whRes, brRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/warehouses'),
        fetch('/api/branches')
      ]);
      
      const matData = await matRes.json();
      const whData = await whRes.json();
      const brData = await brRes.json();
      
      setMaterials(matData.materials || matData || []);
      setWarehouses(whData.warehouses || whData || []);
      setBranches(brData.branches || brData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // جلب حركات المادة
  const fetchMaterialMovements = async (materialId: string, warehouseId?: string) => {
    setLoadingMovements(true);
    try {
      const url = `/api/materials/movements?materialId=${materialId}${warehouseId ? `&warehouseId=${warehouseId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setMaterialMovements(data.movements || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMaterialMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };
  
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.code && m.code.toLowerCase().includes(search.toLowerCase()));
    const matchesWarehouse = !selectedWarehouse || m.warehouseId === selectedWarehouse;
    const matchesBranch = !selectedBranch || m.warehouse?.branch?.id === selectedBranch;
    return matchesSearch && matchesWarehouse && matchesBranch;
  });

  // حساب كميات التعبئة للمادة
  const calculateFillingQuantities = (material: Material) => {
    const result: { level: string; name: string; quantity: number; salePrice: number }[] = [];
    
    if (material.fillingType === 'multi') {
      // المستوى الأول
      if (material.level1Name && material.level1Quantity) {
        const level1Qty = Math.floor(material.quantity / (material.level1Quantity * (material.level2Quantity || 1) * (material.level3Quantity || 1)));
        result.push({
          level: '1',
          name: material.level1Name,
          quantity: level1Qty,
          salePrice: material.level1SalePrice || 0
        });
      }
      
      // المستوى الثاني
      if (material.level2Name && material.level2Quantity) {
        const remainingAfterLevel1 = material.quantity % ((material.level1Quantity || 1) * (material.level2Quantity || 1) * (material.level3Quantity || 1));
        const level2Qty = Math.floor(remainingAfterLevel1 / ((material.level2Quantity || 1) * (material.level3Quantity || 1)));
        result.push({
          level: '2',
          name: material.level2Name,
          quantity: level2Qty,
          salePrice: material.level2SalePrice || 0
        });
      }
      
      // المستوى الثالث
      if (material.level3Name && material.level3Quantity) {
        const remainingAfterLevel2 = material.quantity % ((material.level2Quantity || 1) * (material.level3Quantity || 1));
        const level3Qty = Math.floor(remainingAfterLevel2 / (material.level3Quantity || 1));
        result.push({
          level: '3',
          name: material.level3Name,
          quantity: level3Qty,
          salePrice: material.level3SalePrice || 0
        });
      }
    }
    
    // الوحدة الأساسية
    const baseQty = material.fillingType === 'multi' 
      ? material.quantity % ((material.level3Quantity || 1))
      : material.quantity;
    
    result.push({
      level: '0',
      name: material.unit,
      quantity: material.quantity,
      salePrice: material.salePrice || 0
    });
    
    return result;
  };

  // عرض التعبئة في الجدول (المستوى الأول فقط)
  const renderFillingDisplay = (material: Material) => {
    if (material.fillingType !== 'multi' || !material.level1Name) {
      return (
        <div className="text-center">
          <div className="font-medium">{material.quantity.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{material.unit}</div>
        </div>
      );
    }

    // حساب كمية المستوى الأول
    const level1TotalQty = (material.level1Quantity || 1) * (material.level2Quantity || 1) * (material.level3Quantity || 1);
    const level1Count = Math.floor(material.quantity / level1TotalQty);
    const remaining = material.quantity % level1TotalQty;

    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="default" className="bg-blue-500">
            {level1Count} {material.level1Name}
          </Badge>
          {remaining > 0 && (
            <Badge variant="outline" className="text-xs">
              +{remaining} {material.unit}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          المجموع: {material.quantity.toLocaleString()} {material.unit}
        </div>
      </div>
    );
  };

  // فتح نافذة التفاصيل
  const handleOpenDetails = (material: Material) => {
    setSelectedMaterial(material);
    fetchMaterialMovements(material.id, selectedWarehouse || undefined);
    setShowDetailsDialog(true);
  };
  
  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        code: material.code || '',
        unit: material.unit || 'قطعة',
        baseUnit: material.baseUnit || material.unit || 'قطعة',
        fillingType: material.fillingType || 'single',
        level1Name: material.level1Name || '',
        level1Quantity: material.level1Quantity || 0,
        level1SalePrice: material.level1SalePrice || 0,
        level2Name: material.level2Name || '',
        level2Quantity: material.level2Quantity || 0,
        level2SalePrice: material.level2SalePrice || 0,
        level3Name: material.level3Name || '',
        level3Quantity: material.level3Quantity || 0,
        level3SalePrice: material.level3SalePrice || 0,
        purchasePrice: material.purchasePrice,
        salePrice: material.salePrice,
        quantity: material.quantity,
        minQuantity: material.minQuantity || 0,
        warehouseId: material.warehouseId || ''
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        code: '',
        unit: 'قطعة',
        baseUnit: 'قطعة',
        fillingType: 'single',
        level1Name: '',
        level1Quantity: 0,
        level1SalePrice: 0,
        level2Name: '',
        level2Quantity: 0,
        level2SalePrice: 0,
        level3Name: '',
        level3Quantity: 0,
        level3SalePrice: 0,
        purchasePrice: 0,
        salePrice: 0,
        quantity: 0,
        minQuantity: 0,
        warehouseId: selectedWarehouse || (warehouses[0]?.id || '')
      });
    }
    setShowDialog(true);
  };
  
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المادة');
      return;
    }
    
    setSaving(true);
    try {
      const url = '/api/materials';
      const method = editingMaterial ? 'PUT' : 'POST';
      const body = editingMaterial ? { id: editingMaterial.id, ...formData } : formData;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success(editingMaterial ? 'تم تحديث المادة' : 'تم إضافة المادة');
        setShowDialog(false);
        fetchData();
      } else {
        toast.error(result.message || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    
    try {
      const res = await fetch('/api/materials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('تم حذف المادة');
        fetchData();
      } else {
        toast.error(result.message || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الحذف');
    }
  };

  // أيقونة نوع الحركة
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'purchase':
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case 'transfer_out':
        return <ArrowRightLeft className="w-4 h-4 text-orange-500" />;
      case 'transfer_in':
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      case 'inventory':
      case 'adjustment':
        return <ClipboardList className="w-4 h-4 text-purple-500" />;
      case 'return':
        return <ArrowUpRight className="w-4 h-4 text-yellow-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">عرض المواد</h1>
              <p className="text-muted-foreground">إدارة المواد في المخازن</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة مادة
          </Button>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مادة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={selectedBranch || "all"} onValueChange={(v) => {
                setSelectedBranch(v === "all" ? "" : v);
                setSelectedWarehouse('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الفروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفروع</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedWarehouse || "all"} onValueChange={(v) => setSelectedWarehouse(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="كل المخازن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المخازن</SelectItem>
                  {warehouses
                    .filter(w => !selectedBranch || w.branch?.id === selectedBranch)
                    .map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} {w.branch?.name && `(${w.branch.name})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="w-5 h-5" />
                <span>{filteredMaterials.length} مادة</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Materials Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>اسم المادة</TableHead>
                      <TableHead>الكمية (التعبئة)</TableHead>
                      <TableHead>سعر الشراء</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>المخزن</TableHead>
                      <TableHead className="w-32">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length > 0 ? (
                      filteredMaterials.map((material, index) => (
                        <TableRow 
                          key={material.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenDetails(material)}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div>{material.name}</div>
                              {material.code && (
                                <div className="text-xs text-muted-foreground">كود: {material.code}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{renderFillingDisplay(material)}</TableCell>
                          <TableCell>{material.purchasePrice.toLocaleString()} د.ع</TableCell>
                          <TableCell>{material.salePrice.toLocaleString()} د.ع</TableCell>
                          <TableCell>{material.warehouse?.name || '-'}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(material)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(material)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>لا توجد مواد</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'تعديل المادة' : 'إضافة مادة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* البيانات الأساسية */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Package className="w-5 h-5" />
                <span>البيانات الأساسية</span>
              </div>
              
              <div>
                <Label>اسم المادة *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الكود</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>الوحدة الأساسية</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v, baseUnit: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="قطعة">قطعة</SelectItem>
                      <SelectItem value="لتر">لتر</SelectItem>
                      <SelectItem value="جالون">جالون</SelectItem>
                      <SelectItem value="كيلو">كيلو</SelectItem>
                      <SelectItem value="متر">متر</SelectItem>
                      <SelectItem value="علبة">علبة</SelectItem>
                      <SelectItem value="كرتون">كرتون</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* نظام التعبئة */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Layers className="w-5 h-5" />
                  <span>نظام التعبئة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">تعبئة متعددة</Label>
                  <Switch
                    checked={formData.fillingType === 'multi'}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      fillingType: checked ? 'multi' : 'single',
                      level1Name: '',
                      level1Quantity: 0,
                      level1SalePrice: 0,
                      level2Name: '',
                      level2Quantity: 0,
                      level2SalePrice: 0,
                      level3Name: '',
                      level3Quantity: 0,
                      level3SalePrice: 0,
                    })}
                  />
                </div>
              </div>

              {formData.fillingType === 'multi' && (
                <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                  {/* المستوى الأول */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">المستوى 1</Badge>
                      <span className="text-sm text-muted-foreground">الوحدة الكبرى (مثال: كارتون)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">اسم الوحدة</Label>
                        <Input
                          placeholder="كارتون"
                          value={formData.level1Name}
                          onChange={(e) => setFormData({ ...formData, level1Name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">يحتوي على</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.level1Quantity || ''}
                          onChange={(e) => setFormData({ ...formData, level1Quantity: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">من الوحدة التالية</Label>
                        <Input
                          value={formData.level2Name || formData.unit}
                          disabled
                          className="mt-1 bg-muted"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">سعر البيع</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.level1SalePrice || ''}
                          onChange={(e) => setFormData({ ...formData, level1SalePrice: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* المستوى الثاني */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">المستوى 2</Badge>
                      <span className="text-sm text-muted-foreground">الوحدة الوسطى (مثال: سيت)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">اسم الوحدة</Label>
                        <Input
                          placeholder="سيت"
                          value={formData.level2Name}
                          onChange={(e) => setFormData({ ...formData, level2Name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">يحتوي على</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.level2Quantity || ''}
                          onChange={(e) => setFormData({ ...formData, level2Quantity: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">من الوحدة التالية</Label>
                        <Input
                          value={formData.level3Name || formData.unit}
                          disabled
                          className="mt-1 bg-muted"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">سعر البيع</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.level2SalePrice || ''}
                          onChange={(e) => setFormData({ ...formData, level2SalePrice: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* المستوى الثالث */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">المستوى 3</Badge>
                      <span className="text-sm text-muted-foreground">الوحدة الصغرى (مثال: درزن)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">اسم الوحدة</Label>
                        <Input
                          placeholder="درزن"
                          value={formData.level3Name}
                          onChange={(e) => setFormData({ ...formData, level3Name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">يحتوي على</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.level3Quantity || ''}
                          onChange={(e) => setFormData({ ...formData, level3Quantity: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">من الوحدة الأساسية</Label>
                        <Input
                          value={formData.unit}
                          disabled
                          className="mt-1 bg-muted"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">سعر البيع</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.level3SalePrice || ''}
                          onChange={(e) => setFormData({ ...formData, level3SalePrice: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ملخص التعبئة */}
                  {calculateSubUnits() > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">ملخص التعبئة الهرمية</span>
                      </div>
                      <div className="space-y-1 text-sm text-blue-700">
                        {getFillingDescription()?.map((desc, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <ChevronDown className="w-3 h-3" />
                            <span>{desc}</span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-blue-200 font-medium">
                          1 {formData.level1Name || 'وحدة كبرى'} = {calculateSubUnits().toLocaleString()} {formData.unit}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* الأسعار والمخزن */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <DollarSign className="w-5 h-5" />
                <span>الأسعار والكميات</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>سعر الشراء (للوحدة الأساسية)</Label>
                  <Input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>سعر البيع (للوحدة الأساسية)</Label>
                  <Input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>المخزن</Label>
                  <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر المخزن" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'جاري الحفظ...' : (editingMaterial ? 'تحديث' : 'إضافة')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              تفاصيل المادة: {selectedMaterial?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="space-y-6 py-4">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Hash className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{selectedMaterial.quantity.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">الكمية الكلية</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{selectedMaterial.purchasePrice.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">سعر الشراء</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{selectedMaterial.salePrice.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">سعر البيع</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Warehouse className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-lg font-bold">{selectedMaterial.warehouse?.name || '-'}</div>
                    <div className="text-sm text-muted-foreground">المخزن</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="filling" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="filling">التعبئة والأسعار</TabsTrigger>
                  <TabsTrigger value="movements">حركات المادة</TabsTrigger>
                </TabsList>
                
                <TabsContent value="filling" className="space-y-4">
                  {/* جدول التعبئة والأسعار */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تفاصيل التعبئة والأسعار</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الوحدة</TableHead>
                            <TableHead>الكمية المتوفرة</TableHead>
                            <TableHead>سعر البيع</TableHead>
                            <TableHead>المحتوى</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedMaterial.fillingType === 'multi' && selectedMaterial.level1Name && (
                            <>
                              {/* المستوى الأول */}
                              <TableRow className="bg-blue-50">
                                <TableCell className="font-medium">
                                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                    {selectedMaterial.level1Name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {Math.floor(selectedMaterial.quantity / ((selectedMaterial.level1Quantity || 1) * (selectedMaterial.level2Quantity || 1) * (selectedMaterial.level3Quantity || 1)))}
                                </TableCell>
                                <TableCell className="font-bold text-green-600">
                                  {(selectedMaterial.level1SalePrice || 0).toLocaleString()} د.ع
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  1 {selectedMaterial.level1Name} = {selectedMaterial.level1Quantity} {selectedMaterial.level2Name || selectedMaterial.unit}
                                </TableCell>
                              </TableRow>
                              
                              {/* المستوى الثاني */}
                              {selectedMaterial.level2Name && (
                                <TableRow className="bg-green-50">
                                  <TableCell className="font-medium">
                                    <Badge variant="outline" className="bg-green-100 text-green-700">
                                      {selectedMaterial.level2Name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {Math.floor((selectedMaterial.quantity % ((selectedMaterial.level1Quantity || 1) * (selectedMaterial.level2Quantity || 1) * (selectedMaterial.level3Quantity || 1))) / ((selectedMaterial.level2Quantity || 1) * (selectedMaterial.level3Quantity || 1)))}
                                  </TableCell>
                                  <TableCell className="font-bold text-green-600">
                                    {(selectedMaterial.level2SalePrice || 0).toLocaleString()} د.ع
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    1 {selectedMaterial.level2Name} = {selectedMaterial.level2Quantity} {selectedMaterial.level3Name || selectedMaterial.unit}
                                  </TableCell>
                                </TableRow>
                              )}
                              
                              {/* المستوى الثالث */}
                              {selectedMaterial.level3Name && (
                                <TableRow className="bg-purple-50">
                                  <TableCell className="font-medium">
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                      {selectedMaterial.level3Name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {Math.floor((selectedMaterial.quantity % ((selectedMaterial.level2Quantity || 1) * (selectedMaterial.level3Quantity || 1))) / (selectedMaterial.level3Quantity || 1))}
                                  </TableCell>
                                  <TableCell className="font-bold text-green-600">
                                    {(selectedMaterial.level3SalePrice || 0).toLocaleString()} د.ع
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    1 {selectedMaterial.level3Name} = {selectedMaterial.level3Quantity} {selectedMaterial.unit}
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          )}
                          
                          {/* الوحدة الأساسية */}
                          <TableRow>
                            <TableCell className="font-medium">
                              <Badge variant="default">
                                {selectedMaterial.unit}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {selectedMaterial.quantity.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {selectedMaterial.salePrice.toLocaleString()} د.ع
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              الوحدة الأساسية
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="movements" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>سجل الحركات</span>
                        <Badge variant="outline">{materialMovements.length} حركة</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingMovements ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : materialMovements.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>رقم السند</TableHead>
                                <TableHead>الكمية</TableHead>
                                <TableHead>الطرف</TableHead>
                                <TableHead>ملاحظات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {materialMovements.map((movement) => (
                                <TableRow key={movement.id}>
                                  <TableCell>{getMovementIcon(movement.type)}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      movement.type === 'sale' ? 'destructive' :
                                      movement.type === 'purchase' ? 'default' :
                                      'secondary'
                                    }>
                                      {movement.typeName}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {new Date(movement.date).toLocaleDateString('ar-SA')}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {movement.invoiceNumber || '-'}
                                  </TableCell>
                                  <TableCell className={`font-bold ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {movement.quantity >= 0 ? '+' : ''}{movement.quantity.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {movement.customerName || movement.supplierName || 
                                     (movement.fromWarehouse && movement.toWarehouse ? 
                                       `${movement.fromWarehouse} ← ${movement.toWarehouse}` : 
                                       movement.warehouseName) || '-'}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {movement.notes || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>لا توجد حركات لهذه المادة</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>إغلاق</Button>
            <Button onClick={() => {
              setShowDetailsDialog(false);
              if (selectedMaterial) handleOpenDialog(selectedMaterial);
            }}>
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
