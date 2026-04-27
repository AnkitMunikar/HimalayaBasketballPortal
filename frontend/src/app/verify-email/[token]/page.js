// frontend/src/app/verify-email/[token]/page.js
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function VerifyEmail() {
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your email...');
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      // ✅ Extract token from URL path [token]
      let token = params.token;
      
      if (Array.isArray(token)) {
        token = token[0];
      }
      
      console.log('Token from URL:', token);
      
      if (!token) {
        setMessage('Invalid verification link');
        return;
      }

      try {
        // ✅ Send token in POST body to backend
        const response = await fetch(`http://127.0.0.1:8000/api/verify-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: token }),
        });

        const data = await response.json();
        console.log('Backend response:', data);

        if (response.ok) {
          setMessage('✅ Email verified successfully! You can now log in.');
          setIsVerified(true);
          
          // Auto-redirect after 3 seconds
          let seconds = 3;
          const timer = setInterval(() => {
            seconds -= 1;
            setCountdown(seconds);
            
            if (seconds <= 0) {
              clearInterval(timer);
              router.push('/Login');
            }
          }, 1000);

          return () => clearInterval(timer);
        } else {
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Header />
      <div className="max-w-md w-full">
        
        {!isVerified && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-fjalla-one">Verifying Email</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {isVerified && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-fjalla-one">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                Redirecting in <span className="font-bold text-purple-600 text-lg">{countdown}</span> seconds...
              </p>
            </div>

            <button
              onClick={() => router.push('/Login')}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700"
            >
              Go to Login Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}