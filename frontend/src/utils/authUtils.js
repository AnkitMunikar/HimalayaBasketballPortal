// utils/authUtils.js
export async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    throw new Error('No refresh token available. Please log in again.');
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed.');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    // Optionally update refresh if rotated (if backend supports)
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }

    return data.access;
  } catch (error) {
    console.error('Refresh token error:', error);
    // Clear storage and redirect to login on failure
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
    throw error;
  }
}