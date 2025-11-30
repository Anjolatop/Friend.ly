import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import LandingPage from './components/LandingPage';
import GameRoom from './components/GameRoom';
import { RoomState, Player, ServerToClientEvents, ClientToServerEvents } from './types';

export interface GameContextType {
  socket: Socket<ClientToServerEvents, ServerToClientEvents> | null;
  roomState: RoomState | null;
  currentPlayer: Player | null;
  setRoomState: (roomState: RoomState) => void;
  setCurrentPlayer: (player: Player) => void;
}

export const GameContext = React.createContext<GameContextType | null>(null);

function App() {
  const [socket, setSocket] = useState<Socket<ClientToServerEvents, ServerToClientEvents> | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    newSocket.on('room-updated', (updatedRoomState: RoomState) => {
      setRoomState(updatedRoomState);
    });

    newSocket.on('error', (message: string) => {
      console.error('Socket error:', message);
      alert(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const contextValue: GameContextType = {
    socket,
    roomState,
    currentPlayer,
    setRoomState,
    setCurrentPlayer
  };

  return (
    <GameContext.Provider value={contextValue}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/room/:roomCode" 
              element={roomState ? <GameRoom /> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </GameContext.Provider>
  );
}

export default App;


