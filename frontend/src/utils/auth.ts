// Using localStorage to persist token even after browser is closed

interface User {
  username: string;
  email: string;
}

export const setToken = (token: string, userData: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
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
};

export const isValidToken = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;

  try {
    // Validate token by making a request to products endpoint
    const response = await fetch('http://localhost:8000/api/products/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Token validation failed:', response.status);
      removeToken(); // Clear invalid token
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    removeToken(); // Clear token on error
    return false;
  }
}; 