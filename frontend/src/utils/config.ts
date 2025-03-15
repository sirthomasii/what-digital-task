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
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Ensure API_BASE_URL ends with a slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  
  // Ensure endpoint ends with a trailing slash for Django compatibility
  const endpointWithTrailingSlash = cleanEndpoint.endsWith('/') ? cleanEndpoint : `${cleanEndpoint}/`;
  
  const finalUrl = `${baseUrl}${endpointWithTrailingSlash}`;
  console.log(`getApiUrl('${endpoint}') => '${finalUrl}'`);
  return finalUrl;
}; 