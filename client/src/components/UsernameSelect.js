// client/src/components/UsernameSelect.js
import React, { useState } from 'react';
import { socketService } from '../services/socketService';

export const UsernameSelect = ({ onUsernamePicked }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    socketService.setUsername(username);
    onUsernamePicked(username);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-sky-300" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-green-600 transform -skew-y-6 translate-y-24" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-green-500 transform skew-y-6" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-green-400" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white/90 p-8 rounded-xl shadow-xl w-96">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
                         bg-clip-text text-transparent">
            Stone · Sheets · Sheers
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg text-lg"
              placeholder="Enter your username"
              maxLength={20}
            />
            <button 
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold
                       hover:bg-blue-600 transition-colors"
            >
              Play Game
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
