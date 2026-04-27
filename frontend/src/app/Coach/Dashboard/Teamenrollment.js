// frontend/src/app/Coach/Dashboard/Teamenrollment.js - FIXED
import React, { useState } from 'react';
import { Eye, Edit, Users, Calendar, Trophy, MapPin, Plus, Trash2, ChevronDown, ChevronUp, Award, FileText, Image as ImageIcon } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const TeamEnrollments = ({ enrolledTeams, loading, error, onEnrollmentUpdated }) => {
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',  // ✅ JSON, not multipart
    };
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

  const handleViewPlayers = (team) => {
    setSelectedTeam(team);
    setShowPlayersModal(true);
  };

  const toggleTeamDetail = (teamId, e) => {
    if (e) e.stopPropagation();
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowTeamForm(true);
  };

  // ============= TEAM EDIT FORM COMPONENT =============
  const TeamEditForm = ({ team, onClose }) => {
    const [players, setPlayers] = useState(team?.players || []);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const addPlayer = () => {
      if (players.length < 15) {
        setPlayers([...players, { 
          player_name: '', 
          position: 'PG',
          dob: '',
          jersey_no: '',
          player_photo: null,
          id_proof: null
        }]);
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

    const handleFileChange = (index, field, file) => {
      setPlayers(players.map((p, i) => 
        i === index ? { ...p, [field]: file } : p
      ));
    };

    const handleSubmit = async () => {
      setFormLoading(true);
      setFormError('');
      setFormSuccess('');

      try {
        // Filter and validate players - ensure names are trimmed and not empty
        const validPlayers = players
          .map((p) => {
            // Normalize player_name - handle null, undefined, or empty strings
            const normalizedName = (p.player_name || '').toString().trim();
            return {
              ...p,
              player_name: normalizedName,
            };
          })
          .filter((p) => {
            // Only include players with both non-empty name and DOB
            const hasName = p.player_name && p.player_name.length > 0;
            const hasDob = p.dob && p.dob.trim && p.dob.trim().length > 0 || p.dob; // DOB can be a date string or Date object
            return hasName && hasDob;
          });
        
        if (validPlayers.length < 8) {
          setFormError('At least 8 players with name and date of birth are required');
          setFormLoading(false);
          return;
        }
        
        console.log(`📊 Valid players: ${validPlayers.length} out of ${players.length}`);
        
        // Debug: Log player names to verify they're not empty
        validPlayers.forEach((p, idx) => {
          if (!p.player_name || p.player_name.trim().length === 0) {
            console.error(`❌ Player ${idx} has empty name:`, p);
          }
        });

        console.log('📤 Updating team...');

        // Check if any player has files to upload
        const hasFiles = validPlayers.some(p => p.player_photo instanceof File || p.id_proof instanceof File);

        // Step 1: Always update players data first (using JSON - more reliable)
        const requestPayload = {
          team_name: team.team_name,
          gender: team.gender,
          coach_name: team.coach_name,
          contact_number: team.contact_number || '',
          email: team.email || '',
          event: team.event,
          players: validPlayers
            .filter((player) => player.player_name?.trim()) // Double-check: only include players with names
            .map((player) => ({
              id: player.id || null, // Send id so backend can update in place and preserve photos
              player_name: player.player_name.trim(), // Use trimmed name
              position: player.position || 'PG',
              dob: player.dob || null,
              jersey_no: player.jersey_no ? parseInt(player.jersey_no) : null,
            }))
        };

        console.log('📤 Step 1: Updating players data (JSON)...');
        console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

        let response = await fetch(`${API_BASE}/enroll/teams/${team.id}/`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(requestPayload),
        });

        // Read response
        let responseText = await response.text();
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('❌ Parse error:', responseText.substring(0, 500));
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
          setFormError(errorMsg);
          setFormLoading(false);
          return;
        }

        console.log('✅ Step 1 complete: Players data updated successfully');

        // Step 2: Upload files separately if any player has files
        if (hasFiles && responseData.players && Array.isArray(responseData.players)) {
          console.log('📤 Step 2: Uploading files for players...');
          
          const token = localStorage.getItem('access_token');
          let filesUploaded = 0;
          let filesFailed = 0;

          // Upload files for each player that has them
          for (let i = 0; i < validPlayers.length && i < responseData.players.length; i++) {
            const player = validPlayers[i];
            const updatedPlayer = responseData.players[i];
            
            if (!updatedPlayer || !updatedPlayer.id) {
              console.warn(`⚠️ Player ${i} not found in response, skipping file upload`);
              continue;
            }

            const hasPhoto = player.player_photo instanceof File;
            const hasIdProof = player.id_proof instanceof File;

            if (hasPhoto || hasIdProof) {
              const playerFormData = new FormData();
              
              if (hasPhoto) {
                playerFormData.append('player_photo', player.player_photo);
                console.log(`  📎 Uploading photo for player ${updatedPlayer.id}: ${player.player_photo.name}`);
              }
              if (hasIdProof) {
                playerFormData.append('id_proof', player.id_proof);
                console.log(`  📎 Uploading ID proof for player ${updatedPlayer.id}: ${player.id_proof.name}`);
              }

              try {
                // Use the coach-accessible endpoint (similar to event management dashboard)
                const fileResponse = await fetch(`${API_BASE}/enroll/players/${updatedPlayer.id}/files/`, {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${token || ''}`,
                    // Don't set Content-Type - browser will set it with boundary for FormData
                  },
                  body: playerFormData,
                });

                if (fileResponse.ok) {
                  filesUploaded++;
                  const fileResponseData = await fileResponse.json().catch(() => ({}));
                  console.log(`  ✅ Files uploaded for player ${updatedPlayer.id}:`, fileResponseData);
                } else {
                  filesFailed++;
                  const errorText = await fileResponse.text().catch(() => 'Unknown error');
                  let errorData;
                  try {
                    errorData = JSON.parse(errorText);
                  } catch {
                    errorData = { error: errorText };
                  }
                  console.error(`  ❌ Failed to upload files for player ${updatedPlayer.id}:`, errorData);
                }
              } catch (fileError) {
                filesFailed++;
                console.error(`  ❌ Error uploading files for player ${updatedPlayer.id}:`, fileError);
              }
            }
          }

          console.log(`📎 File upload complete: ${filesUploaded} successful, ${filesFailed} failed`);
        } else if (hasFiles) {
          console.warn('⚠️ Files detected but player IDs not available in response - files not uploaded');
        }
        
        // Response handling - responseData is already set from step 1
        console.log('📊 Final response status:', response.status);

        if (response.ok) {
          setFormSuccess('✅ Team updated successfully!');
          setTimeout(() => {
            onClose();
            onEnrollmentUpdated();
          }, 1500);
        } else {
          let errorMsg = 'Update failed';
          
          if (responseData.detail) {
            errorMsg = responseData.detail;
          } else if (responseData.non_field_errors) {
            errorMsg = Array.isArray(responseData.non_field_errors) 
              ? responseData.non_field_errors[0] 
              : responseData.non_field_errors;
          } else if (responseData.players) {
            if (Array.isArray(responseData.players)) {
              errorMsg = `Players: ${responseData.players[0]?.detail || responseData.players[0]}`;
            } else if (typeof responseData.players === 'string') {
              errorMsg = `Players: ${responseData.players}`;
            } else {
              errorMsg = `Players error: ${JSON.stringify(responseData.players)}`;
            }
          } else if (responseData.error) {
            errorMsg = responseData.error;
          } else if (Object.keys(responseData).length > 0) {
            const firstKey = Object.keys(responseData)[0];
            errorMsg = `${firstKey}: ${JSON.stringify(responseData[firstKey])}`;
          }
          
          setFormError(errorMsg);
          console.error('❌ Error response:', responseData);
        }
      } catch (err) {
        console.error('❌ Error:', err);
        setFormError(`Error: ${err.message}`);
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h3 className="text-lg sm:text-xl font-bold font-fjalla-one">Edit Players - {team.team_name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          {formError && (
            <div className="toast-message-right error" role="alert">
              <p className="font-medium text-sm"><strong>❌ Error:</strong> {formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="toast-message-right success" role="status">
              <p className="font-medium text-sm">{formSuccess}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Team Information */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <h4 className="font-semibold mb-3 text-lg">Team Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-gray-600 block">Team Name:</span>
                  <p className="text-gray-800">{team.team_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block">Gender:</span>
                  <p className="text-gray-800">{team.gender}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block">Event:</span>
                  <p className="text-gray-800">{team.event_details?.name}</p>
                </div>
              </div>
            </div>

            {/* Players Section */}
            <div>
              <div className="flex justify-between mb-4">
                <h4 className="text-lg font-semibold">Players ({players.length}/15)</h4>
                <button
                  onClick={addPlayer}
                  disabled={players.length >= 15}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Player
                </button>
              </div>
              <div className="grid gap-4">
                {players.map((player, index) => (
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
                            ) : (
                              <p className="text-sm text-gray-500">✓ Photo uploaded</p>
                            )}
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
                            ) : (
                              <p className="text-sm text-gray-500">✓ Document uploaded</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {players.length > 8 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="mt-3 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 w-full flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Player
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={handleSubmit}
                disabled={formLoading}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 disabled:opacity-50 font-medium"
              >
                {formLoading ? 'Updating...' : 'Update Players'}
              </button>
              <button
                onClick={onClose}
                disabled={formLoading}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============= PLAYERS MODAL COMPONENT =============
  const PlayersModal = ({ team, onClose }) => {
    if (!team) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between mb-6">
            <h3 className="text-xl font-bold font-fjalla-one">
              {team.team_name} - Players ({team.players?.length || 0})
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {team.players?.length ? (
              <div className="grid gap-4">
                {team.players.map((player, index) => (
                  <div key={player.id || index} className="bg-gray-50 p-4 rounded-md border-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="font-medium text-gray-600 block text-sm">Name</span>
                        <p className="text-gray-800 font-semibold">{player.player_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block text-sm">Age</span>
                        <p className="text-gray-800">{player.age}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block text-sm">Position</span>
                        <p className="text-gray-800">
                          {player.position === 'PG' ? 'Point Guard' :
                           player.position === 'SG' ? 'Shooting Guard' :
                           player.position === 'SF' ? 'Small Forward' :
                           player.position === 'PF' ? 'Power Forward' :
                           player.position === 'C' ? 'Center' :
                           player.position}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block text-sm">Jersey No.</span>
                        <p className="text-gray-800">{player.jersey_no || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {player.dob && (
                        <div>
                          <span className="font-medium text-gray-600 block text-sm">DOB</span>
                          <p className="text-gray-800">{player.dob}</p>
                        </div>
                      )}

                      {player.player_photo_url && (
                        <div>
                          <span className="font-medium text-gray-600 block text-sm">Photo</span>
                          <a 
                            href={player.player_photo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            📷 View Photo
                          </a>
                        </div>
                      )}
                      
                      {player.id_proof_url && (
                        <div>
                          <span className="font-medium text-gray-600 block text-sm">Document</span>
                          <a 
                            href={player.id_proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            📄 View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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

          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            {team.players?.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  handleEditTeam(team);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Players
              </button>
            )}
            <button 
              onClick={onClose} 
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Teams List */}
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
              <p className="text-gray-600">Enroll your team in an event to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledTeams.map((team) => {
                const ev = team.event_details || {};
                const isExpanded = expandedTeamId === team.id;
                return (
                  <div
                    key={team.id}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Team card row — click to expand/collapse */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => toggleTeamDetail(team.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTeamDetail(team.id); } }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`${team.team_name}, toggle details`}
                    >
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {team.team_name}
                          </h3>
                          {isUpcoming(ev.date) && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">Coach: {team.coach_name}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{formatDate(ev.date)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Trophy className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
                            <span className="truncate">{ev.name}</span>
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
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {isUpcoming(ev.date) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditTeam(team); }}
                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 text-gray-500" aria-hidden />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-500" aria-hidden />
                        )}
                      </div>
                    </div>

                    {/* Drop: Event hero (picture at side) + team details + players — OrganizerEventDetail style */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {/* Event header — gradient with logo on left */}
                        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-md">
                              {ev.logo_url || ev.logo ? (
                                <img
                                  src={ev.logo_url || ev.logo}
                                  alt={ev.name || 'Event'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Award className="w-14 h-14 md:w-16 md:h-16 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 text-white">
                              <h2 className="text-2xl md:text-3xl font-bold mb-2 font-fjalla-one">{ev.name || 'Event'}</h2>
                              <div className="space-y-1 mb-3">
                                <p className="flex items-center text-blue-100">
                                  <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
                                  {formatDate(ev.date)}
                                </p>
                                <p className="flex items-center text-blue-100">
                                  <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                                  {ev.venue || 'TBD'}, {ev.city || 'TBD'}
                                </p>
                              </div>
                              <span className="inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {team.team_name} • {team.players?.length || 0} Players
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Team info + players */}
                        <div className="p-6 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Coach</p>
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

                          <h4 className="text-lg font-semibold text-gray-900 mb-4 font-fjalla-one">Players ({team.players?.length || 0})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {team.players?.map((player, idx) => (
                              <div key={player.id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start gap-3 mb-3">
                                  {player.player_photo_url ? (
                                    <img
                                      src={player.player_photo_url}
                                      alt={player.player_name}
                                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                                      {player.player_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-gray-900">{player.player_name}</h5>
                                    <p className="text-sm text-gray-600">{player.position}</p>
                                    {player.jersey_no && <p className="text-xs text-gray-500">#{player.jersey_no}</p>}
                                  </div>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Age</span>
                                    <span className="font-medium">{player.age ?? 'N/A'}</span>
                                  </div>
                                  {player.dob && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">DOB</span>
                                      <span className="font-medium">{new Date(player.dob).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                                  {player.player_photo_url && (
                                    <a href={player.player_photo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                      <ImageIcon className="w-3 h-3" /> Photo
                                    </a>
                                  )}
                                  {player.id_proof_url && (
                                    <a href={player.id_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                      <FileText className="w-3 h-3" /> ID Proof
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
              })}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
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

      {/* Modals */}
      {showTeamForm && selectedTeam && (
        <TeamEditForm
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
  );
};

export default TeamEnrollments;