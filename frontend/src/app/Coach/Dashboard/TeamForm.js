import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const TeamForm = ({ team, onClose, fetchEnrolledTeams, getAuthHeaders }) => {
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

      const response = await fetch(`http://localhost:8000/api/enroll/teams/${team.id}/`, {
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

export default TeamForm;