'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext'; 
import Header from '@/components/Header';
import OrganizerDashboard from '@/app/Organizer/Dashboard/Dashboards';
import EventForm from './Dashboard/EventForm';
import Footer from '@/components/Footer';
export default function Organizer() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading) {
  //     if (!user) {
  //       router.push('/login');
  //     } else if (user.role !== 'event_organizer') {
  //       router.push('/'); // Redirect non-organizers to home
  //     }
  //   }
  // }, [user, loading, router]);

  // if (loading) {
  //   return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  // }

  // if (!user || user.role !== 'event_organizer') {
  //   return null; // Render nothing while redirecting
  // }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <EventForm/>
      <div className="mt-24">
        <OrganizerDashboard />
      </div>
      <Footer />
    </main>
  );
}