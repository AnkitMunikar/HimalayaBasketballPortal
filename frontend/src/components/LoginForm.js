'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const role = user.role;
      if (role === 'event_organizer') {
        router.push('/Organizer');
      } else if (role === 'coach') {
        router.push('/Coach');
      } else if (role === 'player') {
        router.push('/Player/Dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      setResendMessage('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resend-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('✅ Verification email sent! Please check your inbox.');
      } else {
        setResendMessage(data.error || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setResendMessage('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResendEmail(false);
    setResendMessage('');

    if (!formData.username.trim() || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        username: formData.username.trim(),
        password: formData.password,
      });

      if (result.success) {
        // Store tokens and user data in localStorage for consistency with new code
      

        const role = result.user?.role;
        if (role === 'event_organizer') {
          router.push('/Organizer');
        } else if (role === 'coach') {
          router.push('/Coach');
        } else if (role === 'player') {
          router.push('/Player/Dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        if (result.error?.verification_required) {
          setError(result.error?.error || 'Please verify your email to log in.');
          setResendEmail(result.email || formData.username.trim());
          setShowResendEmail(true);
        } else {
          setError(result.error?.detail || result.error?.message || 'Invalid username or password');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
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
                <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
                <p className="text-gray-700">Login to your basketball account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Email Verification Required Section */}
              {showResendEmail && (
                <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">Email Verification Required</h3>
                      <p className="text-yellow-800 text-sm mb-3">
                        Please verify your email before logging in. Didn't receive the email?
                      </p>
                      
                      <div className="space-y-3">
                        <input
                          type="email"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                        />
                        
                        <button
                          onClick={handleResendVerification}
                          disabled={resendLoading}
                          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                        </button>

                        {resendMessage && (
                          <p className={`text-sm font-medium ${
                            resendMessage.includes('✅') ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {resendMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 text-gray-900"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 text-gray-900"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging In...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>

                <div className="text-center pt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/Register')}
                      className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      Forgot Password?
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