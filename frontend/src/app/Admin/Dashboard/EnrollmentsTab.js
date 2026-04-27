'use client';
import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Edit, Plus } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const EnrollmentsTab = ({ onUpdate }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/enroll/teams/`, {
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
      setEnrollments(sorted);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      alert('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleDelete = async (enrollmentId) => {
    if (!confirm('Delete this enrollment? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/enroll/teams/${enrollmentId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        alert('Enrollment deleted!');
        fetchEnrollments();
        onUpdate?.();
      } else {
        alert('Failed to delete enrollment');
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      alert('Error deleting enrollment');
    }
  };

  const handleEdit = (enrollment) => {
    setEditingEnrollment(enrollment);
    // Normalize dob for date input (API may return "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ssZ")
    const normalizeDob = (dob) => {
      if (!dob) return '';
      if (typeof dob === 'string') return dob.split('T')[0];
      return dob;
    };
    setEditFormData({
      team_name: enrollment.team_name || '',
      gender: enrollment.gender || '',
      coach_name: enrollment.coach_name || '',
      contact_number: enrollment.contact_number || '',
      email: enrollment.email || '',
      players: (enrollment.players || []).map(p => ({
        ...p,
        id: p.id,
        player_name: p.player_name || '',
        position: p.position || 'PG',
        dob: normalizeDob(p.dob),
        jersey_no: p.jersey_no !== undefined && p.jersey_no !== null ? String(p.jersey_no) : '',
        player_photo: null,
        id_proof: null,
        player_photo_url: p.player_photo_url || null,
        id_proof_url: p.id_proof_url || null,
      })),
    });
  };

  const updatePlayer = (index, field, value) => {
    setEditFormData({
      ...editFormData,
      players: editFormData.players.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    });
  };

  const handleFileChange = (index, field, file) => {
    setEditFormData({
      ...editFormData,
      players: editFormData.players.map((p, i) => 
        i === index ? { ...p, [field]: file } : p
      ),
    });
  };

  const addPlayer = () => {
    if (editFormData.players.length < 15) {
      setEditFormData({
        ...editFormData,
        players: [...editFormData.players, { 
          player_name: '', 
          position: 'PG',
          dob: '',
          jersey_no: '',
          player_photo: null,
          id_proof: null
        }],
      });
    }
  };

  const removePlayer = (index) => {
    if (editFormData.players.length > 8) {
      setEditFormData({
        ...editFormData,
        players: editFormData.players.filter((_, i) => i !== index),
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      // Filter and validate players - ensure names are trimmed and not empty
      const validPlayers = (editFormData.players || [])
        .map((p) => {
          const normalizedName = (p.player_name || '').toString().trim();
          return {
            ...p,
            player_name: normalizedName,
          };
        })
        .filter((p) => {
          const hasName = p.player_name && p.player_name.length > 0;
          const hasDob = p.dob && (p.dob.trim ? p.dob.trim().length > 0 : true);
          return hasName && hasDob;
        });
      
      if (validPlayers.length < 8) {
        alert('At least 8 players with name and date of birth are required');
        setEditLoading(false);
        return;
      }

      // Check if any player has files to upload
      const hasFiles = validPlayers.some(p => p.player_photo instanceof File || p.id_proof instanceof File);

      // Step 1: Update players data first (using JSON)
      const requestPayload = {
        team_name: editFormData.team_name,
        gender: editFormData.gender,
        coach_name: editFormData.coach_name,
        contact_number: editFormData.contact_number || '',
        email: editFormData.email || '',
        event: editingEnrollment.event,
        players: validPlayers
          .filter((player) => player.player_name?.trim())
          .map((player) => ({
            id: player.id || undefined,
            player_name: player.player_name.trim(),
            position: player.position || 'PG',
            dob: player.dob || null,
            jersey_no: player.jersey_no ? parseInt(player.jersey_no, 10) : null,
          }))
      };

      let response = await fetch(`${API_BASE}/enroll/teams/${editingEnrollment.id}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestPayload),
      });

      let responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Parse error:', responseText.substring(0, 500));
        responseData = { error: responseText.substring(0, 100) || 'Invalid response' };
      }

      if (!response.ok) {
        let errorMsg = 'Update failed';
        if (responseData.detail) {
          errorMsg = responseData.detail;
        } else if (responseData.error) {
          errorMsg = responseData.error;
        } else if (responseData.players) {
          if (Array.isArray(responseData.players)) {
            errorMsg = `Players: ${responseData.players[0]?.detail || responseData.players[0]}`;
          } else if (typeof responseData.players === 'string') {
            errorMsg = `Players: ${responseData.players}`;
          }
        }
        alert(`Failed to update team: ${errorMsg}`);
        setEditLoading(false);
        return;
      }

      // Step 2: Upload files separately if any player has files
      if (hasFiles && responseData.players && Array.isArray(responseData.players)) {
        const token = localStorage.getItem('access_token');
        let filesUploaded = 0;
        let filesFailed = 0;

        for (let i = 0; i < validPlayers.length && i < responseData.players.length; i++) {
          const player = validPlayers[i];
          const updatedPlayer = responseData.players[i];
          
          if (!updatedPlayer || !updatedPlayer.id) {
            continue;
          }

          const hasPhoto = player.player_photo instanceof File;
          const hasIdProof = player.id_proof instanceof File;

          if (hasPhoto || hasIdProof) {
            const playerFormData = new FormData();
            
            if (hasPhoto) {
              playerFormData.append('player_photo', player.player_photo);
            }
            if (hasIdProof) {
              playerFormData.append('id_proof', player.id_proof);
            }

            try {
              const fileResponse = await fetch(`${API_BASE}/enroll/players/${updatedPlayer.id}/files/`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token || ''}`,
                },
                body: playerFormData,
              });

              if (fileResponse.ok) {
                filesUploaded++;
              } else {
                filesFailed++;
              }
            } catch (fileError) {
              filesFailed++;
              console.error(`Error uploading files for player ${updatedPlayer.id}:`, fileError);
            }
          }
        }
      }

      if (response.ok) {
        alert('Team updated successfully!');
        setEditingEnrollment(null);
        fetchEnrollments();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error updating team:', error);
      alert(`Error updating team: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading enrollments...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 font-fjalla-one">Enrollments Management</h2>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Players</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No enrollments found</td>
              </tr>
            ) : (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{enrollment.team_name}</div>
                    <div className="text-sm text-gray-500">{enrollment.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.coach_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.event_details?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.players?.length || 0} players
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(enrollment.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEnrollment(enrollment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(enrollment)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Team"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(enrollment.id)}
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

      {/* Enrollment Details Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-fjalla-one">{selectedEnrollment.team_name}</h3>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Team Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><strong>Coach:</strong> {selectedEnrollment.coach_name}</p>
                  <p><strong>Gender:</strong> {selectedEnrollment.gender}</p>
                  <p><strong>Email:</strong> {selectedEnrollment.email}</p>
                  <p><strong>Contact:</strong> {selectedEnrollment.contact_number || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Event</h4>
                <p className="text-sm">{selectedEnrollment.event_details?.name || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Players ({selectedEnrollment.players?.length || 0})</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Age</th>
                        <th className="px-3 py-2 text-left">Position</th>
                        <th className="px-3 py-2 text-left">Jersey</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedEnrollment.players?.map((player, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">{player.player_name}</td>
                          <td className="px-3 py-2">{player.age}</td>
                          <td className="px-3 py-2">{player.position}</td>
                          <td className="px-3 py-2">{player.jersey_no || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingEnrollment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-fjalla-one">Edit Team - {editingEnrollment.team_name}</h3>
              <button
                onClick={() => setEditingEnrollment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Team Information */}
              <div className="bg-gray-50 p-4 rounded-md border">
                <h4 className="font-semibold mb-3 text-lg">Team Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={editFormData.team_name}
                      onChange={(e) => setEditFormData({ ...editFormData, team_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={editFormData.gender || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Boys">Boys</option>
                        <option value="Girls">Girls</option>
                        <option value="Boys and Girls">Boys and Girls</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coach Name</label>
                      <input
                        type="text"
                        value={editFormData.coach_name}
                        onChange={(e) => setEditFormData({ ...editFormData, coach_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={editFormData.contact_number}
                        onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Players Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Players ({editFormData.players?.length || 0}/15)</h4>
                  <button
                    type="button"
                    onClick={addPlayer}
                    disabled={(editFormData.players?.length || 0) >= 15}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Player
                  </button>
                </div>
                <div className="grid gap-4">
                  {(editFormData.players || []).map((player, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 rounded-md bg-gray-50">
                      <h5 className="font-medium mb-3 text-gray-700">Player {index + 1}</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            placeholder="Player Name"
                            className="w-full p-2 border rounded-md"
                            value={player.player_name || ''}
                            onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Date of Birth <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={player.dob || ''}
                            onChange={(e) => updatePlayer(index, 'dob', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Jersey</label>
                          <input
                            type="number"
                            placeholder="Jersey"
                            min="1"
                            max="99"
                            className="w-full p-2 border rounded-md"
                            value={player.jersey_no || ''}
                            onChange={(e) => updatePlayer(index, 'jersey_no', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={player.position || 'PG'}
                          onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                        >
                          <option value="PG">Point Guard</option>
                          <option value="SG">Shooting Guard</option>
                          <option value="SF">Small Forward</option>
                          <option value="PF">Power Forward</option>
                          <option value="C">Center</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Player Photo (JPG/PNG, max 5MB) <span className="text-gray-500 text-xs">(Optional)</span>
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            className="w-full p-2 border rounded-md text-sm"
                            onChange={(e) => handleFileChange(index, 'player_photo', e.target.files?.[0] || null)}
                          />
                          {(player.player_photo instanceof File || player.player_photo_url) && (
                            <div className="mt-2">
                              {player.player_photo instanceof File ? (
                                <p className="text-sm text-green-600">
                                  ✓ New file: {player.player_photo.name}
                                </p>
                              ) : player.player_photo_url ? (
                                <div className="flex items-center space-x-2">
                                  <img 
                                    src={player.player_photo_url} 
                                    alt="Player photo" 
                                    className="w-12 h-12 rounded object-cover border"
                                  />
                                  <a 
                                    href={player.player_photo_url} 
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
                            onChange={(e) => handleFileChange(index, 'id_proof', e.target.files?.[0] || null)}
                          />
                          {(player.id_proof instanceof File || player.id_proof_url) && (
                            <div className="mt-2">
                              {player.id_proof instanceof File ? (
                                <p className="text-sm text-green-600">
                                  ✓ New file: {player.id_proof.name}
                                </p>
                              ) : player.id_proof_url ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">📄</span>
                                  <a 
                                    href={player.id_proof_url} 
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

                      {(editFormData.players?.length || 0) > 8 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(index)}
                          className="mt-3 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 w-full flex items-center justify-center gap-2"
                        >
                          <span>🗑️</span> Remove Player
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEnrollment(null)}
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
                  {editLoading ? 'Updating...' : 'Update Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsTab;
