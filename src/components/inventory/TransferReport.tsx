'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Calendar,
  ArrowRight,
  Eye,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Transfer {
  id: string;
  transferNumber: string;
  sourceWarehouse: { id: string; name: string };
  targetWarehouse: { id: string; name: string };
  notes?: string;
  status: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  items: {
    id: string;
    materialId: string;
    material: { name: string; unit: string };
    quantity: number;
  }[];
  history?: {
    id: string;
    action: string;
    userId: string;
    user: { name: string };
    createdAt: string;
    oldValues?: string;
    newValues?: string;
  }[];
}

export function TransferReport() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transfers');
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || data || []);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sourceWarehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.targetWarehouse.name.toLowerCase().includes(searchTerm.toLowerCase());

    const transferDate = new Date(t.createdAt);
    const matchesDateFrom = !dateFrom || transferDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || transferDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const viewDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowDetails(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">كشف النقل المخزني</h1>
            <p className="text-muted-foreground">عرض وتتبع حركات النقل بين المخازن</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="بحث..."
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  placeholder="من تاريخ"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  placeholder="إلى تاريخ"
                />
              </div>
              <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); }}>
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>التحويلات ({filteredTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  لا توجد تحويلات
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم التحويل</TableHead>
                      <TableHead className="text-right">من مخزن</TableHead>
                      <TableHead className="text-right">إلى مخزن</TableHead>
                      <TableHead className="text-right">عدد الأصناف</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map(transfer => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-mono">{transfer.transferNumber}</TableCell>
                        <TableCell>{transfer.sourceWarehouse.name}</TableCell>
                        <TableCell>{transfer.targetWarehouse.name}</TableCell>
                        <TableCell>{transfer.items.length}</TableCell>
                        <TableCell>{formatDate(transfer.createdAt)}</TableCell>
                        <TableCell>{transfer.createdBy?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                            {transfer.status === 'completed' ? 'مكتمل' : 'معلق'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(transfer)}
                          >
                            <Eye className="w-4 h-4" />
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

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل التحويل {selectedTransfer?.transferNumber}</DialogTitle>
            </DialogHeader>
            {selectedTransfer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">من مخزن:</span>
                    <span className="mr-2 font-medium">{selectedTransfer.sourceWarehouse.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">إلى مخزن:</span>
                    <span className="mr-2 font-medium">{selectedTransfer.targetWarehouse.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التاريخ:</span>
                    <span className="mr-2">{formatDate(selectedTransfer.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المستخدم:</span>
                    <span className="mr-2">{selectedTransfer.createdBy?.name || '-'}</span>
                  </div>
                </div>

                {selectedTransfer.notes && (
                  <div>
                    <span className="text-muted-foreground">ملاحظات:</span>
                    <p className="mt-1 p-2 bg-muted rounded">{selectedTransfer.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">الأصناف المحولة:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransfer.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.material.name}</TableCell>
                          <TableCell>{item.material.unit}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* History */}
                {selectedTransfer.history && selectedTransfer.history.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      سجل التعديلات
                    </h4>
                    <div className="space-y-2">
                      {selectedTransfer.history.map(h => (
                        <div key={h.id} className="p-2 bg-muted rounded text-sm">
                          <div className="flex justify-between">
                            <span>{h.action}</span>
                            <span className="text-muted-foreground">{formatDate(h.createdAt)}</span>
                          </div>
                          <span className="text-muted-foreground">بواسطة: {h.user?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
