'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import EventDetail from '@/components/EventDetail';

const EventDetailPage = () => {
  const params = useParams();
  const eventId = params.eventId;

  return <EventDetail eventId={eventId} />;
};

export default EventDetailPage;
