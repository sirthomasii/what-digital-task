// Using localStorage to persist token even after browser is closed

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
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