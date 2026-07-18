export function mapAuthError(error: { message?: string, status?: number } | null) {
  const message = error?.message?.toLowerCase() || ''
  const status = error?.status

  if (status === 429 || message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait and try again.'
  }
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Incorrect email or password. Try again or use Magic Link.'
  }
  if (message.includes('user banned') || message.includes('blocked')) {
    return 'Your account has been suspended. Contact support for assistance.'
  }
  if (message.includes('email not confirmed')) {
    return 'Email not confirmed. Check your inbox, or use Magic Link.'
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Please log in instead.'
  }
  if (message.includes('weak password') || message.includes('password should be')) {
    return 'Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.'
  }
  if (message.includes('expired') || message.includes('token expired')) {
    return 'This link has expired. Please try again.'
  }
  if (message.includes('invalid code') || message.includes('invalid token')) {
    return 'Invalid or expired verification code.'
  }
  if (message.includes('email not found') || message.includes('user not found')) {
    return 'No account found with this email. Please sign up instead.'
  }
  if (message.includes('provider') || message.includes('oauth')) {
    return 'Social login failed. Please try again or use email instead.'
  }
  if (message.includes('captcha')) {
    return 'Security check failed. Please refresh and try again.'
  }
  return 'Something went wrong. Please try again.'
}
