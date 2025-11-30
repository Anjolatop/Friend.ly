import React, { useState, useEffect, useRef } from 'react';
import { GameContext } from '../App';

const ChatPhase: React.FC = () => {
  const { socket, roomState, currentPlayer } = useContext(GameContext)!;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ player: string; text: string; timestamp: Date }>>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('chat-message', message.trim());
      setMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Discussion Time</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{timeLeft}</span>
                  </div>
                  <span className="text-white text-sm">seconds left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-blue-200 py-8">
                  <p>Start discussing the hints to find the imposter!</p>
                  <p className="text-sm mt-2">Remember: one player has a different song</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.player === currentPlayer?.name ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.player === currentPlayer?.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">{msg.player}</div>
                      <div>{msg.text}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="mt-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Players */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Players</h3>
            <div className="space-y-2">
              {roomState?.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center space-x-3 p-2 rounded ${
                    player.id === currentPlayer?.id ? 'bg-blue-600/30' : 'bg-white/5'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hints Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Hints Given</h3>
            <div className="space-y-2">
              {roomState?.players
                .filter(player => roomState.hints[player.id])
                .map((player) => (
                  <div key={player.id} className="bg-white/5 rounded p-2">
                    <div className="text-white font-semibold text-sm">{player.name}</div>
                    <div className="text-blue-200 text-sm font-mono">
                      "{roomState.hints[player.id]}"
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Tips</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Look for hints that seem out of place</li>
              <li>• Ask players to explain their hints</li>
              <li>• Consider the theme and genre</li>
              <li>• Vote carefully - you only have 2 tries!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPhase;


