import React, { useState, useContext } from 'react';
import { GameContext } from '../App';

const VotePhase: React.FC = () => {
  const { socket, roomState, currentPlayer } = useContext(GameContext)!;
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (playerId: string) => {
    if (socket && !hasVoted && playerId !== currentPlayer?.id) {
      setSelectedPlayer(playerId);
      socket.emit('vote', playerId);
      setHasVoted(true);
    }
  };

  const getPlayerVotes = () => {
    if (!roomState) return {};
    
    const voteCounts: Record<string, string[]> = {};
    Object.entries(roomState.votes).forEach(([voterId, targetId]) => {
      if (!voteCounts[targetId]) {
        voteCounts[targetId] = [];
      }
      const voter = roomState.players.find(p => p.id === voterId);
      if (voter) {
        voteCounts[targetId].push(voter.name);
      }
    });
    
    return voteCounts;
  };

  const getAllVotedPlayers = () => {
    if (!roomState) return [];
    return roomState.players.filter(player => roomState.votes[player.id]);
  };

  const voteCounts = getPlayerVotes();
  const votedPlayers = getAllVotedPlayers();
  const allPlayersVoted = roomState?.players.every(player => roomState.votes[player.id]) || false;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Vote for the Imposter</h2>
        <p className="text-blue-200">
          {allPlayersVoted 
            ? "All players have voted. Waiting for results..." 
            : `${votedPlayers.length}/${roomState?.players.length} players have voted`
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Area */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {hasVoted ? 'Your Vote' : 'Who do you think is the imposter?'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roomState?.players
              .filter(player => player.id !== currentPlayer?.id)
              .map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  disabled={hasVoted}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedPlayer === player.id
                      ? 'border-red-500 bg-red-600/20'
                      : hasVoted
                      ? 'border-gray-600 bg-gray-600/20 cursor-not-allowed'
                      : 'border-white/30 bg-white/5 hover:border-blue-400 hover:bg-blue-600/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold">{player.name}</p>
                      <p className="text-blue-200 text-sm">
                        {hasVoted && selectedPlayer === player.id ? 'Your choice' : 'Click to vote'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {hasVoted && (
            <div className="mt-4 p-3 bg-green-600/20 border border-green-400/30 rounded-lg">
              <p className="text-green-200 text-center">
                ✓ Vote submitted! Waiting for other players...
              </p>
            </div>
          )}
        </div>

        {/* Voting Status */}
        <div className="space-y-6">
          {/* Vote Counts */}
          {Object.keys(voteCounts).length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Current Votes</h3>
              <div className="space-y-3">
                {Object.entries(voteCounts).map(([targetId, voters]) => {
                  const targetPlayer = roomState?.players.find(p => p.id === targetId);
                  return (
                    <div key={targetId} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {targetPlayer?.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-semibold">{targetPlayer?.name}</span>
                        </div>
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">
                          {voters.length} vote{voters.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-blue-200 text-sm">
                        Voted by: {voters.join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Players Status */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Players Status</h3>
            <div className="space-y-2">
              {roomState?.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === currentPlayer?.id ? 'bg-blue-600/30' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{player.name}</span>
                  </div>
                  
                  <div className="text-right">
                    {roomState.votes[player.id] ? (
                      <span className="text-green-400 text-sm">✓ Voted</span>
                    ) : (
                      <span className="text-yellow-400 text-sm">⏳ Waiting</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hints Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Hints Given</h3>
            <div className="space-y-3">
              {roomState?.players
                .filter(player => roomState.hints[player.id])
                .map((player) => (
                  <div key={player.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm">{player.name}</span>
                    </div>
                    <p className="text-blue-200 text-sm font-mono">
                      "{roomState.hints[player.id]}"
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotePhase;


