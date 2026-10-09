const crypto = require('crypto');

// e.g. ORD-261009-7K3QF2 — date prefix + random suffix (uniqueness is enforced by a DB index; caller retries).
module.exports = function generateOrderNumber(date = new Date()) {
  const d = date.toISOString().slice(2, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `ORD-${d}-${suffix}`;
};
