'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Clock, Trophy } from 'lucide-react';

export default function EventForm({ onEventSubmitted }) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    city: '',
    description: '',
    gender: 'Boys',
    level: '',
    duration_type: 'League',
    payment: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setError('Please login to continue');
      setTimeout(() => router.push('/Login'), 2000);
      return;
    }
    
    if (user.role !== 'event_organizer') {
      setError('Access denied. Only event organizers can create events.');
      setTimeout(() => router.push('/'), 3000);
      return;
    }
  }, [user, router]);

  // Don't render anything if user is not authenticated or not authorized
  if (!user || user.role !== 'event_organizer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            {!user 
              ? 'Please login to continue' 
              : 'Only event organizers can access this page'
            }
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePayment = (value) => {
    return value.toLowerCase() === 'free' || !isNaN(Number(value));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Event name is required');
      return false;
    }
    if (!formData.date) {
      setError('Event date is required');
      return false;
    }
    if (!formData.venue.trim()) {
      setError('Venue is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.level.trim()) {
      setError('Level is required');
      return false;
    }
    if (!formData.payment.trim()) {
      setError('Payment information is required');
      return false;
    }
    if (!validatePayment(formData.payment)) {
      setError("Payment must be a number or the word 'Free'");
      return false;
    }
    
    // Check if date is in the future
    const eventDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      setError('Event date must be in the future');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        date: formData.date,
        venue: formData.venue.trim(),
        city: formData.city.trim(),
        description: formData.description.trim(),
        gender: formData.gender,
        level: formData.level.trim(),
        duration_type: formData.duration_type,
        payment: formData.payment.toLowerCase() === 'free' ? 0 : Number(formData.payment),
      };

      const response = await fetch(
        `$http://127.0.0.1:8000/api/events/create/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Event created successfully!');
        setFormData({
          name: '',
          date: '',
          venue: '',
          city: '',
          description: '',
          gender: '',
          level: '',
          duration_type: 'League',
          payment: '',
        });
        setError('');
        if (onEventSubmitted) {
          onEventSubmitted(data);
        }
      } else {
        throw new Error(data.detail || data.non_field_errors?.[0] || 'Failed to create event');
      }
    } catch (error) {
      let errorMessage = 'Error submitting form.';
      if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      console.error('Event creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-violet-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-fjalla-one">Create New Tournament Event</h1>
          <p className="text-gray-600">Welcome, {user.name || user.username}! Create your next basketball tournament.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Event Name */}
          <div>
            <label htmlFor="name" className="flex items-center mb-2 font-medium text-gray-700">
              <Trophy className="w-4 h-4 mr-2 text-violet-600" />
              Event Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              placeholder="e.g., Summer Basketball Championship 2024"
            />
          </div>

          {/* Date and Venue Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="flex items-center mb-2 font-medium text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-violet-600" />
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="venue" className="flex items-center mb-2 font-medium text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-violet-600" />
                Venue *
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="e.g., City Sports Complex"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="flex items-center mb-2 font-medium text-gray-700">
              <MapPin className="w-4 h-4 mr-2 text-violet-600" />
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              placeholder="e.g., Kathmandu"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="flex items-center mb-2 font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
              placeholder="Brief description of the tournament..."
            />
          </div>

          {/* Gender and Duration Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="gender" className="flex items-center mb-2 font-medium text-gray-700">
                <Users className="w-4 h-4 mr-2 text-violet-600" />
                Gender Category *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Boys and Girls">Mixed (Boys and Girls)</option>
              </select>
            </div>

            <div>
              <label htmlFor="duration_type" className="flex items-center mb-2 font-medium text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-violet-600" />
                Format *
              </label>
              <select
                id="duration_type"
                name="duration_type"
                value={formData.duration_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              >
                <option value="League">League</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>
          </div>

          {/* Level and Payment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="level" className="flex items-center mb-2 font-medium text-gray-700">
                Level/Category *
              </label>
              <input
                type="text"
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="e.g., Under 18, Under 21, Open"
              />
            </div>

            <div>
              <label htmlFor="payment" className="flex items-center mb-2 font-medium text-gray-700">
                <span className="font-semibold text-violet-600 mr-2">Rs.</span>
                Registration Fee *
              </label>
              <input
                type="text"
                id="payment"
                name="payment"
                value={formData.payment}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="e.g., 'Free' or '5000' (in NRs)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter "Free" for no fee, or amount in Nepalese Rupees
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Event...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  Create Tournament Event
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>Once created, teams can enroll in your tournament through the public events page.</p>
          </div>
        </form>
      </div>
    </div>
  );
}