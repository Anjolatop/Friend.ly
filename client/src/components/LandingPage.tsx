import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../App';
import { CreateRoomRequest, JoinRoomRequest, Theme } from '../types';

const LandingPage: React.FC = () => {
  const { socket, setRoomState, setCurrentPlayer } = useContext(GameContext)!;
  const navigate = useNavigate();
  
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create room form state
  const [createForm, setCreateForm] = useState<CreateRoomRequest>({
    teamName: '',
    password: '',
    theme: '',
    hostName: ''
  });

  // Join room form state
  const [joinForm, setJoinForm] = useState<JoinRoomRequest>({
    roomCode: '',
    password: '',
    playerName: ''
  });

  React.useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes');
      const themesData = await response.json();
      setThemes(themesData);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;

    setLoading(true);
    setError('');

    socket.emit('create-room', createForm, (response) => {
      setLoading(false);
      if (response.success && response.roomCode) {
        navigate(`/room/${response.roomCode}`);
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;

    setLoading(true);
    setError('');

    socket.emit('join-room', joinForm, (response) => {
      setLoading(false);
      if (response.success) {
        navigate(`/room/${joinForm.roomCode}`);
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            Friend.ly
          </h1>
          <p className="text-xl text-blue-200">
            Music Guessing Game
          </p>
          <p className="text-sm text-blue-300 mt-2">
            Find the imposter through music hints!
          </p>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Create Room
          </button>
          
          <button
            onClick={() => setShowJoinRoom(!showJoinRoom)}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Join Room
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-600 text-white rounded-lg">
            {error}
          </div>
        )}

        {/* Create Room Form */}
        {showCreateRoom && (
          <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Create Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={createForm.teamName}
                  onChange={(e) => setCreateForm({ ...createForm, teamName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Room Password
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Theme
                </label>
                <select
                  value={createForm.theme}
                  onChange={(e) => setCreateForm({ ...createForm, theme: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a theme</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.name}>
                      {theme.name} ({theme.difficulty})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={createForm.hostName}
                  onChange={(e) => setCreateForm({ ...createForm, hostName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter your name"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        )}

        {/* Join Room Form */}
        {showJoinRoom && (
          <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Join Room</h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinForm.roomCode}
                  onChange={(e) => setJoinForm({ ...joinForm, roomCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter room code"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Room Password
                </label>
                <input
                  type="password"
                  value={joinForm.password}
                  onChange={(e) => setJoinForm({ ...joinForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={joinForm.playerName}
                  onChange={(e) => setJoinForm({ ...joinForm, playerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter your name"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          </div>
        )}

        {/* Game Rules */}
        <div className="mt-8 p-4 bg-white/5 backdrop-blur-sm rounded-lg">
          <h3 className="text-lg font-bold text-white mb-2">How to Play</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• One player is the imposter with a different song</li>
            <li>• Listen to your song and give hints</li>
            <li>• Vote to find the imposter</li>
            <li>• You have 2 tries to guess correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;


