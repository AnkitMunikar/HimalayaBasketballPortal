'use client';
import Header from '@/components/Header';
import CoachDashboard from './Dashboard/CoachDashboard';

export default function Coach() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <CoachDashboard />
    </main>
  );
}

