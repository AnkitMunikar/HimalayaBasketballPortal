import React from 'react';
import { UserPlus, Edit } from 'lucide-react';

const PlayersModal = ({ team, onClose, onEditTeam }) => {
  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            {team.team_name} - Players ({team.players?.length || 0})
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        {/* Players Section */}
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
                  onEditTeam(team);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Add Players
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          {team.players && team.players.length > 0 && (
            <button
              onClick={() => {
                onClose();
                onEditTeam(team);
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

export default PlayersModal;
