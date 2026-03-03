'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  Users,
  Car,
  Receipt,
  Banknote,
  HandCoins,
  ArrowRightLeft,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Fuel,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Shortcut {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  action: string;
}

const defaultShortcuts: Shortcut[] = [
  { id: '1', name: 'قائمة بيع', icon: Receipt, color: 'from-green-500 to-emerald-600', action: 'sale-invoice' },
  { id: '2', name: 'قائمة شراء', icon: Package, color: 'from-blue-500 to-cyan-600', action: 'purchase-invoice' },
  { id: '3', name: 'سند قبض', icon: HandCoins, color: 'from-amber-500 to-yellow-600', action: 'receipt-voucher' },
  { id: '4', name: 'سند دفع', icon: Banknote, color: 'from-red-500 to-rose-600', action: 'payment-voucher' },
  { id: '5', name: 'نقل مخزني', icon: ArrowRightLeft, color: 'from-purple-500 to-violet-600', action: 'transfer' },
  { id: '6', name: 'جرد مخزني', icon: ClipboardList, color: 'from-indigo-500 to-blue-600', action: 'inventory-count' },
];

interface Stats {
  salesCount: number;
  purchasesCount: number;
  carsCount: number;
  materialsQuantity: number;
  expenses: number;
  todaySales: number;
  todayPurchases: number;
}

export function DashboardContent() {
  const { currentUser, setActiveTab, openNewTab } = useAppStore();
  const [stats, setStats] = useState<Stats>({
    salesCount: 0,
    purchasesCount: 0,
    carsCount: 0,
    materialsQuantity: 0,
    expenses: 0,
    todaySales: 0,
    todayPurchases: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [shortcuts] = useState<Shortcut[]>(defaultShortcuts);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch sales stats
      const salesRes = await fetch('/api/sales?days=0');
      const salesData = await salesRes.json();
      
      // Fetch purchases stats
      const purchasesRes = await fetch('/api/purchases');
      const purchasesData = await purchasesRes.json();
      
      // Fetch customers count
      const customersRes = await fetch('/api/customers');
      const customersData = await customersRes.json();
      
      // Fetch materials
      const materialsRes = await fetch('/api/materials');
      const materialsData = await materialsRes.json();

      setStats({
        salesCount: salesData.stats?.countCash + salesData.stats?.countCredit + salesData.stats?.countPartial || 0,
        purchasesCount: purchasesData.invoices?.length || 0,
        carsCount: customersData.customers?.filter((c: any) => c.carNumber)?.length || 0,
        materialsQuantity: materialsData.materials?.reduce((sum: number, m: any) => sum + m.quantity, 0) || 0,
        expenses: 0,
        todaySales: salesData.stats?.totalCash + salesData.stats?.totalPartial || 0,
        todayPurchases: purchasesData.stats?.totalAmount || 0,
      });
      
      setRecentSales(salesData.invoices?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
  }, [fetchStats]);

  const handleShortcutClick = (shortcut: Shortcut) => {
    if (shortcut.action === 'sale-invoice' || shortcut.action === 'purchase-invoice') {
      openNewTab(shortcut.action, shortcut.name);
    } else {
      setActiveTab(shortcut.action);
    }
  };

  // Stats Cards
  const statsCards = [
    { 
      title: 'قوائم البيع اليوم', 
      value: stats.salesCount, 
      icon: ShoppingCart, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+12%',
      trendUp: true
    },
    { 
      title: 'قوائم الشراء', 
      value: stats.purchasesCount, 
      icon: Package, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+5%',
      trendUp: true
    },
    { 
      title: 'عدد السيارات', 
      value: stats.carsCount, 
      icon: Car, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    { 
      title: 'كمية المواد', 
      value: `${stats.materialsQuantity.toLocaleString()} لتر`, 
      icon: Fuel, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            مرحباً، {currentUser?.name || 'المستخدم'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            إليك ملخص يومك
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="w-5 h-5" />
          <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Shortcuts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">الاختصارات</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {shortcuts.map((shortcut, index) => (
            <motion.div
              key={shortcut.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                onClick={() => handleShortcutClick(shortcut)}
                className={`w-full h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${shortcut.color} text-white hover:opacity-90 transition-opacity shadow-lg`}
              >
                <shortcut.icon className="w-8 h-8" />
                <span className="text-sm font-medium">{shortcut.name}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    {card.trend && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${card.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {card.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{card.trend}</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              مبيعات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.todaySales.toLocaleString()} د.ع
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              إجمالي المبيعات النقدية والجزئية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              مشتريات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.todayPurchases.toLocaleString()} د.ع
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              إجمالي المشتريات
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              آخر قوائم البيع
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('sales-report')}
            >
              عرض الكل
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length > 0 ? (
            <div className="space-y-2">
              {recentSales.map((sale, index) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      sale.status === 'cash' ? 'bg-green-500' :
                      sale.status === 'credit' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <div>
                      <p className="font-medium">{sale.customer?.name || 'زبون نقدي'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{sale.total.toLocaleString()} د.ع</p>
                    <p className={`text-xs ${
                      sale.status === 'cash' ? 'text-green-500' :
                      sale.status === 'credit' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {sale.status === 'cash' ? 'نقد' : sale.status === 'credit' ? 'آجل' : 'جزئي'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد قوائم بيع اليوم
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
