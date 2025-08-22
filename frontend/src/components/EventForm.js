'use client';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

export default function EventForm({ onEventSubmitted }) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    gender: 'Boys',
    level: '',
    duration_type: 'League',
    payment: '',
  });
  const [error, setError] = useState('');

  if (!user || user.role !== 'event_organizer') {
    router.push('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePayment = (value) => {
    return value.toLowerCase() === 'free' || !isNaN(Number(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePayment(formData.payment)) {
      setError("Payment must be a number or the word 'Free'");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        date: formData.date,
        venue: formData.venue,
        gender: formData.gender,
        level: formData.level,
        duration_type: formData.duration_type,
        payment: formData.payment.toLowerCase() === 'free' ? 0 : Number(formData.payment),
      };
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/create/`,
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      alert('Event created successfully!');
      setFormData({
        name: '',
        date: '',
        venue: '',
        gender: 'Boys',
        level: '',
        duration_type: 'League',
        payment: '',
      });
      setError('');
      if (onEventSubmitted) {
        onEventSubmitted(response.data);
      }
    } catch (error) {
      let errorMessage = 'Error submitting form.';
      if (error.response) {
        errorMessage = error.response.data?.detail || 
                       error.response.data?.non_field_errors?.[0] || 
                       `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach the server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
      console.error('Event creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200 font-geist-sans"
    >
      <h2 className="text-2xl font-semibold text-center text-violet-700 mb-6">
        Add Tournament Event
      </h2>
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}
      {[
        ['name', 'Event Name'],
        ['date', 'Date', 'date'],
        ['venue', 'Venue'],
        ['level', 'Level'],
        ['payment', 'Payment'],
      ].map(([name, label, type = 'text']) => (
        <div key={name} className="mb-5">
          <label htmlFor={name} className="block mb-1 font-medium text-gray-700">
            {label}
          </label>
          <input
            type={type}
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition font-geist-sans"
            placeholder={label === 'Payment' ? 'e.g. "Free" or amount in NRs' : ''}
          />
        </div>
      ))}
      <div className="mb-5">
        <label htmlFor="gender" className="block mb-1 font-medium text-gray-700">
          Gender
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition font-geist-sans"
        >
          <option value="Boys">Boys</option>
          <option value="Girls">Girls</option>
          <option value="Mixed">Mixed</option>
        </select>
      </div>
      <div className="mb-6">
        <label htmlFor="duration_type" className="block mb-1 font-medium text-gray-700">
          Duration Type
        </label>
        <select
          id="duration_type"
          name="duration_type"
          value={formData.duration_type}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition font-geist-sans"
        >
          <option value="League">League</option>
          <option value="Tournament">Tournament</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-lg shadow-md transition font-geist-sans"
      >
        Submit
      </button>
    </form>
  );
}