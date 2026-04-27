
export const KHALTI_CONFIG = {
  PUBLIC_KEY: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY || '3cc75618198247c082273852d82f3aeb',
  SCRIPT_URL: 'https://khalti.com/static/bundle.js',
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api',
  TIMEOUT: 5 * 60 * 1000, // 5 minutes
  RETRY_ATTEMPTS: 3,
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  VERIFYING: 'verifying',
};

export const ERROR_MESSAGES = {
  SDK_NOT_LOADED: 'Khalti SDK not loaded. Please refresh the page.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'Authentication required. Please login first.',
  VERIFICATION_FAILED: 'Payment verification failed. Please try again.',
  INVALID_AMOUNT: 'Invalid payment amount.',
  ALREADY_PAID: 'This enrollment already has a successful payment.',
  TIMEOUT: 'Payment request timed out. Please try again.',
  INSUFFICIENT_FUNDS: 'Insufficient balance in your Khalti account.',
  PAYMENT_CANCELLED: 'Payment was cancelled.',
};
