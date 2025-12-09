// Safe API key loaders - these read from environment variables only
// Never expose keys directly to console or network requests

export const getFacebookAppId = (): string => {
  if (typeof window !== 'undefined' && window._env_) {
    return window._env_.FACEBOOK_APP_ID || '';
  }
  return '';
};

export const getGoogleClientId = (): string => {
  if (typeof window !== 'undefined' && window._env_) {
    return window._env_.GOOGLE_CLIENT_ID || '';
  }
  return '';
};

// Log loaded keys (safe - doesn't expose actual values in console)
export const logEnvironmentStatus = (): void => {
  const facebookId = getFacebookAppId();
  const googleId = getGoogleClientId();
  
  console.log('✓ Facebook SDK:', facebookId ? 'Loaded' : 'Not configured');
  console.log('✓ Google OAuth:', googleId ? 'Loaded' : 'Not configured');
};
