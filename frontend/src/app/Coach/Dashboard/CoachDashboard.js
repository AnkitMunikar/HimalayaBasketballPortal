import React, { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Trophy, MapPin, Clock, DollarSign, Edit, Eye, UserPlus, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const CoachDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [enrolledTeams, setEnrolledTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/coach/events/`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const response = await fetch(`${API_BASE}/coach/teams/`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setMyTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchEnrolledTeams = async () => {
    try {
      const response = await fetch(`${API_BASE}/enroll/teams/`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setEnrolledTeams(data);
    } catch (error) {
      console.error('Error fetching enrolled teams:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchMyTeams();
    fetchEnrolledTeams();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate >= today;
  };

  const handleEnrollClick = (event) => {
    setSelectedEvent(event);
    setShowEnrollForm(true);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleViewPlayers = (team) => {
    setSelectedTeam(team);
    setShowPlayersModal(true);
  };

  const handleDeleteEnrollment = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE}/enroll/teams/${teamId}/`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          alert('Enrollment deleted successfully!');
          fetchEnrolledTeams();
        } else {
          alert('Failed to delete enrollment.');
        }
      } catch (error) {
        alert('Network error. Please try again.');
        console.error('Delete error:', error);
      }
    }
  };

  const EnrollmentForm = ({ event, onClose }) => {
    const [formData, setFormData] = useState({
      team_name: '',
      coach_name: '',
      gender: 'Boys',
      contact_number: '',
      email: ''
    });
    const [players, setPlayers] = useState(Array(8).fill().map(() => ({
      player_name: '',
      age: '',
      position: 'PG',
      grade: ''
    })));
    const [loading, setLoading] = useState(false);

    const addPlayer = () => {
      if (players.length < 15) {
        setPlayers([...players, { player_name: '', age: '', position: 'PG', grade: '' }]);
      }
    };

    const removePlayer = (index) => {
      if (players.length > 8) {
        setPlayers(players.filter((_, i) => i !== index));
      }
    };

    const updatePlayer = (index, field, value) => {
      const updated = players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      );
      setPlayers(updated);
    };

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const enrollmentData = {
          ...formData,
          event: event.id,
          players: players.filter(p => p.player_name.trim() !== '')
        };

        const response = await fetch(`${API_BASE}/enroll/teams/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(enrollmentData)
        });

        if (response.ok) {
          alert('Team enrolled successfully!');
          onClose();
          fetchEnrolledTeams();
          fetchMyTeams();
        } else {
          const error = await response.json();
          alert(`Enrollment failed: ${JSON.stringify(error)}`);
        }
      } catch (error) {
        alert('Network error. Please try again.');
        console.error('Enrollment error:', error);
      }
      setLoading(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Enroll Team in {event.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Team Name"
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.team_name}
                onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Coach Name"
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.coach_name}
                onChange={(e) => setFormData({...formData, coach_name: e.target.value})}
                required
              />
              <select
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Boys and Girls">Boys and Girls</option>
              </select>
              <input
                type="tel"
                placeholder="Contact Number"
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.contact_number}
                onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Players ({players.length}/15)</h4>
                <button
                  onClick={addPlayer}
                  disabled={players.length >= 15}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Player
                </button>
              </div>

              <div className="grid gap-4">
                {players.map((player, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <input
                      type="text"
                      placeholder="Player Name"
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.player_name}
                      onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      min="1"
                      max="99"
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.age}
                      onChange={(e) => updatePlayer(index, 'age', e.target.value)}
                      required
                    />
                    <select
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.position}
                      onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                    >
                      <option value="PG">Point Guard</option>
                      <option value="SG">Shooting Guard</option>
                      <option value="SF">Small Forward</option>
                      <option value="PF">Power Forward</option>
                      <option value="C">Center</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Grade/Class"
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.grade}
                      onChange={(e) => updatePlayer(index, 'grade', e.target.value)}
                    />
                    {players.length > 8 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors"
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
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Enrolling...' : 'Enroll Team'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors font-semibold"
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
      team?.players || Array(8).fill().map(() => ({
        player_name: '',
        age: '',
        position: 'PG',
        grade: ''
      }))
    );
    const [loading, setLoading] = useState(false);

    const addPlayer = () => {
      if (players.length < 15) {
        setPlayers([...players, { player_name: '', age: '', position: 'PG', grade: '' }]);
      }
    };

    const removePlayer = (index) => {
      if (players.length > 8) {
        setPlayers(players.filter((_, i) => i !== index));
      }
    };

    const updatePlayer = (index, field, value) => {
      const updated = players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      );
      setPlayers(updated);
    };

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const teamData = {
          team_name: team.team_name,
          gender: team.gender,
          coach_name: team.coach_name,
          contact_number: team.contact_number || '',
          email: team.email || '',
          event: team.event,
          players: players.filter(p => p.player_name.trim() !== '')
        };

        const response = await fetch(`${API_BASE}/enroll/teams/${team.id}/`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(teamData)
        });

        if (response.ok) {
          alert('Players updated successfully!');
          onClose();
          fetchEnrolledTeams();
        } else {
          const error = await response.json();
          alert(`Update failed: ${JSON.stringify(error)}`);
        }
      } catch (error) {
        alert('Network error. Please try again.');
        console.error('Player update error:', error);
      }
      setLoading(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Edit Players - {team.team_name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md border">
              <h4 className="font-semibold mb-3 text-lg">Team Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-gray-600 block mb-1">Team Name:</span>
                  <p className="text-gray-900">{team.team_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block mb-1">Gender:</span>
                  <p className="text-gray-900">{team.gender}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block mb-1">Event:</span>
                  <p className="text-gray-900">{team.event_details?.name}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md border-l-4 border-blue-400">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can only edit player information. Team details cannot be changed once enrolled in an event.
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Players ({players.length}/15)</h4>
                <button
                  onClick={addPlayer}
                  disabled={players.length >= 15}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Player
                </button>
              </div>

              <div className="grid gap-4">
                {players.map((player, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <input
                      type="text"
                      placeholder="Player Name"
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.player_name}
                      onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      min="1"
                      max="99"
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.age}
                      onChange={(e) => updatePlayer(index, 'age', e.target.value)}
                    />
                    <select
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.position}
                      onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                    >
                      <option value="PG">Point Guard</option>
                      <option value="SG">Shooting Guard</option>
                      <option value="SF">Small Forward</option>
                      <option value="PF">Power Forward</option>
                      <option value="C">Center</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Grade/Class"
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={player.grade}
                      onChange={(e) => updatePlayer(index, 'grade', e.target.value)}
                    />
                    {players.length > 8 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors"
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
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Updating Players...' : 'Update Players'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors font-semibold"
              >
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{team.team_name} - Players ({team.players?.length || 0})</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
          </div>

          <div className="space-y-4">
            {team.players && team.players.length > 0 ? (
              <div className="grid gap-4">
                {team.players.map((player, index) => (
                  <div key={player.id || index} className="bg-gray-50 p-4 rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Name:</span>
                        <p className="text-gray-900">{player.player_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Age:</span>
                        <p className="text-gray-900">{player.age}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Position:</span>
                        <p className="text-gray-900">
                          {player.position === 'PG' ? 'Point Guard' :
                           player.position === 'SG' ? 'Shooting Guard' :
                           player.position === 'SF' ? 'Small Forward' :
                           player.position === 'PF' ? 'Power Forward' :
                           player.position === 'C' ? 'Center' : player.position}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Grade:</span>
                        <p className="text-gray-900">{player.grade || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No players added yet</h4>
                <p className="text-gray-500 mb-4">Edit the team to add players.</p>
                <button
                  onClick={() => {
                    onClose();
                    handleEditTeam(team);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add Players
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            {team.players && team.players.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  handleEditTeam(team);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4 inline mr-1" />
                Edit Players
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
              <p className="text-gray-600">Manage your teams and enrollments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Available Events
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1" />
              My Enrollments ({enrolledTeams.length})
            </button>
          </nav>
        </div>

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Available Events</h2>
                <p className="text-sm text-gray-500 mt-1">Find and enroll in basketball events</p>
              </div>
              <div className="p-6">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events available</h3>
                    <p className="text-gray-500">Check back later for upcoming events.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                      <div key={event.id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isUpcoming(event.date) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {event.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            Max Teams: {event.max_teams}
                          </div>
                          {event.entry_fee && (
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Entry Fee: ${event.entry_fee}
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEnrollClick(event)}
                            disabled={!isUpcoming(event.date)}
                            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Enroll Team
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">My Team Enrollments</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your enrolled teams and players</p>
              </div>
              <div className="p-6">
                {enrolledTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments yet</h3>
                    <p className="text-gray-500 mb-4">Start by enrolling a team in an available event.</p>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {enrolledTeams.map((team) => (
                      <div key={team.id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isUpcoming(team.event_details?.date) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isUpcoming(team.event_details?.date) ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Trophy className="w-4 h-4 mr-2" />
                            {team.event_details?.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(team.event_details?.date)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {team.event_details?.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            {team.players?.length || 0} players
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Gender:</span> {team.gender}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Coach:</span> {team.coach_name}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPlayers(team)}
                            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View Players
                          </button>
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            <Edit className="w-4 h-4 inline mr-1" />
                            Edit Players
                          </button>
                          <button
                            onClick={() => handleDeleteEnrollment(team.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                    <p className="text-2xl font-semibold text-gray-900">{enrolledTeams.length}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">
                      {enrolledTeams.reduce((total, team) => total + (team.players?.length || 0), 0)}
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
                    <p className="text-2xl font-semibold text-gray-900">
                      {enrolledTeams.filter(team => isUpcoming(team.event_details?.date)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showEnrollForm && selectedEvent && (
          <EnrollmentForm 
            event={selectedEvent} 
            onClose={() => {
              setShowEnrollForm(false);
              setSelectedEvent(null);
            }} 
          />
        )}

        {showTeamForm && editingTeam && (
          <TeamForm 
            team={editingTeam} 
            onClose={() => {
              setShowTeamForm(false);
              setEditingTeam(null);
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