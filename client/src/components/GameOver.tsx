import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../App';
import { GameResult } from '../types';

const GameOver: React.FC = () => {
  const { socket, roomState } = useContext(GameContext)!;
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleGameOver = (result: GameResult) => {
      setGameResult(result);
    };

    socket.on('game-over', handleGameOver);

    return () => {
      socket.off('game-over', handleGameOver);
    };
  }, [socket]);

  const handlePlayAgain = () => {
    // Reset room state and go back to lobby
    navigate('/');
  };

  const handleOpenYouTubeMusic = (url: string) => {
    window.open(url, '_blank');
  };

  if (!gameResult || !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  const imposterPlayer = roomState.players.find(p => p.id === gameResult.imposterId);
  const isImposterWin = gameResult.winner === 'imposter';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            isImposterWin 
              ? 'bg-gradient-to-br from-red-500 to-orange-500' 
              : 'bg-gradient-to-br from-green-500 to-teal-500'
          }`}>
            {isImposterWin ? (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
          </div>
          
          <h1 className={`text-4xl font-bold mb-2 ${
            isImposterWin ? 'text-red-400' : 'text-green-400'
          }`}>
            {isImposterWin ? 'Imposter Wins!' : 'Crewmates Win!'}
          </h1>
          
          <p className="text-white text-xl mb-4">
            {isImposterWin 
              ? 'The imposter successfully avoided detection!'
              : 'Great job finding the imposter!'
            }
          </p>

          {imposterPlayer && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
              <p className="text-blue-200 text-lg">
                The imposter was: <span className="font-bold text-white">{imposterPlayer.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Songs Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Imposter Song */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Imposter's Song</h3>
              <p className="text-white font-semibold text-lg mb-1">
                {gameResult.songs.imposter.title}
              </p>
              {gameResult.songs.imposter.artist && (
                <p className="text-blue-200 mb-4">by {gameResult.songs.imposter.artist}</p>
              )}
              <button
                onClick={() => handleOpenYouTubeMusic(gameResult.youtubeLinks.imposter)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Open in YouTube Music
              </button>
            </div>
          </div>

          {/* Crewmates Song */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Crewmates' Song</h3>
              <p className="text-white font-semibold text-lg mb-1">
                {gameResult.songs.crewmates.title}
              </p>
              {gameResult.songs.crewmates.artist && (
                <p className="text-blue-200 mb-4">by {gameResult.songs.crewmates.artist}</p>
              )}
              <button
                onClick={() => handleOpenYouTubeMusic(gameResult.youtubeLinks.crewmates)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Open in YouTube Music
              </button>
            </div>
          </div>
        </div>

        {/* Game Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Game Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{roomState.players.length}</p>
              <p className="text-blue-200">Players</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{roomState.theme}</p>
              <p className="text-blue-200">Theme</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {2 - roomState.triesLeft}/2
              </p>
              <p className="text-blue-200">Guesses Used</p>
            </div>
          </div>
        </div>

        {/* Hints Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Hints Given</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomState.players
              .filter(player => roomState.hints[player.id])
              .map((player) => (
                <div key={player.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{player.name}</p>
                      <p className="text-blue-200 text-sm">
                        {player.id === gameResult.imposterId ? 'Imposter' : 'Crewmate'}
                      </p>
                    </div>
                  </div>
                  <p className="text-blue-200 font-mono text-sm">
                    "{roomState.hints[player.id]}"
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Play Again
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;


