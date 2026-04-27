'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/utils/passwordValidation';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    confirm_email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'player',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false); // ✨ NEW
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message) setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.confirm_email.trim()) newErrors.confirm_email = 'Please confirm your email';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm your password';
    if (!formData.role) newErrors.role = 'Please select a role';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.email && formData.confirm_email && formData.email !== formData.confirm_email) {
      newErrors.confirm_email = 'Emails do not match';
    }

    const passwordError = formData.password ? validatePassword(formData.password) : null;
    if (passwordError) newErrors.password = passwordError;

    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setMessage('');
    setErrors({});
    setShowVerificationMessage(false); // ✨ Reset
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
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
        // ✨ NEW: Check if email verification is required
        if (data.verification_required) {
          setShowVerificationMessage(true);
          setMessage(data.message || 'Registration successful! Please check your email to verify your account.');
          
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

          // Don't redirect automatically - let user read the message
        } else {
          // Old flow (if backend doesn't require verification)
          setMessage('Registration successful! Please login to continue.');
          
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

          setTimeout(() => {
            router.push('/Login');
          }, 2000);
        }
      } else {
        // Handle errors
        if (data.error) {
          setMessage(data.error);
        } else if (data.username) {
          setErrors(prev => ({ ...prev, username: data.username[0] }));
        } else if (data.email) {
          setErrors(prev => ({ ...prev, email: data.email[0] }));
        } else if (data.confirm_email) {
          setErrors(prev => ({ ...prev, confirm_email: data.confirm_email[0] }));
        } else if (data.password) {
          setErrors(prev => ({ ...prev, password: data.password[0] }));
        } else if (data.confirm_password) {
          setErrors(prev => ({ ...prev, confirm_password: data.confirm_password[0] }));
        } else if (data.role) {
          setErrors(prev => ({ ...prev, role: data.role[0] }));
        } else if (data.non_field_errors) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
          
          {/* Left Side - Form */}
          <div className="order-2 lg:order-1">
            <div className="bg-white/10">
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 font-fjalla-one">Create Account</h1>
                <p className="text-gray-700">Join our basketball community today</p>
              </div>

              {/* ✨ NEW: Email Verification Success Message */}
              {showVerificationMessage && (
                <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Check Your Email! 📧</h3>
                      <p className="text-green-800 text-sm leading-relaxed mb-3">
                        We've sent a verification link to <strong>{formData.email || 'your email'}</strong>
                      </p>
                      <div className="bg-white/60 p-3 rounded border border-green-300 mb-3">
                        <p className="text-sm text-gray-700 font-medium mb-2">Next steps:</p>
                        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                          <li>Check your inbox (and spam folder)</li>
                          <li>Click the verification link in the email</li>
                          <li>Come back and login!</li>
                        </ol>
                      </div>
                      <button
                        onClick={() => router.push('/Login')}
                        className="text-sm text-green-700 hover:text-green-800 font-medium underline"
                      >
                        Go to Login Page →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Message */}
              {message && !showVerificationMessage && (
                <div className={`mb-6 p-4 rounded-lg text-sm ${
                  message.includes('successful') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.name 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="Full Name"
                    disabled={loading}
                  />
                  {errors.name && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.name}</p>}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Username <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.username 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="username123"
                    disabled={loading}
                  />
                  {errors.username && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.email 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="email@example.com"
                    disabled={loading}
                  />
                  {errors.email && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.email}</p>}
                </div>

                {/* Confirm Email */}
                <div>
                  <label htmlFor="confirm_email" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Confirm Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="confirm_email"
                    name="confirm_email"
                    value={formData.confirm_email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.confirm_email 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="email@example.com"
                    disabled={loading}
                  />
                  {errors.confirm_email && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.confirm_email}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.phone 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="9800000000"
                    disabled={loading}
                  />
                  {errors.phone && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.phone}</p>}
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Role <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-900 ${
                      errors.role 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    disabled={loading}
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="event_organizer">Event Organizer</option>
                  </select>
                  {errors.role && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.role}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.password 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                    minLength={8}
                  />
                  <p className="text-gray-500 text-xs mt-1">{PASSWORD_REQUIREMENTS}</p>
                  {errors.password && <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-500 text-gray-900 ${
                      errors.confirm_password
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-white/50 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  {errors.confirm_password && (
                    <p className="text-red-700 text-xs mt-1.5 font-medium">{errors.confirm_password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/Login')}
                      className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Logo */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <img 
                src="/logohim.png" 
                alt="Logo" 
                className="relative z-10 w-full h-auto drop-shadow-2xl" 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}