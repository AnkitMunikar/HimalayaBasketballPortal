const API_BASE = 'http://localhost:8000/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchEvents = async (setEvents) => {
  try {
    const res = await fetch(`${API_BASE}/coach/events/`, { headers: getAuthHeaders() });
    const data = await res.json();
    setEvents(data);
  } catch (err) {
    console.error('Error fetching events:', err);
  }
};

export const fetchMyTeams = async (setMyTeams) => {
  try {
    const res = await fetch(`${API_BASE}/coach/teams/`, { headers: getAuthHeaders() });
    const data = await res.json();
    setMyTeams(data);
  } catch (err) {
    console.error('Error fetching teams:', err);
  }
};

export const fetchEnrolledTeams = async (setEnrolledTeams) => {
  try {
    const res = await fetch(`${API_BASE}/enroll/teams/`, { headers: getAuthHeaders() });
    const data = await res.json();
    setEnrolledTeams(data);
  } catch (err) {
    console.error('Error fetching enrolled teams:', err);
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isUpcoming = (dateString) => {
  const eventDate = new Date(dateString);
  return eventDate >= new Date();
};
