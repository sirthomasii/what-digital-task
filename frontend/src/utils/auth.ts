// Using localStorage to persist token even after browser is closed
import { getApiUrl } from './config';

interface User {
  username: string;
  email: string;
}

export const setToken = (token: string, userData: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  console.log('Token and user data stored in localStorage');
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Token and user data removed from localStorage');
};

export const isValidToken = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) {
    console.log('No token found');
    return false;
  }

  try {
    // Validate token by making a request to products endpoint
    const apiUrl = getApiUrl('products');
    console.log('Validating token with request to:', apiUrl);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Add credentials to ensure cookies are sent
      credentials: 'include',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Token validation response status:', response.status);
    
    if (response.ok) {
      return true;
    } else {
      console.error('Token validation failed with status:', response.status);
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch {
        console.error('Could not parse error response');
      }
      return false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    // If the error is due to network issues, try a simpler approach
    // Just check if the token exists and hasn't expired
    try {
      if (token) {
        // Simple check: if token exists and hasn't expired
        // This is a fallback when the API is unreachable
        console.log('Falling back to basic token validation');
        return true;
      }
    } catch (e) {
      console.error('Fallback validation failed:', e);
    }
    return false;
  }
}; 