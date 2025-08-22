import React from 'react';
import { Calendar, Trophy } from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab, enrolledTeamsCount }) => {
  return (
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
          My Enrollments ({enrolledTeamsCount})
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;