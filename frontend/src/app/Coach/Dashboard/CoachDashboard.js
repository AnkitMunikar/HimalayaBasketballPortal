// frontend/src/app/Coach/Dashboard/CoachDashboard.js
import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, CheckCircle, X } from 'lucide-react';
import EventRegister from '@/app/Coach/Dashboard/Eventregister';
import TeamEnrollments from './Teamenrollment'

const API_BASE = 'http://localhost:8000/api';

const CoachDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [enrolledTeams, setEnrolledTeams] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // ✅ NEW: Success banner state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ No access token found in localStorage');
      setError('Authentication required. Please login first.');
    }
    console.log('🔐 Using token:', token ? `${token.substring(0, 10)}...` : 'NONE');
    
    return {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    };
  };

  // ============= FETCH CURRENT USER =============
  const fetchCurrentUser = async () => {
    try {
      console.log('📥 Fetching current user...');
      const response = await fetch(`${API_BASE}/user/`, { 
        headers: getAuthHeaders() 
      });
      
      if (response.status === 401) {
        console.error('❌ Unauthorized - Token might be expired');
        setError('Session expired. Please login again.');
        return;
      }
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        console.log('✅ Current user:', userData);
      } else {
        console.error('❌ Failed to fetch user:', response.status);
      }
    } catch (err) {
      console.error('❌ Error fetching user:', err);
    }
  };

  // ============= FETCH EVENTS =============
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Fetching events from:', `${API_BASE}/events/list/`);
      
      const response = await fetch(`${API_BASE}/events/list/`, { 
        headers: getAuthHeaders() 
      });
      
      console.log('📊 Events response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Events fetch error:', response.status, errorText.substring(0, 200));
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched events:', data);
      // Sort by date descending so recent/upcoming events show first
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(list);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError('Failed to load events. Check console for details.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // ============= FETCH ENROLLED TEAMS =============
  const fetchEnrolledTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Fetching enrolled teams from:', `${API_BASE}/enroll/teams/`);
      
      const response = await fetch(`${API_BASE}/enroll/teams/`, { 
        headers: getAuthHeaders() 
      });
      
      console.log('📊 Teams response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Teams fetch error:', response.status, errorText.substring(0, 200));
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched enrolled teams:', data);
      const teams = Array.isArray(data) ? data : (data.results || data.teams || []);
      setEnrolledTeams(teams);
    } catch (err) {
      console.error('❌ Error fetching enrolled teams:', err);
      setError('Failed to load enrollments. Check console for details.');
      setEnrolledTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // ============= INITIAL MOUNT & DATA REFRESH =============
  useEffect(() => {
    console.log('🚀 CoachDashboard mounted - fetching data...');
    fetchCurrentUser();
    fetchEvents();
    fetchEnrolledTeams();
  }, []);

  // ✅ NEW: Check for payment success on mount
  useEffect(() => {
    const paymentSuccess = sessionStorage.getItem('payment_success');
    const teamName = sessionStorage.getItem('enrolled_team_name');
    
    if (paymentSuccess === 'true') {
      console.log('🎉 Payment success detected!');
      setShowSuccessBanner(true);
      setSuccessMessage(`Payment successful! Team "${teamName || 'Your team'}" has been enrolled.`);
      setActiveTab('enrollments'); // ✅ Auto-switch to enrollments tab
      
      // Clear session flags
      sessionStorage.removeItem('payment_success');
      sessionStorage.removeItem('enrolled_team_name');
      
      // Refresh data to show new enrollment
      fetchEnrolledTeams();
      
      // Hide banner after 8 seconds
      setTimeout(() => setShowSuccessBanner(false), 8000);
    }
  }, []);

  // ============= CALLBACKS FOR CHILD COMPONENTS =============
  const handleEnrollSuccess = async () => {
    // Refresh both events and teams after successful enrollment
    await fetchEnrolledTeams();
    await fetchEvents();
    setActiveTab('enrollments'); // Switch to enrollments tab
  };

  const handleEnrollmentUpdated = async () => {
    // Refresh enrolled teams when updated
    await fetchEnrolledTeams();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="mb-4 py-4 sm:py-6 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-fjalla-one font-bold text-gray-900 mb-2">Coach Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 text-center">Manage your teams and enrollments</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
        
        {/* ✅ SUCCESS BANNER */}
        {showSuccessBanner && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg animate-slide-down">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    🎉 Enrollment Successful!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {successMessage}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="flex-shrink-0 ml-4 text-green-600 hover:text-green-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <nav className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'events' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Events
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'enrollments' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Enrollments ({enrolledTeams.length})
          </button>
        </nav>

        {/* Global Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">⚠️ {error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'events' && (
          <EventRegister 
            events={events}
            loading={loading}
            error={error}
            currentUser={currentUser}
            enrolledTeams={enrolledTeams}
            onEnrollSuccess={handleEnrollSuccess}
          />
        )}

        {activeTab === 'enrollments' && (
          <TeamEnrollments 
            enrolledTeams={enrolledTeams}
            loading={loading}
            error={error}
            onEnrollmentUpdated={handleEnrollmentUpdated}
          />
        )}
      </div>
      
    </div>
  );
};

export default CoachDashboard;