'use client';
import React, { useState } from 'react';
import { 
  Calendar, Users, FileText, Settings,
  CheckCircle, XCircle, Clock, Eye, Edit, Trash2
} from 'lucide-react';

const RsIcon = ({ className }) => <span className={`inline-block font-bold text-yellow-600 ${className || ''}`}>Rs.</span>;
import EventsTab from './EventsTab';
import UsersTab from './UsersTab';
import EnrollmentsTab from './EnrollmentsTab';
import PlayersTab from './PlayersTab';
import PaymentsTab from './PaymentsTab';

const API_BASE = 'http://127.0.0.1:8000/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [stats, setStats] = useState({
    events: 0,
    users: 0,
    enrollments: 0,
    payments: 0
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [eventsRes, usersRes, enrollmentsRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/events/`, { headers }),
        fetch(`${API_BASE}/admin/users/`, { headers }),
        fetch(`${API_BASE}/enroll/teams/`, { headers }),
        fetch(`${API_BASE}/enroll/admin/payments/`, { headers })
      ]);

      const events = eventsRes.ok ? await eventsRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];
      const enrollments = enrollmentsRes.ok ? await enrollmentsRes.json() : [];
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];

      setStats({
        events: events.length || 0,
        users: users.length || 0,
        enrollments: enrollments.length || 0,
        payments: payments.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'enrollments', label: 'Enrollments', icon: FileText },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'payments', label: 'Payments', icon: RsIcon },
  ];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-fjalla-one">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage events, users, enrollments, and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enrollments}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.payments}</p>
            </div>
            <span className="text-2xl font-bold text-yellow-500">Rs.</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap space-x-2 sm:space-x-8 px-2 sm:px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-2 sm:p-6">
          {activeTab === 'events' && <EventsTab onUpdate={fetchStats} />}
          {activeTab === 'users' && <UsersTab onUpdate={fetchStats} />}
          {activeTab === 'enrollments' && <EnrollmentsTab onUpdate={fetchStats} />}
          {activeTab === 'players' && <PlayersTab onUpdate={fetchStats} />}
          {activeTab === 'payments' && <PaymentsTab onUpdate={fetchStats} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
