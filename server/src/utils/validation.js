export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 20) return false;
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
}

export function validatePassword(password) {
  if (!password || password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

export function getPasswordStrengthMessage(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';

  const checks = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const missing = [];
  if (!checks.hasUppercase) missing.push('uppercase letter');
  if (!checks.hasLowercase) missing.push('lowercase letter');
  if (!checks.hasNumber) missing.push('number');
  if (!checks.hasSpecialChar) missing.push('special character');

  if (missing.length > 0) {
    return `Password must contain: ${missing.join(', ')}`;
  }

  return 'Password is strong';
}
