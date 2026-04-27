// frontend/src/app/Coach/Dashboard/Eventregister.js
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, Trophy, MapPin, Award, CreditCard
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const EventRegister = ({ events, loading, error, currentUser, enrolledTeams = [], onEnrollSuccess }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Event IDs this coach has already enrolled a team in (prevents duplicate enrollment)
  const enrolledEventIds = useMemo(() => {
    const list = Array.isArray(enrolledTeams) ? enrolledTeams : [];
    return new Set(list.map((t) => t.event ?? t.event_details?.id).filter(Boolean));
  }, [enrolledTeams]);

  const isAlreadyEnrolled = (eventId) => enrolledEventIds.has(Number(eventId)) || enrolledEventIds.has(String(eventId));

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch (e) {
      return false;
    }
  };

  const getEnrollmentStatus = (event) => {
    const current = event.current_enrollment_count || 0;
    const maxTeams = event.max_teams || 0;
    const isFull = event.is_full || false;
    const availableSlots = event.available_slots;

    if (maxTeams === 0) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: `${current} enrolled`,
        percentage: 0,
        showBar: false
      };
    }

    const percentage = maxTeams > 0 ? (current / maxTeams) * 100 : 0;

    if (isFull || percentage >= 100) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        text: `FULL (${current}/${maxTeams})`,
        percentage: 100,
        showBar: true,
        barColor: 'bg-red-500'
      };
    }

    if (percentage >= 75) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        text: `${availableSlots} left (${current}/${maxTeams})`,
        percentage,
        showBar: true,
        barColor: 'bg-orange-500'
      };
    }

    if (percentage >= 50) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        text: `${current}/${maxTeams} teams`,
        percentage,
        showBar: true,
        barColor: 'bg-yellow-500'
      };
    }

    return {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: `${current}/${maxTeams} teams`,
      percentage,
      showBar: true,
      barColor: 'bg-green-500'
    };
  };

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    const filtered = events.filter(event => {
      if (!event || typeof event !== 'object') return false;
      if (!event.name || !event.venue) return false;

      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.venue.toLowerCase().includes(searchTerm.toLowerCase());

      if (filter === 'all') return matchesSearch;
      if (filter === 'upcoming') return matchesSearch && isUpcoming(event.date);
      if (filter === 'tournament') return event.duration_type === 'Tournament' && matchesSearch;
      if (filter === 'league') return event.duration_type === 'League' && matchesSearch;

      return matchesSearch;
    });
    // Recent first (newest / upcoming events at top)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, filter, searchTerm]);

  const handleEnrollClick = (ev) => {
    if (isAlreadyEnrolled(ev.id)) return;
    router.push(`/Coach/enroll/${ev.id}`);
  };



  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Available Events</h2>
      </div>

      <div className="p-8">
        {/* Search & Filters */}
        <div className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <input
              type="text"
              placeholder="🔍 Search by event name or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:max-w-lg px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
            />

            <div className="flex gap-3 flex-wrap">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'tournament', label: 'Tournaments' },
                { key: 'league', label: 'Leagues' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-gray-600 font-medium">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-2xl text-red-600 font-semibold">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-3 font-fjalla-one">No events found</h3>
            <p className="text-gray-600 text-lg">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'New tournaments and leagues will appear here soon!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((event) => {
              const status = getEnrollmentStatus(event);
              const canEnroll = event.can_enroll_status?.can_enroll ?? true;
              const isPaid = event.payment && event.payment.toLowerCase() !== 'free' && parseFloat(event.payment) > 0;
              const alreadyEnrolled = isAlreadyEnrolled(event.id);

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                >
                  {/* Logo */}
                  <div className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                    {event.logo ? (
                      <img src={event.logo} alt={event.name} className="w-full h-full object-cover" />
                    ) : (
                      <Award className="w-16 h-16 text-blue-500" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 font-fjalla-one">{event.name}</h3>
                        <p className="text-gray-600 mb-3">by {event.organizer_name || 'Organizer'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isUpcoming(event.date) && !event.is_full && (
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                            Open for Registration
                          </span>
                        )}
                        {event.is_full && (
                          <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold text-sm">
                            FULL
                          </span>
                        )}
                        {isPaid && (
                          <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            Rs. {event.payment}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-5 h-5 text-green-600" />
                        <span>{event.gender || 'All'} • {event.level || 'All Levels'}</span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        <span className={status.color}>{status.text}</span>
                      </div>
                    </div>

                    {status.showBar && (
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${status.barColor} transition-all duration-700`}
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Button: restriction — same coach cannot enroll twice (Already Enrolled blocks Enroll Now (Free) / Enroll & Pay) */}
                  <div className="flex-shrink-0">
                    {alreadyEnrolled ? (
                      <button disabled className="bg-indigo-200 text-indigo-800 px-8 py-4 rounded-xl font-bold cursor-not-allowed flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Already Enrolled
                      </button>
                    ) : !isUpcoming(event.date) ? (
                      <button disabled className="bg-gray-400 text-white px-8 py-4 rounded-xl font-bold cursor-not-allowed">
                        Event Ended
                      </button>
                    ) : event.is_full ? (
                      <button disabled className="bg-red-200 text-red-700 px-8 py-4 rounded-xl font-bold cursor-not-allowed">
                        Full
                      </button>
                    ) : !canEnroll ? (
                      <button
                        disabled
                        className="bg-orange-200 text-orange-700 px-8 py-4 rounded-xl font-bold cursor-not-allowed"
                        title={event.can_enroll_status?.message || 'Registration closed'}
                      >
                        Registration Closed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(event)}
                        className={`px-10 py-5 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
                          isPaid
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        }`}
                      >
                        {isPaid ? `Enroll & Pay (Rs. ${event.payment})` : 'Enroll Now (Free)'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default EventRegister;