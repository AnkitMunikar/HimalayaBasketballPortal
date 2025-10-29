'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Trophy, Clock, DollarSign, Zap, Award } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const DisplayForm = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);

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
      
      const response = await fetch(`${API_BASE}/events/`, {
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
        // Backend already filters expired events (date__gte=today)
        // Frontend only handles search and type filtering
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.venue.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        
        if (filter === 'upcoming') {
          // All events from backend are upcoming, just apply search filter
          return matchesSearch;
        }
        
        if (filter === 'tournament') {
          return event.duration_type === 'Tournament' && matchesSearch;
        }
        
        if (filter === 'league') {
          return event.duration_type === 'League' && matchesSearch;
        }

        return matchesSearch;
      } catch (filterError) {
        console.error('Error filtering event:', event, filterError);
        return false;
      }
    });
  }, [events, filter, searchTerm]);

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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Events</h3>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Browse and register for upcoming tournaments and leagues</p>
        </div>

        {/* Search & Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'tournament', label: 'Tournaments' },
                { key: 'league', label: 'Leagues' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
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
            {filteredEvents.map(event => (
              <div
                key={event.id || Math.random()}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300 cursor-pointer"
                onClick={() => router.push(`/DisplayEvents/${event.id}`)}
              >
                {/* Logo */}
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
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
                    {isUpcoming(event.date) && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{event.organizer_name || 'Unknown Organizer'}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                      <DollarSign className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                      <span className="truncate">
                        {event.payment === 'Free' || !event.payment 
                          ? 'Free Entry' 
                          : `${event.payment}`}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Trophy className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{event.enrolled_teams_count || 0} Teams</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isUpcoming(event.date) ? (
                    <button 
                      className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm whitespace-nowrap"
                      onClick={() => {
                        alert('Coach Account required');
                      }}
                    >
                      Register
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="bg-gray-300 text-gray-500 py-2 px-6 rounded-lg cursor-not-allowed font-medium text-sm whitespace-nowrap"
                    >
                      Event Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayForm;