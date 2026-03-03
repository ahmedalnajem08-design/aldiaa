'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddBranchForm } from './AddBranchForm';
import { BranchSummary } from './BranchSummary';

export function BranchesManagement() {
  const [activeView, setActiveView] = useState<'menu' | 'add' | 'summary'>('menu');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  if (activeView === 'add') {
    return <AddBranchForm onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'summary') {
    return <BranchSummary onBack={() => setActiveView('menu')} />;
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الفروع</h1>
            <p className="text-muted-foreground">إضافة وإدارة فروع المحطة</p>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Branch */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('add')}>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">إضافة فرع</h3>
              <p className="text-muted-foreground">
                إضافة فرع جديد مع تحديد صلاحيات المدير
              </p>
            </CardContent>
          </Card>

          {/* Branch Summary */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('summary')}>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">ملخص الفرع</h3>
              <p className="text-muted-foreground">
                عرض ملخص المبيعات والمشتريات والصرفيات
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
