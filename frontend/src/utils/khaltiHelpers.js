
/**
 * 📁 utils/khaltiHelpers.js
 * Helper functions for Khalti integration
 */

export function formatAmount(amount) {
  if (!amount) return 'FREE';
  if (amount === 'Free' || amount === 'FREE') return 'FREE';
  return `Rs. ${amount}`;
}

export function convertToPaysa(amountInRs) {
  // Khalti uses paisa (1 NRS = 100 paisa)
  return Math.round(parseFloat(amountInRs) * 100);
}

export function convertFromPaysa(amountInPaysa) {
  return (amountInPaysa / 100).toFixed(2);
}

export function isPaymentRequired(event) {
  if (!event) return false;
  if (!event.payment) return false;
  if (event.payment === 'Free' || event.payment === 'FREE') return false;
  return true;
}

export function formatTransactionId(id) {
  if (!id) return 'N/A';
  if (typeof id !== 'string') return String(id);
  return id.length > 12 ? id.substring(0, 8) + '...' : id;
}

export function getPaymentErrorDescription(errorCode) {
  const descriptions = {
    INSUFFICIENT_BALANCE: 'Your Khalti balance is insufficient. Please add funds.',
    INVALID_PIN: 'Invalid PIN. Please try again.',
    ACCOUNT_LOCKED: 'Your account is temporarily locked. Try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    PAYMENT_TIMEOUT: 'Payment request timed out. Please try again.',
    INVALID_TOKEN: 'Invalid payment token. Please try again.',
    DUPLICATE_PAYMENT: 'This payment was already processed.',
  };

  return descriptions[errorCode] || 'Payment failed. Please try again.';
}
