import React, { useState } from 'react';

const ReminderPhase: React.FC = () => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDontShowAgain = () => {
    setDontShowAgain(!dontShowAgain);
    // In a real app, you'd save this preference to localStorage
    localStorage.setItem('dontShowHeadphoneReminder', dontShowAgain.toString());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          {/* Headphones Icon */}
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Put on Your Headphones!
          </h1>
          
          <p className="text-blue-200 mb-6 text-lg">
            For the best experience, please use headphones or earbuds during the game.
          </p>

          <div className="bg-yellow-600/20 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-sm">
              <strong>Why headphones?</strong><br />
              • Prevents audio bleeding to other players<br />
              • Ensures fair gameplay<br />
              • Better audio quality for music identification
            </p>
          </div>

          {/* Don't show again checkbox */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={handleDontShowAgain}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dontShowAgain" className="text-blue-200 text-sm">
              Don't show this reminder again
            </label>
          </div>

          <div className="text-blue-300 text-sm">
            Game will start automatically in a few seconds...
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderPhase;


