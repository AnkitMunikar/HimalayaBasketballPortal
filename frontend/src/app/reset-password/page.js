'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/utils/passwordValidation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid reset link. Missing token.');
      return;
    }
    const checkToken = async () => {
      try {
        const response = await fetch(`${API_URL}/api/verify-reset-token/?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        setTokenValid(response.ok && data.valid === true);
        if (!response.ok) setError(data.error || 'This link is invalid or has expired.');
      } catch (err) {
        setTokenValid(false);
        setError('Could not verify link. Please try again.');
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Password reset successful! You can now log in.');
        setTimeout(() => router.push('/Login'), 2500);
      } else {
        const errMsg = data.new_password?.[0] || data.confirm_password?.[0] || data.token?.[0] || data.error || 'Failed to reset password.';
        setError(Array.isArray(errMsg) ? errMsg.join(' ') : errMsg);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 font-fjalla-one">Invalid or Expired Link</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/forgot-password')}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium"
        >
          Request a new reset link
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 font-fjalla-one">Set New Password</h1>
      <p className="text-gray-600 mb-2">Enter your new password below.</p>
      <p className="text-gray-500 text-xs mb-6">{PASSWORD_REQUIREMENTS}</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-800 mb-1.5">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
            minLength={8}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-1.5">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
            minLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <button
          type="button"
          onClick={() => router.push('/Login')}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Back to Login
        </button>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
      <Footer />
    </main>
  );
}
