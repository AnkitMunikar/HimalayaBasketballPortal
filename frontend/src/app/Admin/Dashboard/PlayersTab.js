'use client';
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const PlayersTab = ({ onUpdate }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/enroll/admin/players/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Sort by created_at (newest first) as fallback
      const sorted = Array.isArray(data) ? data.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Newest first
      }) : data;
      setPlayers(sorted);
    } catch (error) {
      console.error('Error fetching players:', error);
      alert('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleDelete = async (playerId) => {
    if (!confirm('Delete this player? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/enroll/admin/players/${playerId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        alert('Player deleted!');
        fetchPlayers();
        onUpdate?.();
      } else {
        alert('Failed to delete player');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error deleting player');
    }
  };

  const normalizeDob = (dob) => {
    if (!dob) return '';
    if (typeof dob === 'string') return dob.split('T')[0];
    try {
      return new Date(dob).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setEditFormData({
      player_name: player.player_name || '',
      dob: normalizeDob(player.dob),
      position: player.position || 'PG',
      jersey_no: player.jersey_no !== undefined && player.jersey_no !== null ? String(player.jersey_no) : '',
      player_photo_url: player.player_photo_url || null,
      id_proof_url: player.id_proof_url || null,
      player_photo: null,
      id_proof: null,
    });
  };

  const handlePlayerFileChange = (field, file) => {
    setEditFormData((prev) => ({ ...prev, [field]: file || null }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const payload = {
        player_name: (editFormData.player_name || '').trim(),
        dob: editFormData.dob || null,
        position: editFormData.position || 'PG',
        jersey_no: editFormData.jersey_no !== '' && editFormData.jersey_no !== undefined
          ? parseInt(editFormData.jersey_no, 10)
          : null,
      };
      const res = await fetch(`${API_BASE}/enroll/admin/players/${editingPlayer.id}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to update player: ${JSON.stringify(error)}`);
        setEditLoading(false);
        return;
      }
      const hasPhoto = editFormData.player_photo instanceof File;
      const hasIdProof = editFormData.id_proof instanceof File;
      if (hasPhoto || hasIdProof) {
        const formData = new FormData();
        if (hasPhoto) formData.append('player_photo', editFormData.player_photo);
        if (hasIdProof) formData.append('id_proof', editFormData.id_proof);
        const token = localStorage.getItem('access_token');
        const fileRes = await fetch(`${API_BASE}/enroll/players/${editingPlayer.id}/files/`, {
          method: 'PATCH',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!fileRes.ok) {
          const fileErr = await fileRes.json().catch(() => ({}));
          alert(`Player details updated but file upload failed: ${fileErr.error || fileRes.statusText}`);
        }
      }
      alert('Player updated successfully!');
      setEditingPlayer(null);
      fetchPlayers();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading players...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 font-fjalla-one">Players Management</h2>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No players found</td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {player.player_photo_url && !imageErrors[player.id] ? (
                        <img
                          src={player.player_photo_url}
                          alt={player.player_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onError={() => {
                            setImageErrors(prev => ({ ...prev, [player.id]: true }));
                          }}
                          onClick={() => setSelectedPlayer(player)}
                          title="Click to view details"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                          title={player.player_name}
                        >
                          {player.player_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.player_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.age}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.team_name || player.teamenroll?.team_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(player)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Player"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(player.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                {selectedPlayer.player_photo_url && !imageErrors[selectedPlayer.id] ? (
                  <img
                    src={selectedPlayer.player_photo_url}
                    alt={selectedPlayer.player_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                    onError={() => {
                      setImageErrors(prev => ({ ...prev, [selectedPlayer.id]: true }));
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                    {selectedPlayer.player_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 font-fjalla-one">{selectedPlayer.player_name}</h3>
                  <p className="text-sm text-gray-500">{selectedPlayer.team_name || selectedPlayer.teamenroll?.team_name || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                <p className="text-lg font-semibold text-gray-900">{selectedPlayer.age}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Position</p>
                <p className="text-lg font-semibold text-gray-900">{selectedPlayer.position}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Jersey Number</p>
                <p className="text-lg font-semibold text-gray-900">{selectedPlayer.jersey_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                <p className="text-lg font-semibold text-gray-900">{selectedPlayer.dob || 'N/A'}</p>
              </div>
            </div>
            {selectedPlayer.player_photo_url && !imageErrors[selectedPlayer.id] && (
              <div className="mt-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Full Photo</p>
                <img 
                  src={selectedPlayer.player_photo_url} 
                  alt={selectedPlayer.player_name} 
                  className="w-full max-w-md rounded-lg shadow-md border border-gray-200" 
                />
              </div>
            )}
            {selectedPlayer.id_proof_url && (
              <div className="mt-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">ID Proof</p>
                <a 
                  href={selectedPlayer.id_proof_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Document
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-fjalla-one">Edit Player</h3>
              <button
                onClick={() => setEditingPlayer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                <input
                  type="text"
                  value={editFormData.player_name}
                  onChange={(e) => setEditFormData({ ...editFormData, player_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={editFormData.position || 'PG'}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PG">Point Guard</option>
                    <option value="SG">Shooting Guard</option>
                    <option value="SF">Small Forward</option>
                    <option value="PF">Power Forward</option>
                    <option value="C">Center</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                <input
                  type="number"
                  value={editFormData.jersey_no ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, jersey_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="99"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player Photo (JPG/PNG, max 5MB) <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="w-full p-2 border rounded-md text-sm"
                    onChange={(e) => handlePlayerFileChange('player_photo', e.target.files?.[0] || null)}
                  />
                  {(editFormData.player_photo instanceof File || editFormData.player_photo_url) && (
                    <div className="mt-2">
                      {editFormData.player_photo instanceof File ? (
                        <p className="text-sm text-green-600">✓ New file: {editFormData.player_photo.name}</p>
                      ) : editFormData.player_photo_url ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <img
                            src={editFormData.player_photo_url}
                            alt="Current"
                            className="w-12 h-12 rounded object-cover border"
                          />
                          <a
                            href={editFormData.player_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View current photo
                          </a>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Document (PDF, max 10MB) <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="w-full p-2 border rounded-md text-sm"
                    onChange={(e) => handlePlayerFileChange('id_proof', e.target.files?.[0] || null)}
                  />
                  {(editFormData.id_proof instanceof File || editFormData.id_proof_url) && (
                    <div className="mt-2">
                      {editFormData.id_proof instanceof File ? (
                        <p className="text-sm text-green-600">✓ New file: {editFormData.id_proof.name}</p>
                      ) : editFormData.id_proof_url ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm text-gray-600">📄</span>
                          <a
                            href={editFormData.id_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View current document
                          </a>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={editLoading}
                >
                  {editLoading ? 'Updating...' : 'Update Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersTab;
