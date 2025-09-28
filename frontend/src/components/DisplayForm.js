'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Trophy, Clock, DollarSign } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const DisplayForm = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.venue.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        
        if (filter === 'upcoming') {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          const today = new Date();
          return eventDate >= today && matchesSearch;
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
    if (!dateString) return false;
    
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      return !isNaN(eventDate.getTime()) && eventDate >= today;
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
    <div className="w-full max-w-7xl mx-auto mt-16" suppressHydrationWarning={true}>
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

        <div className="text-center text-gray-600">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
        </div>
      </div>

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map(event => (
            <div
              key={event.id || Math.random()}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {event.name || 'Unnamed Event'}
                  </h3>
                  {isUpcoming(event.date) && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Upcoming
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-sm">
                  Organized by {event.organizer_name || 'Unknown Organizer'}
                </p>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                  <span className="font-medium">{formatDate(event.date)}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-red-500" />
                  <span>{event.venue || 'Venue TBD'}</span>
                </div>
                
                {event.city && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 text-red-500" />
                    <span>{event.city}</span>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-green-500" />
                  <span>
                    {event.gender || 'Any'} • {event.level || 'All Levels'}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-purple-500" />
                  <span>{event.duration_type || 'Event'}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-5 h-5 mr-3 text-amber-500" />
                  <span className="font-medium">
                    {event.payment === 'Free' || !event.payment 
                      ? 'Free Entry' 
                      : `${event.payment}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Teams Enrolled:</span>
                    <span className="font-bold text-blue-600">
                      {event.enrolled_teams_count || 0}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  {isUpcoming(event.date) ? (
                    <button 
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      onClick={() => {
                        alert('Coach Account required');
                      }}
                    >
                      Register Team
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                    >
                      Event Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayForm;