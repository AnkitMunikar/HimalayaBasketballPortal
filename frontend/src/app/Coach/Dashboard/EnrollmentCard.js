import React from 'react';
import { Trophy, Calendar, MapPin, Eye, Edit, Trash2 } from 'lucide-react';

const EnrollmentCard = ({ team, formatDate, onViewPlayers, onEditTeam, onDeleteEnrollment }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
          {team.gender}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <Trophy className="w-4 h-4 mr-2" />
          {team.event_details?.name || "Event"}
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {team.event_details?.date ? formatDate(team.event_details.date) : "Date TBD"}
        </div>
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {team.event_details?.location || "Location TBD"}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewPlayers(team)}
          className="flex-1 bg-indigo-500 text-white px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm"
        >
          <Eye className="w-4 h-4 inline mr-1" />
          View Players
        </button>
        <button
          onClick={() => onEditTeam(team)}
          className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
        >
          <Edit className="w-4 h-4 inline mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDeleteEnrollment(team.id)}
          className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4 inline mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default EnrollmentCard;