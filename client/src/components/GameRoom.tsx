import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GameContext } from '../App';
import { RoomState, Player, Song, GamePhase } from '../types';
import Lobby from './Lobby';
import ReminderPhase from './ReminderPhase';
import ListeningPhase from './ListeningPhase';
import HintPhase from './HintPhase';
import ChatPhase from './ChatPhase';
import VotePhase from './VotePhase';
import GameOver from './GameOver';

const GameRoom: React.FC = () => {
  const { socket, roomState, currentPlayer, setCurrentPlayer } = useContext(GameContext)!;
  const { roomCode } = useParams<{ roomCode: string }>();
  const [mySong, setMySong] = useState<Song | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for private song assignment
    socket.on('your-song', (song: Song) => {
      setMySong(song);
    });

    // Find current player in room state
    if (roomState && socket.id) {
      const player = roomState.players.find(p => p.socketId === socket.id);
      if (player && (!currentPlayer || player.id !== currentPlayer.id)) {
        setCurrentPlayer(player);
      }
    }

    return () => {
      socket.off('your-song');
    };
  }, [socket, roomState, currentPlayer]);

  if (!roomState || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const renderGamePhase = () => {
    switch (roomState.phase) {
      case 'WAITING':
        return <Lobby />;
      case 'REMINDER':
        return <ReminderPhase />;
      case 'LISTENING':
        return <ListeningPhase mySong={mySong} />;
      case 'HINT':
        return <HintPhase mySong={mySong} />;
      case 'CHAT':
        return <ChatPhase />;
      case 'VOTE':
        return <VotePhase />;
      case 'ENDED':
        return <GameOver />;
      default:
        return <Lobby />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">{roomState.teamName}</h1>
              <p className="text-blue-200">Room: {roomState.code}</p>
            </div>
            
            <div className="text-right">
              <p className="text-white font-semibold">{currentPlayer.name}</p>
              <p className="text-sm text-blue-200">
                {currentPlayer.isHost ? 'Host' : 'Player'} • 
                Theme: {roomState.theme}
              </p>
            </div>
          </div>
          
          {/* Game Status */}
          {roomState.phase !== 'WAITING' && (
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <span className="text-white">
                Phase: <span className="font-semibold">{roomState.phase}</span>
              </span>
              {roomState.triesLeft !== undefined && (
                <span className="text-yellow-300">
                  Tries Left: <span className="font-semibold">{roomState.triesLeft}</span>
                </span>
              )}
              <span className="text-blue-200">
                Players: {roomState.players.length}/10
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1">
        {renderGamePhase()}
      </div>
    </div>
  );
};

export default GameRoom;


