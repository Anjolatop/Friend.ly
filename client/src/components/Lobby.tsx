import React, { useContext } from 'react';
import { GameContext } from '../App';
import { Player } from '../types';

const Lobby: React.FC = () => {
  const { socket, roomState, currentPlayer } = useContext(GameContext)!;

  const handleStartGame = () => {
    if (socket) {
      socket.emit('start-game');
    }
  };

  const handleReady = () => {
    if (socket) {
      socket.emit('ready');
    }
  };

  if (!roomState || !currentPlayer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const canStartGame = currentPlayer.isHost && roomState.players.length >= 3;
  const allPlayersReady = roomState.players.every(player => player.isReady);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Players ({roomState.players.length}/10)</h2>
          
          <div className="space-y-3">
            {roomState.players.map((player: Player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === currentPlayer.id
                    ? 'bg-blue-600/30 border-2 border-blue-400'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{player.name}</p>
                    <p className="text-sm text-blue-200">
                      {player.isHost ? 'Host' : 'Player'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {player.isReady && (
                    <span className="text-green-400 text-sm">✓ Ready</span>
                  )}
                  {player.isHost && (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      HOST
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Waiting for more players */}
          {roomState.players.length < 3 && (
            <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-400/30 rounded-lg">
              <p className="text-yellow-200 text-center">
                Waiting for more players (minimum 3 required)
              </p>
            </div>
          )}
        </div>

        {/* Game Info & Controls */}
        <div className="space-y-6">
          {/* Game Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Game Settings</h3>
            <div className="space-y-3">
              <div>
                <span className="text-blue-200">Theme:</span>
                <span className="text-white ml-2 font-semibold">{roomState.theme}</span>
              </div>
              <div>
                <span className="text-blue-200">Team:</span>
                <span className="text-white ml-2 font-semibold">{roomState.teamName}</span>
              </div>
              <div>
                <span className="text-blue-200">Room Code:</span>
                <span className="text-white ml-2 font-semibold font-mono">{roomState.code}</span>
              </div>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
            <ul className="text-blue-200 space-y-2 text-sm">
              <li>• One player will be the imposter with a different song</li>
              <li>• Listen to your assigned song (40 seconds)</li>
              <li>• Give one-word hints about your song (15 seconds each)</li>
              <li>• Discuss with other players (1 minute)</li>
              <li>• Vote to find the imposter</li>
              <li>• You have 2 chances to guess correctly</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {currentPlayer.isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!canStartGame}
                className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                  canStartGame
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transform hover:scale-105'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {roomState.players.length < 3 ? 'Need 3+ Players' : 'Start Game'}
              </button>
            ) : (
              <button
                onClick={handleReady}
                disabled={currentPlayer.isReady}
                className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                  currentPlayer.isReady
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                }`}
              >
                {currentPlayer.isReady ? 'Ready!' : 'Mark as Ready'}
              </button>
            )}
          </div>

          {/* Share Room Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Invite Friends</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={roomState.code}
                readOnly
                className="flex-1 px-3 py-2 bg-white/20 text-white rounded border border-white/30 font-mono text-center"
              />
              <button
                onClick={() => navigator.clipboard.writeText(roomState.code)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;


