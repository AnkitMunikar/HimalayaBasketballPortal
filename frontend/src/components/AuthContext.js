'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Loaded user from localStorage:', parsedUser);
          // Normalize role
          if (parsedUser.role) {
            const roleLower = parsedUser.role.toLowerCase();
            if (roleLower === 'organizer') parsedUser.role = 'event_organizer';
            if (roleLower === 'coach') parsedUser.role = 'coach';
            if (roleLower === 'player') parsedUser.role = 'player';
          }
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (response.ok) {
      const userData = data.user || {
        username: credentials.username,
        role: data.role || 'unknown',
        id: data.id || null, // in case backend doesn’t send full user object
      };

      if (!userData.role) {
        console.warn('No role provided in login response, defaulting to "unknown"');
        userData.role = 'unknown';
      }

      // Normalize role
      const roleLower = userData.role.toLowerCase();
      if (roleLower === 'organizer') userData.role = 'event_organizer';
      if (roleLower === 'coach') userData.role = 'coach';
      if (roleLower === 'player') userData.role = 'player';

      // ✅ Store tokens + user info
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_data', JSON.stringify(userData));

      // ✅ NEW — store user_id separately
      if (userData.id) {
        localStorage.setItem('user_id', userData.id);
      } else {
        console.warn('⚠️ userData.id not found in response');
      }

      setUser(userData);
      console.log('User set after login:', userData);

      // Redirect by role
      setTimeout(() => {
        if (userData.role === 'event_organizer') router.push('/Organizer');
        else if (userData.role === 'coach') router.push('/Coach');
        else if (userData.role === 'player') router.push('/player');
        else router.push('/');
      }, 100);

      return {
        success: true,
        user: userData,
        access: data.access,
        refresh: data.refresh,
      };
    } else {
      console.error('Login failed:', data);
      return {
        success: false,
        error: data.detail || data.message || 'Login failed. Please try again.',
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
};

  const signup = async (userData) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        console.error('Signup failed:', data);
        return { success: false, error: data.detail || data.message || 'Signup failed. Please try again.' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};