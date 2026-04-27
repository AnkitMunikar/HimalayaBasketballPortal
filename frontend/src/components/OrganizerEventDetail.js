'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, MapPin, Users, Trophy, Clock, Award, ArrowLeft,
  ChevronDown, ChevronUp, FileText, Image as ImageIcon, CheckCircle, XCircle, Clock as ClockIcon,
  UserPlus
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const OrganizerEventDetail = ({ eventId }) => {
  const router = useRouter();
  
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'payments'
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
      fetchTeams();
      fetchPayments();
    }
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/events/${eventId}/`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use the enroll/teams endpoint which supports organizers and filter by event
      const response = await fetch(`${API_BASE}/enroll/teams/`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const allTeams = await response.json();
        // Filter teams for this specific event
        const eventTeams = allTeams.filter(team => 
          team.event === parseInt(eventId) || team.event_details?.id === parseInt(eventId)
        );
        setTeams(eventTeams);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch all payments and filter by event
      const response = await fetch(`${API_BASE}/enroll/admin/payments/`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const allPayments = await response.json();
        // Filter payments for teams enrolled in this event
        const eventPayments = allPayments.filter(payment => 
          payment.enrollment_event === parseInt(eventId) || payment.enrollment?.event === parseInt(eventId)
        );
        setPayments(eventPayments);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      success: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Paid' },
      pending: { icon: ClockIcon, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Failed' },
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-gray-50 p-4 py-12">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-fjalla-one">Unable to Load Event</h2>
              <p className="text-gray-600 mb-6">{error || 'Event not found'}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/Organizer/Dashboard')}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Logo */}
              <div className="flex-shrink-0 w-32 h-32 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-md">
                {event.logo_url || event.logo ? (
                  <img 
                    src={event.logo_url || event.logo} 
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Award className="w-16 h-16 text-gray-400" />
                )}
              </div>

              {/* Title and Info */}
              <div className="flex-1 text-white">
                <h1 className="text-4xl font-bold mb-2 font-fjalla-one">{event.name || 'Unnamed Event'}</h1>
                <div className="space-y-2 mb-4">
                  <p className="flex items-center text-blue-100">
                    <Calendar className="w-5 h-5 mr-2" />
                    {formatDate(event.date)}
                  </p>
                  <p className="flex items-center text-blue-100">
                    <MapPin className="w-5 h-5 mr-2" />
                    {event.venue}, {event.city}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {teams.length} Teams Enrolled
                  </span>
                  {event.max_teams && (
                    <span className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Max: {event.max_teams} Teams
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('teams')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Enrolled Teams ({teams.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="font-semibold text-purple-600">Rs.</span>
                <span>Payments ({payments.length})</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'teams' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Enrolled Teams ({teams.length})</h3>
                  <button
                    type="button"
                    onClick={() => router.push(`/Coach/enroll/${eventId}?from=organizer`)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Team
                  </button>
                </div>
                {teams.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No teams enrolled yet</p>
                    <p className="text-sm mt-2">Click &quot;Add Team&quot; to register a team for this event.</p>
                  </div>
                ) : (
                  teams.map((team) => {
                    const isExpanded = expandedTeams.has(team.id);
                    return (
                      <div key={team.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Team Header - Clickable */}
                        <button
                          onClick={() => toggleTeam(team.id)}
                          className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>Coach: {team.coach_name}</span>
                              <span>•</span>
                              <span>{team.players?.length || 0} Players</span>
                              <span>•</span>
                              <span>{team.gender}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              {new Date(team.created_at).toLocaleDateString()}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </button>

                        {/* Team Details - Expandable */}
                        {isExpanded && (
                          <div className="p-6 bg-white border-t border-gray-200">
                            {/* Team Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Coach Name</p>
                                <p className="text-sm font-semibold text-gray-900">{team.coach_name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                                <p className="text-sm font-semibold text-gray-900">{team.contact_number || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                                <p className="text-sm font-semibold text-gray-900">{team.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                                <p className="text-sm font-semibold text-gray-900">{team.gender}</p>
                              </div>
                            </div>

                            {/* Players List */}
                            <div>
                              <h4 className="text-md font-semibold text-gray-900 mb-4">Players ({team.players?.length || 0})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {team.players?.map((player, idx) => (
                                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start gap-3 mb-3">
                                      {/* Player Photo */}
                                      {player.player_photo_url ? (
                                        <img
                                          src={player.player_photo_url}
                                          alt={player.player_name}
                                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                                        />
                                      ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xl font-semibold">
                                          {player.player_name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900">{player.player_name}</h5>
                                        <p className="text-sm text-gray-600">{player.position}</p>
                                        {player.jersey_no && (
                                          <p className="text-xs text-gray-500">#{player.jersey_no}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Age:</span>
                                        <span className="font-medium">{player.age || 'N/A'}</span>
                                      </div>
                                      {player.dob && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">DOB:</span>
                                          <span className="font-medium">{new Date(player.dob).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                                      {player.player_photo_url && (
                                        <a
                                          href={player.player_photo_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          <ImageIcon className="w-3 h-3" />
                                          Photo
                                        </a>
                                      )}
                                      {player.id_proof_url && (
                                        <a
                                          href={player.id_proof_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          <FileText className="w-3 h-3" />
                                          ID Proof
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-3xl font-bold text-gray-300 mx-auto mb-4 block">Rs.</span>
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {payment.reference_id?.substring(0, 12)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.enrollment_team_name || payment.enrollment?.team_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Rs. {parseFloat(payment.amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(payment.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerEventDetail;
