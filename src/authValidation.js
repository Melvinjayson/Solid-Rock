'use strict';
// Kept dependency-free so login validation is testable without Supabase or Expo.
function isSixDigitOtp(value) {
  return typeof value === 'string' && /^\d{6}$/.test(value.trim());
}
function normalizeEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
module.exports = { isSixDigitOtp, normalizeEmail };
