'use client';
import { useState } from 'react';
import axios from 'axios';

export default function EventForm({ onEventSubmitted }) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    gender: 'Boys',
    level: '',
    duration_type: 'League',
    payment: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePayment = (value) => {
    return value.toLowerCase() === 'free' || !isNaN(Number(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePayment(formData.payment)) {
      alert("Payment must be a number or the word 'Free'");
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/api/events/create/', formData);
      alert("Event created successfully!");
      setFormData({
        name: '',
        date: '',
        venue: '',
        gender: 'Boys',
        level: '',
        duration_type: 'League',
        payment: '',
      });
      if (onEventSubmitted) {
        onEventSubmitted();
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting form.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
    >
      <h2 className="text-2xl font-semibold text-center text-violet-700 mb-6">
        Add Tournament Event
      </h2>

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
            className="w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
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
          className="w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
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
          className="w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        >
          <option value="League">League</option>
          <option value="Tournament">Tournament</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-lg shadow-md transition"
      >
        Submit
      </button>
    </form>
  );
}
