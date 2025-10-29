'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Trophy, Clock, DollarSign, Award, ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const EventDetail = ({ eventId }) => {
  const router = useRouter();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Fetching event ${eventId} from ${API_BASE}/events/${eventId}/`);
      
      const response = await fetch(`${API_BASE}/events/${eventId}/`, {
        method: 'GET',
        headers,
      });

      console.log(`Response status: ${response.status}`);

      if (response.status === 401) {
        // Unauthorized - try without token
        console.log('Got 401, retrying without token');
        const retryResponse = await fetch(`${API_BASE}/events/${eventId}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }

        const data = await retryResponse.json();
        setEvent(data);
        return;
      }

      if (response.status === 404) {
        throw new Error('Event not found. It may have been deleted or the ID is incorrect.');
      }

      if (response.status === 410) {
        throw new Error('Event is no longer available (deleted).');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

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

  const formatTime = (dateString) => {
    if (!dateString) return 'Time TBD';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid time';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Event</h2>
              <p className="text-gray-600 mb-6">{error || 'Event not found'}</p>
              <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Possible reasons:</strong>
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>The event has been deleted</li>
                  <li>The event ID is incorrect</li>
                  <li>You don't have permission to view this event</li>
                  <li>The event is no longer available</li>
                </ul>
              </div>
              <button
                onClick={() => router.back()}
                className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </button>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section with Logo */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Logo */}
              <div className="flex-shrink-0 w-32 h-32 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-md">
                {event.logo ? (
                  <img 
                    src={event.logo} 
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Award className="w-16 h-16 text-gray-400" />
                )}
              </div>

              {/* Title and Organizer */}
              <div className="flex-1 text-white">
                <h1 className="text-4xl font-bold mb-2">{event.name || 'Unnamed Event'}</h1>
                <p className="text-blue-100 text-lg mb-4">Organized by: {event.organizer_name || 'Unknown Organizer'}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    ✓ Approved
                  </span>
                  <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {event.enrolled_teams_count || 0} Teams Enrolled
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Information</h2>

                {/* Date & Time */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Date & Time</p>
                    <p className="text-lg text-gray-900 font-semibold">{formatDate(event.date)}</p>
                    <p className="text-sm text-gray-600">{formatTime(event.date)}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Venue</p>
                    <p className="text-lg text-gray-900 font-semibold">{event.venue || 'Venue TBD'}</p>
                    <p className="text-sm text-gray-600">{event.city || 'City TBD'}</p>
                  </div>
                </div>

                {/* Gender & Level */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Category</p>
                    <p className="text-lg text-gray-900 font-semibold">{event.gender || 'Any'} • {event.level || 'All Levels'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>

                {/* Duration Type */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Event Type</p>
                    <p className="text-lg text-gray-900 font-semibold">{event.duration_type || 'Event'}</p>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Entry Fee</p>
                    <p className="text-lg text-gray-900 font-semibold">
                      {event.payment === 'Free' || !event.payment ? 'Free Entry' : event.payment}
                    </p>
                  </div>
                </div>

                {/* Teams Enrolled */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Trophy className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Teams Enrolled</p>
                    <p className="text-lg text-gray-900 font-semibold">{event.enrolled_teams_count || 0} Teams</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}


            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back to Events
              </button>
              <button
                onClick={() => {
                  alert('Coach Account required to enroll');
                }}
                className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Enroll Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
