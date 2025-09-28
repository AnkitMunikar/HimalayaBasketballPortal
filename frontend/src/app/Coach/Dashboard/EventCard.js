import React from 'react';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';

const EventCard = ({ event, formatDate, isUpcoming, onEnrollClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
          {isUpcoming(event.date) && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Upcoming
            </span>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-3">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-5 h-5 mr-3 text-blue-500" />
          <span className="font-medium">{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="w-5 h-5 mr-3 text-red-500" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Users className="w-5 h-5 mr-3 text-green-500" />
          <span>Max Teams: {event.max_teams}</span>
        </div>
        {event.entry_fee && (
          <div className="flex items-center text-gray-600">
            <DollarSign className="w-5 h-5 mr-3 text-amber-500" />
            <span className="font-medium">Entry Fee: ${event.entry_fee}</span>
          </div>
        )}
        {event.description && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">{event.description}</p>
          </div>
        )}
        <div className="pt-4">
          {isUpcoming(event.date) ? (
            <button
              onClick={() => onEnrollClick(event)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Enroll Team
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
            >
              Event Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;