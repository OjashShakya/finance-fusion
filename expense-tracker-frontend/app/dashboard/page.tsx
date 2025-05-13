'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { FinanceDashboard } from '@/components/finance/finance-dashboard';
import Cookies from 'js-cookie';
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const token = Cookies.get('token');
      console.log("Token")
      if (!token) {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full absolute border-4 border-solid border-gray-200"></div>
            <div className="w-16 h-16 rounded-full animate-spin absolute border-4 border-solid border-[#27AE60] border-t-transparent"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-medium text-gray-700 animate-bounce">Loading your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  // if (!user) {
  //   return null;
  // }

  return (
    <div className="min-h-screen">
      <FinanceDashboard />
    </div>
  );
} 

