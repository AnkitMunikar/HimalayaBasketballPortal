'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    confirm_email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'player', // Default to player
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message) setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.confirm_email.trim()) newErrors.confirm_email = 'Please confirm your email';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm your password';
    if (!formData.role) newErrors.role = 'Please select a role';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Email matching
    if (formData.email && formData.confirm_email && formData.email !== formData.confirm_email) {
      newErrors.confirm_email = 'Emails do not match';
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Password matching
    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage('');
    setErrors({});
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Registration API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          confirm_email: formData.confirm_email.trim(),
          phone: formData.phone.trim() || '',
          password: formData.password,
          confirm_password: formData.confirm_password,
          role: formData.role,
        }),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok) {
        // Registration successful
        setMessage('Registration successful! Please login to continue.');
        
        // Clear form
        setFormData({
          name: '',
          username: '',
          email: '',
          confirm_email: '',
          phone: '',
          password: '',
          confirm_password: '',
          role: 'player',
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push('/Login');
        }, 2000);
      } else {
        // Handle registration errors
        if (data.username) {
          setErrors(prev => ({ ...prev, username: data.username[0] }));
        }
        if (data.email) {
          setErrors(prev => ({ ...prev, email: data.email[0] }));
        }
        if (data.confirm_email) {
          setErrors(prev => ({ ...prev, confirm_email: data.confirm_email[0] }));
        }
        if (data.password) {
          setErrors(prev => ({ ...prev, password: data.password[0] }));
        }
        if (data.confirm_password) {
          setErrors(prev => ({ ...prev, confirm_password: data.confirm_password[0] }));
        }
        if (data.role) {
          setErrors(prev => ({ ...prev, role: data.role[0] }));
        }
        if (data.non_field_errors) {
          setMessage(data.non_field_errors[0]);
        } else if (data.detail) {
          setMessage(data.detail);
        } else {
          setMessage('Registration failed. Please check your information and try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white mt-20 rounded-3xl shadow-2xl p-8 w-full max-w-md transform hover:scale-105 transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600 mt-2">Join our basketball community</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 border rounded-lg ${
            message.includes('successful') 
              ? 'bg-green-100 border-green-300 text-green-700' 
              : 'bg-red-100 border-red-300 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.name 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.username 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Choose a username"
              disabled={loading}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Confirm Email */}
          <div>
            <label htmlFor="confirm_email" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Email *
            </label>
            <input
              type="email"
              id="confirm_email"
              name="confirm_email"
              value={formData.confirm_email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.confirm_email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Confirm your email"
              disabled={loading}
            />
            {errors.confirm_email && <p className="text-red-500 text-sm mt-1">{errors.confirm_email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.phone 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter your phone number"
              disabled={loading}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              I am a *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.role 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              disabled={loading}
            >
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="event_organizer">Event Organizer</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.password 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Choose a password"
              disabled={loading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                errors.confirm_password
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Re-enter your password"
              disabled={loading}
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          {/* Login Link */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/Login')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}