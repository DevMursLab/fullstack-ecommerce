function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return /^[0-9+\-\s()]{7,20}$/.test(phone.trim());
}

function validateRegisterInput({ name, email, phone, password }) {
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (!isValidEmail(email)) {
    errors.push('A valid email is required');
  }
  if (phone && !isValidPhone(phone)) {
    errors.push('Phone number is invalid');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  return { isValid: errors.length === 0, errors };
}

function validateLoginInput({ email, password }) {
  const errors = [];
  if (!isValidEmail(email)) {
    errors.push('A valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }
  return { isValid: errors.length === 0, errors };
}

function validateChangePasswordInput({ currentPassword, newPassword }) {
  const errors = [];
  if (!currentPassword) errors.push('Current password is required');
  if (!newPassword || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long');
  }
  return { isValid: errors.length === 0, errors };
}

module.exports = {
  isValidEmail,
  isValidPhone,
  validateRegisterInput,
  validateLoginInput,
  validateChangePasswordInput,
};
