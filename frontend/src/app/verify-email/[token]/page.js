'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function VerifyEmail() {
  const [message, setMessage] = useState('Verifying your email...');
  const [isVerified, setIsVerified] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Email verified successfully! You can now log in.');
          setIsVerified(true);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/Login');
          }, 3000);
        } else {
          setMessage(data.error || 'Failed to verify email. The link may have expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setMessage('An error occurred while verifying your email.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isVerified ? '🎉 Email Verified!' : 'Verifying Email...'}
        </h1>
        <p className="text-center">{message}</p>
        {isVerified && (
          <div className="mt-4 text-center">
            <p className="text-green-500">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
