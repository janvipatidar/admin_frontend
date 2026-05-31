const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const normalizePhone = (phone) =>
  String(phone || '')
    .trim()
    .replace(/[\s\-()]/g, '');

export const isValidEmail = (email) => EMAIL_RE.test(String(email || '').trim());

export const isValidPhone = (phone) => {
  const p = normalizePhone(phone);
  return /^(\+91)?[6-9]\d{9}$/.test(p);
};

export const validateCandidateForm = (data) => {
  const errors = [];
  if (!String(data.name || '').trim()) errors.push('Name is required');
  if (!isValidEmail(data.email)) errors.push('Enter a valid email address');
  if (!isValidPhone(data.phone)) errors.push('Enter a valid 10-digit mobile number');
  return errors;
};
