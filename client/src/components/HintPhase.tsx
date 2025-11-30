import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../App';
import { Song } from '../types';

interface HintPhaseProps {
  mySong: Song | null;
}

const HintPhase: React.FC<HintPhaseProps> = ({ mySong }) => {
  const { socket, roomState, currentPlayer } = useContext(GameContext)!;
  const [hintText, setHintText] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (!roomState || !currentPlayer) return;

    const isCurrentlyMyTurn = roomState.currentHintPlayer === currentPlayer.id;
    setIsMyTurn(isCurrentlyMyTurn);

    if (isCurrentlyMyTurn) {
      // Reset timer when it's my turn
      setTimeLeft(15);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [roomState, currentPlayer]);

  const handleSubmitHint = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && hintText.trim() && isMyTurn) {
      socket.emit('submit-hint', hintText.trim());
      setHintText('');
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = roomState?.players.find(p => p.id === playerId);
    return player?.name || 'Unknown Player';
  };

  const getHintForPlayer = (playerId: string) => {
    return roomState?.hints[playerId] || null;
  };

  const getRemainingPlayers = () => {
    if (!roomState) return [];
    return roomState.players.filter(player => !player.hasSubmittedHint);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Hint Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Turn Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Hint Round</h2>
            
            {isMyTurn ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mb-3">
                    <span className="text-2xl font-bold text-white">{timeLeft}</span>
                  </div>
                  <p className="text-white text-lg">Your turn to give a hint!</p>
                </div>

                <form onSubmit={handleSubmitHint} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      Give a one-word hint about your song:
                    </label>
                    <input
                      type="text"
                      value={hintText}
                      onChange={(e) => setHintText(e.target.value)}
                      className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your hint..."
                      maxLength={20}
                      autoFocus
                    />
                    <p className="text-blue-200 text-xs mt-1">
                      Maximum 20 characters
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!hintText.trim() || timeLeft === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Submit Hint
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg">
                    Waiting for <span className="font-bold text-yellow-300">
                      {roomState.currentHintPlayer ? getPlayerName(roomState.currentHintPlayer) : 'someone'}
                    </span> to give their hint
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* My Song Reference */}
          {mySong && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">Your Song</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">{mySong.title}</p>
                  {mySong.artist && (
                    <p className="text-blue-200 text-sm">by {mySong.artist}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Players and Hints Sidebar */}
        <div className="space-y-6">
          {/* Players Status */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Players</h3>
            <div className="space-y-3">
              {roomState?.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === currentPlayer?.id
                      ? 'bg-blue-600/30 border border-blue-400'
                      : 'bg-white/5 border border-white/10'
                  } ${
                    player.id === roomState.currentHintPlayer
                      ? 'ring-2 ring-yellow-400'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{player.name}</span>
                  </div>
                  
                  <div className="text-right">
                    {player.hasSubmittedHint ? (
                      <span className="text-green-400 text-sm">✓</span>
                    ) : (
                      <span className="text-yellow-400 text-sm">⏳</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submitted Hints */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Hints</h3>
            <div className="space-y-3">
              {roomState?.players
                .filter(player => roomState.hints[player.id])
                .map((player) => (
                  <div key={player.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm">{player.name}</span>
                    </div>
                    <p className="text-blue-200 text-sm font-mono">
                      "{getHintForPlayer(player.id)}"
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Remaining Players */}
          {getRemainingPlayers().length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Still Waiting</h3>
              <div className="space-y-2">
                {getRemainingPlayers().map((player) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-blue-200 text-sm">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HintPhase;


