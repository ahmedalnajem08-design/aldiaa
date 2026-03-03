'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { MainDashboard } from '@/components/dashboard/MainDashboard';

export default function Home() {
  const { isAuthenticated, login } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            login(data.user);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [login]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-digital text-amber-400 glow mb-4">الضيــــــــــاء</div>
          <div className="text-white/80 animate-pulse">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated - show dashboard
  return <MainDashboard />;
}
