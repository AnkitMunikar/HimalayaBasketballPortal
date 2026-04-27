'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventDetail from '@/components/EventDetail';

const EventDetailPage = () => {
  const params = useParams();
  const eventId = params.eventId;

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="mt-[60px] flex-1">
        <EventDetail eventId={eventId} />
      </div>
      <Footer />
    </main>
  );
};

export default EventDetailPage;
