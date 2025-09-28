import React, { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Trophy, MapPin, DollarSign, Edit, Eye, UserPlus, Trash2 } from 'lucide-react';

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

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  });

  const apiFetch = async (url, options = {}) => {
    try {
      setLoading(true);
      const response = await fetch(url, { ...options, headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      // Handle nested array (e.g., { events: [] }) or direct array
      return Array.isArray(data) ? data : data.events || [];
    } catch (err) {
      console.error(`Fetch error for ${url}:`, err);
      setError('Failed to load data. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = () => apiFetch(`${API_BASE}/coach/events/`).then(setEvents);
  const fetchEnrolledTeams = () => apiFetch(`${API_BASE}/enroll/teams/`).then(setEnrolledTeams);

  useEffect(() => {
    fetchEvents();
    fetchEnrolledTeams();
  }, []);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const isUpcoming = (dateString) => new Date(dateString) >= new Date();

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

  const handleDeleteEnrollment = async (teamId) => {
    if (!window.confirm('Delete this enrollment? This cannot be undone.')) return;
    try {
      const response = await fetch(`${API_BASE}/enroll/teams/${teamId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        alert('Enrollment deleted!');
        fetchEnrolledTeams();
      } else {
        alert('Failed to delete enrollment.');
      }
    } catch (err) {
      alert('Network error. Try again.');
      console.error('Delete error:', err);
    }
  };

  const EnrollmentForm = ({ event, onClose }) => {
    const [formData, setFormData] = useState({
      team_name: '',
      coach_name: '',
      gender: 'Boys',
      contact_number: '',
      email: '',
    });
    const [players, setPlayers] = useState(
      Array(8).fill().map(() => ({ player_name: '', age: '', position: 'PG', grade: '' }))
    );
    const [loading, setLoading] = useState(false);

    const addPlayer = () => players.length < 15 && setPlayers([...players, { player_name: '', age: '', position: 'PG', grade: '' }]);
    const removePlayer = (index) => players.length > 8 && setPlayers(players.filter((_, i) => i !== index));
    const updatePlayer = (index, field, value) =>
      setPlayers(players.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/enroll/teams/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...formData, event: event.id, players: players.filter((p) => p.player_name.trim()) }),
        });
        if (response.ok) {
          alert('Team enrolled!');
          onClose();
          fetchEnrolledTeams();
        } else {
          alert(`Enrollment failed: ${await response.text()}`);
        }
      } catch (err) {
        alert('Network error. Try again.');
        console.error('Enrollment error:', err);
      }
      setLoading(false);
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Team Name"
                className="p-3 border rounded-md"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Coach Name"
                className="p-3 border rounded-md"
                value={formData.coach_name}
                onChange={(e) => setFormData({ ...formData, coach_name: e.target.value })}
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
              <input
                type="tel"
                placeholder="Contact Number"
                className="p-3 border rounded-md"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="p-3 border rounded-md md:col-span-2"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
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
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-md bg-gray-50">
                    <input
                      type="text"
                      placeholder="Player Name"
                      className="p-2 border rounded-md"
                      value={player.player_name}
                      onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Age"
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
                    <input
                      type="text"
                      placeholder="Grade/Class"
                      className="p-2 border rounded-md"
                      value={player.grade}
                      onChange={(e) => updatePlayer(index, 'grade', e.target.value)}
                    />
                    {players.length > 8 && (
                      <button onClick={() => removePlayer(index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600">
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
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Enrolling...' : 'Enroll Team'}
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

  const TeamForm = ({ team, onClose }) => {
    const [players, setPlayers] = useState(
      team?.players || Array(8).fill().map(() => ({ player_name: '', age: '', position: 'PG', grade: '' }))
    );
    const [loading, setLoading] = useState(false);

    const addPlayer = () => players.length < 15 && setPlayers([...players, { player_name: '', age: '', position: 'PG', grade: '' }]);
    const removePlayer = (index) => players.length > 8 && setPlayers(players.filter((_, i) => i !== index));
    const updatePlayer = (index, field, value) =>
      setPlayers(players.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

    const handleSubmit = async () => {
      setLoading(true);
      try {
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
            players: players.filter((p) => p.player_name.trim()),
          }),
        });
        if (response.ok) {
          alert('Players updated!');
          onClose();
          fetchEnrolledTeams();
        } else {
          alert(`Update failed: ${await response.text()}`);
        }
      } catch (err) {
        alert('Network error. Try again.');
        console.error('Update error:', err);
      }
      setLoading(false);
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
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-md bg-gray-50">
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
                    <input
                      type="text"
                      placeholder="Grade/Class"
                      className="p-2 border rounded-md"
                      value={player.grade}
                      onChange={(e) => updatePlayer(index, 'grade', e.target.value)}
                    />
                    {players.length > 8 && (
                      <button onClick={() => removePlayer(index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600">
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
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Players'}
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <div>
                        <span className="font-medium text-gray-600 block">Grade:</span>
                        <p>{player.grade || 'Not specified'}</p>
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
              {loading ? (
                <p className="text-center py-12 text-gray-600">Loading...</p>
              ) : error ? (
                <p className="text-center py-12 text-red-600">{error}</p>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events available</h3>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            isUpcoming(event.date) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.details?.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Max Teams: {event.max_teams}
                        </div>
                        {event.entry_fee && (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Entry Fee: ${event.entry_fee}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEnrollClick(event)}
                        disabled={!isUpcoming(event.date)}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Enroll Team
                      </button>
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
                  <p className="text-center py-12 text-red-600">{error}</p>
                ) : enrolledTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No enrollments</h3>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {enrolledTeams.map((team) => (
                      <div key={team.id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md">
                        <div className="flex justify-between mb-4">
                          <h3 className="text-lg font-semibold">{team.team_name}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              isUpcoming(team.event_details?.date) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {isUpcoming(team.event_details?.date) ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                          {/* <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-2" />
                            {team.event.details?.description}
                          </div> */}
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(team.event_details?.date)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            
                            {team.event_details?.name}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            {team.players?.length || 0} players
                          </div>
                          <div>
                            <span className="font-medium">Gender:</span> {team.gender}
                          </div>
                          <div>
                            <span className="font-medium">Coach:</span> {team.coach_name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPlayers(team)}
                            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 text-sm"
                          >
                            <Edit className="w-4 h-4 inline mr-1" />
                            Edit
                          </button>
                          {/* <button
                            onClick={() => handleDeleteEnrollment(team.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm"
                          >
                            {/* <Trash2 className="w-4 h-4" /> */}
                          {/* </button> */}
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
                    <p className="text-2xl font-semibold">{enrolledTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}</p>
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