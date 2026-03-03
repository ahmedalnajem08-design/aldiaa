'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Package,
  Calculator,
  LayoutDashboard,
  ChevronLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfitsReport } from './ProfitsReport';
import { ExpensesReport } from './ExpensesReport';
import { SalesReport } from '@/components/sales/SalesReport';
import { PurchasesReport } from '@/components/purchases/PurchasesReport';
import { ProfitExpenseReport } from './ProfitExpenseReport';
import { AccountSummary } from './AccountSummary';

const reportsList = [
  { id: 'profits', name: 'تقرير الأرباح', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
  { id: 'expenses', name: 'تقرير المصاريف', icon: Receipt, color: 'from-red-500 to-orange-600' },
  { id: 'sales', name: 'تقرير المبيعات', icon: ShoppingCart, color: 'from-blue-500 to-indigo-600' },
  { id: 'purchases', name: 'تقرير المشتريات', icon: Package, color: 'from-purple-500 to-pink-600' },
  { id: 'profit-expense', name: 'الأرباح والمصاريف', icon: LayoutDashboard, color: 'from-cyan-500 to-teal-600' },
  { id: 'summary', name: 'الملخص الحسابي', icon: Calculator, color: 'from-indigo-500 to-purple-600' },
];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const renderReport = () => {
    switch (activeReport) {
      case 'profits':
        return <ProfitsReport />;
      case 'expenses':
        return <ExpensesReport />;
      case 'sales':
        return <SalesReport />;
      case 'purchases':
        return <PurchasesReport />;
      case 'profit-expense':
        return <ProfitExpenseReport />;
      case 'summary':
        return <AccountSummary />;
      default:
        return null;
    }
  };

  if (activeReport) {
    const currentReport = reportsList.find(r => r.id === activeReport);
    return (
      <div className="h-full flex flex-col" dir="rtl">
        {/* Back Button */}
        <div className="p-4 border-b bg-background">
          <Button
            variant="ghost"
            onClick={() => setActiveReport(null)}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            العودة للتقارير
          </Button>
        </div>
        
        {/* Report Content */}
        <div className="flex-1 overflow-auto">
          {renderReport()}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-muted-foreground">تقارير شاملة ومفصلة</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary/20"
                onClick={() => setActiveReport(report.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">انقر للعرض</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
