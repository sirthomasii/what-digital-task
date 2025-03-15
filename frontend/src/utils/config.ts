// Environment configuration for the application

// Determine if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get the API URL from environment variables or use a default
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// In production/staging environments, use relative URLs to avoid CORS issues
// In development, use the full URL with localhost
export const API_BASE_URL = isBrowser ? (
  // Check if we're in a production-like environment (not localhost)
  window.location.hostname !== 'localhost' && 
  !window.location.hostname.includes('127.0.0.1')
) 
  // For all production environments, use relative URL
  ? '/api'
  // Use env var or default in development
  : envApiUrl
  // If not in browser, use the environment variable
  : envApiUrl;

console.log('API_BASE_URL:', API_BASE_URL);
console.log('Environment API URL:', envApiUrl);
console.log('Running in browser:', isBrowser);
if (isBrowser) {
  console.log('Window location:', window.location.hostname);
}

// Helper function to construct API endpoints
export const getApiUrl = (endpoint: string): string => {
  try {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Ensure we have a valid base URL (fallback to absolute URL if needed)
    const baseUrl = (API_BASE_URL && typeof API_BASE_URL === 'string' && API_BASE_URL.trim() !== '')
      ? (API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`)
      : 'http://localhost:8000/api/';
    
    // Ensure endpoint ends with a trailing slash for Django compatibility
    const endpointWithTrailingSlash = cleanEndpoint.endsWith('/') ? cleanEndpoint : `${cleanEndpoint}/`;
    
    const finalUrl = `${baseUrl}${endpointWithTrailingSlash}`;
    
    // Check if the URL is absolute (has protocol) or relative
    const isAbsoluteUrl = finalUrl.startsWith('http://') || finalUrl.startsWith('https://');
    
    if (isAbsoluteUrl) {
      // For absolute URLs, validate with URL constructor
      try {
        new URL(finalUrl); // This will throw if invalid
      } catch (urlError) {
        console.error('Invalid absolute URL format:', finalUrl, urlError);
        // Fallback to a relative URL
        return `/api/${endpointWithTrailingSlash}`;
      }
    } else {
      // For relative URLs, no validation needed with URL constructor
      console.log(`getApiUrl('${endpoint}') => '${finalUrl}' (relative URL)`);
    }
    
    return finalUrl;
  } catch (error) {
    console.error('Error in getApiUrl:', error);
    // Ultimate fallback for any unexpected errors
    return `/api/${endpoint.replace(/^\/+/, '')}/`;
  }
}; 