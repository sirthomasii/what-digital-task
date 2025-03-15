// Environment configuration for the application

// API URL with fallback to local development URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to construct API endpoints
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Ensure API_BASE_URL ends with a slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  
  // Ensure endpoint ends with a trailing slash for Django compatibility
  const endpointWithTrailingSlash = cleanEndpoint.endsWith('/') ? cleanEndpoint : `${cleanEndpoint}/`;
  
  return `${baseUrl}${endpointWithTrailingSlash}`;
}; 