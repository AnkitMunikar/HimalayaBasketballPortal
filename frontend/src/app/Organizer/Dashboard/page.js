'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext'; 
import Header from '@/components/Header';
import OrganizerDashboard from './Dashboards';
import Footer from '@/components/Footer';

export default function OrganizerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/Login');
      } else if (user.role !== 'event_organizer') {
        router.push('/'); // Redirect non-organizers to home
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'event_organizer') {
    return null; // Render nothing while redirecting
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="pt-32">
        <OrganizerDashboard />
      </div>
      <Footer />
    </main>
  );
}
