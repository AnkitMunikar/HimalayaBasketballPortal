import React, { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Trophy, MapPin, DollarSign, Edit, Eye, UserPlus, Trash2, User, Award, Zap } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const CoachDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [enrolledTeams, setEnrolledTeams] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // ✅ IMPROVED: Better token handling
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
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError('Failed to load events. Check console for details.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    console.log('🚀 CoachDashboard mounted - fetching data...');
    fetchCurrentUser();
    fetchEvents();
    fetchEnrolledTeams();
  }, []);

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

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch (e) {
      return false;
    }
  };

  const handleEnrollClick = (event) => {
    setSelectedEvent(event);
    setShowEnrollForm(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowTeamForm(true);
  };

  const handleViewPlayers = (team) => {
    setSelectedTeam(team);
    setShowPlayersModal(true);
  };

  // ✅ FILTERED EVENTS FOR DISPLAY
  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(events)) {
      console.warn('Events is not an array:', events);
      return [];
    }

    return events.filter(event => {
      if (!event || typeof event !== 'object') {
        console.warn('Invalid event object:', event);
        return false;
      }

      if (!event.name || !event.venue) {
        console.warn('Event missing required properties:', event);
        return false;
      }

      try {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.venue.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        
        if (filter === 'upcoming') {
          return matchesSearch;
        }
        
        if (filter === 'tournament') {
          return event.duration_type === 'Tournament' && matchesSearch;
        }
        
        if (filter === 'league') {
          return event.duration_type === 'League' && matchesSearch;
        }

        return matchesSearch;
      } catch (filterError) {
        console.error('Error filtering event:', event, filterError);
        return false;
      }
    });
  }, [events, filter, searchTerm]);

  const EnrollmentForm = ({ event, onClose }) => {
    const [formData, setFormData] = useState({
      team_name: '',
      gender: 'Boys',
    });
    const [players, setPlayers] = useState(
      Array(8).fill().map(() => ({ player_name: '', age: '', position: 'PG' }))
    );
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const addPlayer = () => {
      if (players.length < 15) {
        setPlayers([...players, { player_name: '', age: '', position: 'PG' }]);
      }
    };

    const removePlayer = (index) => {
      if (players.length > 8) {
        setPlayers(players.filter((_, i) => i !== index));
      }
    };

    const updatePlayer = (index, field, value) => {
      setPlayers(players.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    };

    const handleSubmit = async () => {
      setFormLoading(true);
      setFormError('');

      try {
        const validPlayers = players.filter((p) => p.player_name.trim() && p.age);
        
        if (validPlayers.length < 8) {
          setFormError('At least 8 players are required');
          setFormLoading(false);
          return;
        }

        if (!formData.team_name.trim()) {
          setFormError('Team name is required');
          setFormLoading(false);
          return;
        }

        const payload = {
          team_name: formData.team_name.trim(),
          gender: formData.gender,
          coach_name: currentUser?.name || currentUser?.username || 'Unknown',
          contact_number: currentUser?.phone || '',
          email: currentUser?.email || '',
          event: event.id,
          players: validPlayers,
        };

        console.log('📤 Sending enrollment payload:', payload);

        const response = await fetch(`${API_BASE}/enroll/teams/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        console.log('📊 Enrollment response status:', response.status);

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType?.includes('application/json')) {
          responseData = await response.json();
          console.log('✅ Enrollment response (JSON):', responseData);
        } else {
          const errorText = await response.text();
          console.error('❌ Non-JSON response:', errorText.substring(0, 500));
          responseData = { error: `Server error (${response.status}): ${errorText.substring(0, 100)}...` };
        }

        if (response.ok) {
          alert('✅ Team enrolled successfully!');
          onClose();
          await fetchEnrolledTeams();
        } else {
          let errorMsg = 'Enrollment failed';
          
          if (responseData.detail) {
            errorMsg = responseData.detail;
          } else if (responseData.error) {
            errorMsg = responseData.error;
          } else if (responseData.non_field_errors) {
            errorMsg = responseData.non_field_errors[0];
          } else if (responseData.team_name) {
            errorMsg = Array.isArray(responseData.team_name) ? responseData.team_name[0] : responseData.team_name;
          } else {
            const firstError = Object.entries(responseData)[0];
            if (firstError) {
              errorMsg = `${firstError[0]}: ${Array.isArray(firstError[1]) ? firstError[1][0] : firstError[1]}`;
            }
          }
          
          setFormError(errorMsg);
          console.error('❌ Enrollment error response:', responseData);
        }
      } catch (err) {
        console.error('❌ Enrollment network error:', err);
        setFormError('Network error. Check console and ensure backend is running.');
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Enroll Team in {event.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              <strong>Error:</strong> {formError}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-900">Coach Information (Auto-filled)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="text-gray-800">{currentUser?.name || currentUser?.username || 'Not set'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-800">{currentUser?.email || 'Not set'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-800">{currentUser?.phone || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Team Name *"
                className="p-3 border rounded-md"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                required
              />
              <select
                className="p-3 border rounded-md"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Boys and Girls">Boys and Girls</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-4">
                <h4 className="text-lg font-semibold">Players ({players.length}/15) - Minimum 8 required</h4>
                <button
                  onClick={addPlayer}
                  disabled={players.length >= 15}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Player
                </button>
              </div>
              <div className="grid gap-4">
                {players.map((player, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-md bg-gray-50">
                    <input
                      type="text"
                      placeholder="Player Name *"
                      className="p-2 border rounded-md"
                      value={player.player_name}
                      onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Age *"
                      min="1"
                      max="99"
                      className="p-2 border rounded-md"
                      value={player.age}
                      onChange={(e) => updatePlayer(index, 'age', e.target.value)}
                      required
                    />
                    <select
                      className="p-2 border rounded-md"
                      value={player.position}
                      onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                    >
                      <option value="PG">Point Guard</option>
                      <option value="SG">Shooting Guard</option>
                      <option value="SF">Small Forward</option>
                      <option value="PF">Power Forward</option>
                      <option value="C">Center</option>
                    </select>
                    {players.length > 8 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSubmit}
                disabled={formLoading}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {formLoading ? 'Enrolling...' : 'Enroll Team'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TeamForm = ({ team, onClose }) => {
    const [players, setPlayers] = useState(
      team?.players || Array(8).fill().map(() => ({ player_name: '', age: '', position: 'PG' }))
    );
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const addPlayer = () => {
      if (players.length < 15) {
        setPlayers([...players, { player_name: '', age: '', position: 'PG' }]);
      }
    };

    const removePlayer = (index) => {
      if (players.length > 8) {
        setPlayers(players.filter((_, i) => i !== index));
      }
    };

    const updatePlayer = (index, field, value) => {
      setPlayers(players.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    };

    const handleSubmit = async () => {
      setFormLoading(true);
      setFormError('');

      try {
        const validPlayers = players.filter((p) => p.player_name.trim() && p.age);
        
        if (validPlayers.length < 8) {
          setFormError('At least 8 players are required');
          setFormLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/enroll/teams/${team.id}/`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            team_name: team.team_name,
            gender: team.gender,
            coach_name: team.coach_name,
            contact_number: team.contact_number || '',
            email: team.email || '',
            event: team.event,
            players: validPlayers,
          }),
        });

        if (response.ok) {
          alert('✅ Players updated!');
          onClose();
          fetchEnrolledTeams();
        } else {
          const contentType = response.headers.get('content-type');
          let errorData;
          
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
          } else {
            const errorText = await response.text();
            errorData = { error: errorText.substring(0, 200) };
          }
          
          setFormError(JSON.stringify(errorData));
        }
      } catch (err) {
        console.error('❌ Update error:', err);
        setFormError('Network error. Try again.');
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between mb-6">
            <h3 className="text-xl font-bold">Edit Players - {team.team_name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              <strong>Error:</strong> {formError}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md border">
              <h4 className="font-semibold mb-3 text-lg">Team Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-gray-600 block">Team Name:</span>
                  <p>{team.team_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block">Gender:</span>
                  <p>{team.gender}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block">Event:</span>
                  <p>{team.event_details?.name}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4">
                <h4 className="text-lg font-semibold">Players ({players.length}/15)</h4>
                <button
                  onClick={addPlayer}
                  disabled={players.length >= 15}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Player
                </button>
              </div>
              <div className="grid gap-4">
                {players.map((player, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-md bg-gray-50">
                    <input
                      type="text"
                      placeholder="Player Name"
                      className="p-2 border rounded-md"
                      value={player.player_name}
                      onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      min="1"
                      max="99"
                      className="p-2 border rounded-md"
                      value={player.age}
                      onChange={(e) => updatePlayer(index, 'age', e.target.value)}
                    />
                    <select
                      className="p-2 border rounded-md"
                      value={player.position}
                      onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                    >
                      <option value="PG">Point Guard</option>
                      <option value="SG">Shooting Guard</option>
                      <option value="SF">Small Forward</option>
                      <option value="PF">Power Forward</option>
                      <option value="C">Center</option>
                    </select>
                    {players.length > 8 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSubmit}
                disabled={formLoading}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {formLoading ? 'Updating...' : 'Update Players'}
              </button>
              <button onClick={onClose} className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PlayersModal = ({ team, onClose }) => {
    if (!team) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between mb-6">
            <h3 className="text-xl font-bold">{team.team_name} - Players ({team.players?.length || 0})</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>
          <div className="space-y-4">
            {team.players?.length ? (
              <div className="grid gap-4">
                {team.players.map((player, index) => (
                  <div key={player.id || index} className="bg-gray-50 p-4 rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium text-gray-600 block">Name:</span>
                        <p>{player.player_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Age:</span>
                        <p>{player.age}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Position:</span>
                        <p>
                          {player.position === 'PG'
                            ? 'Point Guard'
                            : player.position === 'SG'
                            ? 'Shooting Guard'
                            : player.position === 'SF'
                            ? 'Small Forward'
                            : player.position === 'PF'
                            ? 'Power Forward'
                            : player.position === 'C'
                            ? 'Center'
                            : player.position}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No players added</h4>
                <button
                  onClick={() => {
                    onClose();
                    handleEditTeam(team);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Players
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t">
            {team.players?.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  handleEditTeam(team);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                <Edit className="w-4 h-4 inline mr-1" />
                Edit Players
              </button>
            )}
            <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">Coach Dashboard</h1>
          <p className="text-gray-600">Manage your teams and enrollments</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'events' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Events
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'enrollments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Enrollments ({enrolledTeams.length})
          </button>
        </nav>

        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Available Events</h2>
            </div>
            <div className="p-6">
              {/* ✅ Search & Filter Section */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'all', label: 'All Events' },
                      { key: 'upcoming', label: 'Upcoming' },
                      { key: 'tournament', label: 'Tournaments' },
                      { key: 'league', label: 'Leagues' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          filter === key
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center text-gray-600 text-sm">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {/* ✅ Events Display */}
              {loading ? (
                <p className="text-center py-12 text-gray-600">Loading...</p>
              ) : error ? (
                <p className="text-center py-12 text-red-600">⚠️ {error}</p>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filter !== 'all' 
                      ? 'Try adjusting your search or filters.' 
                      : 'Check back soon for upcoming tournaments and events.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300"
                    >
                      {/* Logo */}
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {event.logo ? (
                          <img 
                            src={event.logo} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Award className="w-12 h-12 text-gray-400" />
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {event.name || 'Unnamed Event'}
                          </h3>
                          {isUpcoming(event.date) && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                              Upcoming
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{event.organizer_name || 'Unknown Organizer'}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{formatDate(event.date)}</span>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            <span className="truncate">{event.venue || 'Venue TBD'}</span>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                            <span className="truncate">{event.gender || 'Any'} • {event.level || 'All'}</span>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                            <span className="truncate">
                              {event.payment === 'Free' || !event.payment 
                                ? 'Free Entry' 
                                : `Rs. ${event.payment}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleEnrollClick(event)}
                          disabled={!isUpcoming(event.date)}
                          className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Enroll Team
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">My Team Enrollments</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <p className="text-center py-12 text-gray-600">Loading...</p>
                ) : error ? (
                  <p className="text-center py-12 text-red-600">⚠️ {error}</p>
                ) : enrolledTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No enrollments yet</h3>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300"
                      >
                        {/* Logo */}
                        <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-gray-400" />
                        </div>

                        {/* Team Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {team.team_name}
                            </h3>
                            {isUpcoming(team.event_details?.date) && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">Coach: {team.coach_name}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{formatDate(team.event_details?.date)}</span>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <Trophy className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                              <span className="truncate">{team.event_details?.name}</span>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <Users className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                              <span className="truncate">{team.players?.length || 0} Players</span>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                              <span className="truncate">{team.gender}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex gap-2">
                          <button
                            onClick={() => handleViewPlayers(team)}
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm whitespace-nowrap"
                          >
                            <Edit className="w-4 h-4 inline mr-1" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                    <p className="text-2xl font-semibold">{enrolledTeams.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Players</p>
                    <p className="text-2xl font-semibold">
                      {enrolledTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-semibold">
                      {enrolledTeams.filter((team) => isUpcoming(team.event_details?.date)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEnrollForm && selectedEvent && (
          <EnrollmentForm
            event={selectedEvent}
            onClose={() => {
              setShowEnrollForm(false);
              setSelectedEvent(null);
            }}
          />
        )}
        {showTeamForm && selectedTeam && (
          <TeamForm
            team={selectedTeam}
            onClose={() => {
              setShowTeamForm(false);
              setSelectedTeam(null);
            }}
          />
        )}
        {showPlayersModal && selectedTeam && (
          <PlayersModal
            team={selectedTeam}
            onClose={() => {
              setShowPlayersModal(false);
              setSelectedTeam(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;