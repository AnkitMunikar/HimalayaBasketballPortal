'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Trophy, Clock, Zap, Award, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const DisplayForm = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [openForRegistrationOnly, setOpenForRegistrationOnly] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);

  // Unique cities and levels from events (for dropdowns)
  const uniqueCities = React.useMemo(() => {
    if (!Array.isArray(events)) return [];
    const cities = [...new Set(events.map((e) => e.city).filter(Boolean))].sort();
    return cities;
  }, [events]);
  const uniqueLevels = React.useMemo(() => {
    if (!Array.isArray(events)) return [];
    const levels = [...new Set(events.map((e) => e.level).filter(Boolean))].sort();
    return levels;
  }, [events]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchEvents();
    }
  }, [mounted]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching events from:', `${API_BASE}/events/`);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Using auth token for request');
      } else {
        console.log('No auth token found, making unauthenticated request');
      }
      
      const response = await fetch(`${API_BASE}/events/?upcoming_only=1`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('Is array?', Array.isArray(data));

      let eventsData = [];
      if (Array.isArray(data)) {
        eventsData = data;
      } else if (data && Array.isArray(data.results)) {
        eventsData = data.results;
      } else if (data && Array.isArray(data.data)) {
        eventsData = data.data;
      } else if (data && data.events && Array.isArray(data.events)) {
        eventsData = data.events;
      } else {
        console.error('Unexpected API response format:', data);
        throw new Error('API returned unexpected data format');
      }

      console.log('Processed events data:', eventsData);
      setEvents(eventsData);

    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchEvents();
    }
  }, [mounted]);

  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(events)) {
      console.warn('Events is not an array:', events);
      return [];
    }

    const searchLower = (searchTerm || '').trim().toLowerCase();
    const searchKeywords = searchLower ? searchLower.split(/\s+/) : [];

    return events.filter(event => {
      if (!event || typeof event !== 'object') {
        console.warn('Invalid event object:', event);
        return false;
      }

      if (!event.name || !event.venue) {
        console.warn('Event missing required properties:', event);
        return false;
      }

      try {
        // Search across multiple fields: name, venue, city, description, level, gender, organizer
        const searchableText = [
          event.name,
          event.venue,
          event.city,
          event.description,
          event.level,
          event.gender,
          event.organizer_name
        ].filter(Boolean).join(' ').toLowerCase();

        const matchesSearch = !searchKeywords.length ||
          searchKeywords.every((kw) => searchableText.includes(kw));

        if (!matchesSearch) return false;

        // Event type filter (League / Tournament)
        if (filter === 'tournament' && event.duration_type !== 'Tournament') return false;
        if (filter === 'league' && event.duration_type !== 'League') return false;

        // City filter
        if (filterCity !== 'all' && (event.city || '').trim() !== filterCity) return false;

        // Gender filter
        if (filterGender !== 'all' && (event.gender || '').trim() !== filterGender) return false;

        // Level filter
        if (filterLevel !== 'all' && (event.level || '').trim() !== filterLevel) return false;

        // Payment filter (Free vs Paid)
        if (filterPayment === 'free') {
          if (event.payment !== 'Free' && String(event.payment || '').toLowerCase() !== 'free') return false;
        } else if (filterPayment === 'paid') {
          if (event.payment === 'Free' || String(event.payment || '').toLowerCase() === 'free') return false;
          const num = parseFloat(event.payment);
          if (isNaN(num) || num <= 0) return false;
        }

        // Open for registration only (not full, can enroll)
        if (openForRegistrationOnly) {
          const canEnroll = event.can_enroll_status?.can_enroll === true;
          if (!canEnroll || event.is_full) return false;
        }

        return true;
      } catch (filterError) {
        console.error('Error filtering event:', event, filterError);
        return false;
      }
    });
  }, [events, filter, searchTerm, filterCity, filterGender, filterLevel, filterPayment, openForRegistrationOnly]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Date not available';
    }
  };

  const isUpcoming = (dateString) => {
    // Check if event date is in the future (strictly greater than today)
    if (!dateString) return false;
    
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      
      // Set both to start of day for fair comparison
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      // Event is upcoming only if it's AFTER today (not today or past)
      return !isNaN(eventDate.getTime()) && eventDate > today;
    } catch (error) {
      console.error('Error checking if upcoming:', dateString, error);
      return false;
    }
  };

  // ✨ NEW: Get enrollment status color and text
  const getEnrollmentStatus = (event) => {
    const current = event.current_enrollment_count || 0;
    const maxTeams = event.max_teams || 0;
    const isFull = event.is_full || false;
    const availableSlots = event.available_slots;

    // Unlimited enrollment
    if (maxTeams === 0) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: `${current} teams enrolled`,
        percentage: 0,
        showBar: false
      };
    }

    // Calculate percentage
    const percentage = maxTeams > 0 ? (current / maxTeams) * 100 : 0;

    // Full
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

    // Almost full (75-99%)
    if (percentage >= 75) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        text: `${availableSlots} spots left (${current}/${maxTeams})`,
        percentage,
        showBar: true,
        barColor: 'bg-orange-500'
      };
    }

    // Decent availability (50-74%)
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

    // Plenty of spots (0-49%)
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: `${current}/${maxTeams} teams`,
      percentage,
      showBar: true,
      barColor: 'bg-green-500'
    };
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-16">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2 font-fjalla-one">Error Loading Events</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchEvents}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen py-8" suppressHydrationWarning={true}>
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8 flex flex-col items-center justify-center">
  <h1 className="text-4xl font-fjalla-one font-bold text-gray-900 mb-2">Events</h1>
  <p className="text-gray-600">Browse and register for upcoming tournaments and leagues</p>
</div>

        {/* Search & Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search bar - keywords: name, venue, city, level, organizer, description */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-xl">
              <input
                type="text"
                placeholder="Search by name, venue, city, level, organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'tournament', label: 'Tournaments' },
                { key: 'league', label: 'Leagues' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    filter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters: City, Gender, Level, Payment, Open for registration */}
          <div className="flex flex-wrap gap-3 items-center border border-gray-200 rounded-lg p-3 bg-gray-50">
            <span className="text-sm font-medium text-gray-600 mr-1">Filters:</span>

            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Boys and Girls">Boys and Girls</option>
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              {uniqueLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payment</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={openForRegistrationOnly}
                onChange={(e) => setOpenForRegistrationOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              Open for registration only
            </label>

            {(filterCity !== 'all' || filterGender !== 'all' || filterLevel !== 'all' || filterPayment !== 'all' || openForRegistrationOnly) && (
              <button
                type="button"
                onClick={() => {
                  setFilterCity('all');
                  setFilterGender('all');
                  setFilterLevel('all');
                  setFilterPayment('all');
                  setOpenForRegistrationOnly(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="text-center text-gray-600 text-sm">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Events Horizontal Bars */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Check back soon for upcoming tournaments and events.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => {
              const enrollmentStatus = getEnrollmentStatus(event);
              const canEnroll = event.can_enroll_status?.can_enroll ?? true;
              const enrollmentMessage = event.can_enroll_status?.message || '';

              return (
                <div
                  key={event.id || Math.random()}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => router.push(`/DisplayEvents/${event.id}`)}
                >
                  {/* Logo */}
                  <div className="flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {event.logo ? (
                      <img 
                        src={event.logo} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Award className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {event.name || 'Unnamed Event'}
                      </h3>
                      {isUpcoming(event.date) && !event.is_full && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                          Upcoming
                        </span>
                      )}
                      {event.is_full && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                          FULL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{event.organizer_name || 'Unknown Organizer'}</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm mb-3">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{formatDate(event.date)}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                        <span className="truncate">{event.venue || 'Venue TBD'}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="truncate">{event.gender || 'Any'} • {event.level || 'All'}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                        <span className="truncate">{event.duration_type || 'Event'}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <span className="text-amber-500 font-semibold mr-2">Rs.</span>
                        <span className="truncate">
                          {event.payment === 'Free' || !event.payment 
                            ? 'Free Entry' 
                            : `${event.payment}`}
                        </span>
                      </div>

                      {/* ✨ NEW: Enrollment Status with badge */}
                      <div className="flex items-center text-gray-600">
                        <Trophy className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                        <span className={`truncate font-medium ${enrollmentStatus.color}`}>
                          {enrollmentStatus.text}
                        </span>
                      </div>
                    </div>

                    {/* ✨ NEW: Enrollment Progress Bar */}
                    {enrollmentStatus.showBar && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${enrollmentStatus.barColor} transition-all duration-300`}
                          style={{ width: `${enrollmentStatus.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {!isUpcoming(event.date) ? (
                      <button 
                        disabled
                        className="bg-gray-300 text-gray-500 py-2 px-6 rounded-lg cursor-not-allowed font-medium text-sm whitespace-nowrap"
                      >
                        Event Completed
                      </button>
                    ) : event.is_full ? (
                      <button 
                        disabled
                        className="bg-red-100 text-red-600 py-2 px-6 rounded-lg cursor-not-allowed font-medium text-sm whitespace-nowrap flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Full
                      </button>
                    ) : !canEnroll ? (
                      <button 
                        disabled
                        className="bg-orange-100 text-orange-600 py-2 px-6 rounded-lg cursor-not-allowed font-medium text-sm whitespace-nowrap"
                        title={enrollmentMessage}
                      >
                        Registration Closed
                      </button>
                    ) : (
                      <button 
                        className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Coach Account required, Please Signup as Coach to register');
                        }}
                      >
                        Register?
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

export default DisplayForm;