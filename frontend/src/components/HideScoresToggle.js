"use client"
import React, { useState } from 'react';

const games = [
  { id: 1, teams: 'TAC vs KTG', score: '89 - 76', time: 'FINAL', date: 'Wed, Apr 16' },
  { id: 2, teams: 'TIC vs GGC', score: '78 - 80', time: '4:45 PM NPT (SATURDAY)', date: 'Final' },
  { id: 3, teams: 'BR vs TAC', score: 'TBD', time: '7:15 PM NPT (SATURDAY)', date: 'Fri, Apr 18' },
  { id: 4, teams: 'GGC vs NPC', score: 'TBD', time: '9:45 PM NPT (SATURDAY)', date: 'Fri, Apr 18' },
];



export default function HideScoresToggle() {
  const [hideScores, setHideScores] = useState(false);
  const [hoveredGameId, setHoveredGameId] = useState(null);

  const toggleScores = () => {
    setHideScores(!hideScores);
  };

  return (
    <div className="bg-white-200 border-1 border-neutral-200 border-e-neutral-50 px-8 pb-0 py-4 flex items-center flex-row shadow-lg ">
      <div className="flex flex-col justify-start mx-4 ">
        <button className="px-3 py-1 rounded bg-gray-100 text-sm font-medium">Wed, 27 Apr</button>
        
        {/* Toggle Switch */}
        <label className="flex items-center pt-4 space-x-2 cursor-pointer">
          <span className="text-sm font-medium">Hide Scores</span>
          <div className="relative">
            <input
              type="checkbox" 
              checked={hideScores}
              onChange={toggleScores}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition ${hideScores ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${hideScores ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </label>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {games.map((game) => (
            <div
              key={game.id}
              className={`min-w-[220px] p-4 border-2 border-neutral-200 bg-white rounded-lg hover:bg-neutral-100 relative transition ${hideScores ? 'text-black' : ''}`}
              onMouseEnter={() => setHoveredGameId(game.id)}
              onMouseLeave={() => setHoveredGameId(null)}
            >
              <div className="text-lg font-semibold relative">
                <p className="relative text-xs px-2 text-gray-500 font-medium uppercase">{game.time}</p>
                <p className="text-sm px-2 font-bold">{game.teams}</p>
                {!hideScores ? (
                  hoveredGameId === game.id ? (
                    <div className="absolute top-0 left-0 pt-2 bg-neutral-100 text-blue-600 w-full h-full text-xs p-0 space-y-1 ">
                      <button className="block w-full text-center hover:underline text-xs">WATCH</button>
                      <button className="block w-full text-center hover:underline text-xs">BOX SCORE</button>
                      <button className="block w-full text-center hover:underline text-xs">GAME DETAILS</button>
                    </div>
                  ) : (
                    <span className="block px-0 m-2 mb-0 text-s">{game.score}</span>
                  )
                ) : (
                  <span className="relative p-2 italic text-sm block ">Score Hidden</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <a href="Schedule" className="px-8 text-blue-600 font-semibold text-sm hover:underline">SEE ALL GAMES</a>
    </div>
  );
}