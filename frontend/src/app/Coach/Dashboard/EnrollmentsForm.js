import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const EnrollmentForm = ({ event, onClose, fetchEnrolledTeams, fetchMyTeams, getAuthHeaders }) => {
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

      const response = await fetch(`http://localhost:8000/api/enroll/teams/`, {
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

export default EnrollmentForm;