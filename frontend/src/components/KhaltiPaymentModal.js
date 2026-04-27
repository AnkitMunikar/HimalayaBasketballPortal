import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export function KhaltiPaymentModal({ enrollment, event, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleKhaltiPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📤 Initiating Khalti payment...');
      
      const token = localStorage.getItem('access_token');
      
      // STEP 1: Get payment details from backend
      const initiateRes = await fetch(`${API_BASE}/enroll/payments/khalti/initiate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enrollment_id: enrollment.id })
      });

      const initiateData = await initiateRes.json();

      if (!initiateRes.ok) {
        setError(initiateData.error || 'Failed to initiate payment');
        setLoading(false);
        return;
      }

      console.log('✅ Payment initiated:', initiateData);

      // STEP 2: Initialize Khalti
      const config = {
        publicKey: initiateData.public_key,
        productIdentity: String(initiateData.enrollment_id),
        productName: initiateData.event_name,
        productUrl: window.location.href,
        eventHandler: {
          onSuccess: async (payload) => {
            console.log('✅ Khalti payment successful:', payload);
            setVerifying(true);

            try {
              // STEP 3: Verify payment with backend
              const verifyRes = await fetch(`${API_BASE}/enroll/payments/khalti/verify/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: payload.token,
                  amount: payload.amount,
                  reference_id: initiateData.reference_id
                })
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                console.log('✅ Payment verified!');
                
                setTimeout(() => {
                  if (onSuccess) {
                    onSuccess(verifyData);
                  } else {
                    alert('✅ Payment successful! Your enrollment is confirmed.');
                  }
                  onClose();
                }, 1500);
              } else {
                setError(verifyData.error || 'Payment verification failed');
                setVerifying(false);
              }
            } catch (err) {
              console.error('❌ Verification error:', err);
              setError('Verification failed: ' + err.message);
              setVerifying(false);
            }
          },
          onError: (error) => {
            console.error('❌ Khalti error:', error);
            setError(`Payment failed: ${error.body?.name || 'Unknown error'}`);
            setLoading(false);
          },
          onClose: () => {
            console.log('Khalti modal closed');
            if (!verifying) {
              setLoading(false);
            }
          }
        }
      };

      // STEP 4: Show Khalti checkout
      const checkout = new window.KhaltiCheckout(config);
      checkout.show();

    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 font-fjalla-one">Payment Required</h2>
        <p className="text-gray-600 mb-6">{event.name}</p>

        {/* Amount Card */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
          <p className="text-3xl font-bold text-purple-600">Rs. {event.payment}</p>
          <p className="text-xs text-gray-500 mt-1">via Khalti</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Verifying State */}
        {verifying && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-700 text-sm">Verifying payment...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleKhaltiPayment}
            disabled={loading || verifying}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Connecting to Khalti...
              </>
            ) : (
              '💳 Pay with Khalti'
            )}
          </button>

          <button
            onClick={onClose}
            disabled={loading || verifying}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold"
          >
            Cancel
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          🔒 Secure payment powered by Khalti
        </p>
      </div>
    </div>
  );
}

export default KhaltiPaymentModal;