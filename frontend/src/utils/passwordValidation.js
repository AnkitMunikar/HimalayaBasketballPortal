/**
 * Password rules: min 8 chars, at least one uppercase, one digit, one special character.
 * Must match backend (Django AUTH_PASSWORD_VALIDATORS + accounts.validators).
 */

const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/;

export const PASSWORD_REQUIREMENTS = 'At least 8 characters, one uppercase letter, one number, and one special character (e.g. !@#$%^&*)';

/**
 * Returns an error message if password is invalid, otherwise null.
 */
export function validatePassword(password) {
  if (!password || password.length < MIN_LENGTH) {
    return 'Password must be at least 8 characters long.';
  }
  if (!HAS_UPPERCASE.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!HAS_DIGIT.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!HAS_SPECIAL.test(password)) {
    return 'Password must contain at least one special character (e.g. !@#$%^&*).';
  }
  return null;
}
