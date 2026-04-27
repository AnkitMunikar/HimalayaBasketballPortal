'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Header from '@/components/Header';
import AdminDashboard from './Dashboard/AdminDashboard';
import Footer from '@/components/Footer';

export default function Admin() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/Login');
      } else if (user.role !== 'admin' && !user.is_superuser) {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || (user.role !== 'admin' && !user.is_superuser)) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="mt-24 admin-dashboard text-base">
        <AdminDashboard />
      </div>
      <Footer />
    </main>
  );
}
