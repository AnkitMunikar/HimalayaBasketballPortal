'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { Calendar, MapPin, Trophy, Award, ChevronRight } from 'lucide-react';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('events/');
      const list = Array.isArray(data)
        ? data
        : (data?.results ?? data?.data ?? data?.events ?? []);
      setEvents(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err.response?.data?.detail
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Failed to load events')
        : err.message || 'Failed to load events';
      setError(message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const today = typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '';
  const upcoming = events.filter((e) => e.date && e.date > today).sort((a, b) => (a.date > b.date ? 1 : -1));
  const ongoing = events.filter((e) => {
    if (!e.date || e.date > today) return false;
    const end = e.end_date || e.date;
    return end >= today;
  }).sort((a, b) => (a.date > b.date ? 1 : -1));
  const past = events.filter((e) => {
    if (!e.date) return false;
    if (e.date > today) return false;
    const end = e.end_date || e.date;
    return end < today;
  }).sort((a, b) => (b.date > a.date ? 1 : -1));

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateRange = (start, end) => {
    if (!start) return 'Date TBD';
    if (!end || end === start) return formatDate(start);
    try {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return formatDate(start);
    }
  };

  const EventCard = ({ event, isPast, isOngoing }) => (
    <div
      onClick={() => router.push(`/DisplayEvents/${event.id}`)}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {event.logo_url || event.logo ? (
          <img src={event.logo_url || event.logo} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <Award className="w-10 h-10 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate font-fjalla-one">{event.name || 'Unnamed Event'}</h3>
          <span
            className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
              isPast ? 'bg-gray-200 text-gray-700' : isOngoing ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {isPast ? 'Concluded' : isOngoing ? 'Tournament happening' : 'Upcoming'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-2">{event.organizer_name || 'Organizer'}</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateRange(event.date, event.end_date)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {event.venue || 'TBD'} · {event.city || ''}
          </span>
          {event.current_enrollment_count != null && (
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              {event.current_enrollment_count}/{event.max_teams || '—'} teams
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 pt-24 pb-12 px-4 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-fjalla-one mb-2">Events</h1>
            <p className="text-gray-600">
              Upcoming events on top. Past events below — details and standings stay visible.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <button onClick={fetchEvents} className="mt-2 text-sm text-red-600 hover:underline">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-fjalla-one flex items-center gap-2">
                  <span className="w-2 h-6 bg-green-500 rounded" />
                  Upcoming events
                </h2>
                {upcoming.length === 0 ? (
                  <p className="text-gray-500 py-6">No upcoming events.</p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((event) => (
                      <EventCard key={event.id} event={event} isPast={false} isOngoing={false} />
                    ))}
                  </div>
                )}
              </section>

              {ongoing.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 font-fjalla-one flex items-center gap-2">
                    <span className="w-2 h-6 bg-amber-500 rounded" />
                    Tournament happening
                  </h2>
                  <div className="space-y-3">
                    {ongoing.map((event) => (
                      <EventCard key={event.id} event={event} isPast={false} isOngoing={true} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-fjalla-one flex items-center gap-2">
                  <span className="w-2 h-6 bg-gray-400 rounded" />
                  Past events
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Details and standings remain visible for concluded events.
                </p>
                {past.length === 0 ? (
                  <p className="text-gray-500 py-6">No past events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {past.map((event) => (
                      <EventCard key={event.id} event={event} isPast={true} isOngoing={false} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
