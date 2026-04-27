// frontend/src/app/payment/page.js
'use client'
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // or react-router-dom
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const PaymentVerify = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your payment...');
  const [teamId, setTeamId] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get pidx from URL query params (Khalti adds this)
      const pidx = searchParams.get('pidx');
      
      if (!pidx) {
        setStatus('error');
        setMessage('Invalid payment reference. Please contact support.');
        return;
      }

      // Get stored payment info
      const pendingPayment = localStorage.getItem('pending_payment');
      if (!pendingPayment) {
        setStatus('error');
        setMessage('Payment information not found. Please contact support.');
        return;
      }

      let paymentInfo;
      try {
        paymentInfo = JSON.parse(pendingPayment);
      } catch (_) {
        paymentInfo = {};
      }

      // Verify payment with backend
      const response = await fetch(`${API_BASE}/enroll/payments/khalti/verify/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Payment successful! Your team has been enrolled.');
        setTeamId(data.team_id);

        if (pendingPayment) {
          sessionStorage.setItem('payment_success', 'true');
          sessionStorage.setItem('enrolled_team_name', paymentInfo.team_name || 'Your team');
        }

        localStorage.removeItem('pending_payment');

        const redirectPath = (paymentInfo.from_organizer && paymentInfo.event_id)
          ? `/Organizer/events/${paymentInfo.event_id}`
          : '/Coach';

        setTimeout(() => {
          router.push(redirectPath);
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
      setMessage('An error occurred during verification. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {status === 'verifying' && (
          <div className="text-center">
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-fjalla-one">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2 font-fjalla-one">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {teamId && (
              <p className="text-sm text-gray-500">Team ID: {teamId}</p>
            )}
            <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2 font-fjalla-one">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  try {
                    const pp = localStorage.getItem('pending_payment');
                    if (pp) {
                      const info = JSON.parse(pp);
                      if (info.from_organizer && info.event_id) {
                        router.push(`/Organizer/events/${info.event_id}`);
                        return;
                      }
                    }
                  } catch (_) {}
                  router.push('/Coach');
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => window.location.href = 'mailto:support@himalayab.com'}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerify;
