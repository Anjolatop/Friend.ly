import React, { useState, useEffect } from 'react';
import { Song } from '../types';

interface ListeningPhaseProps {
  mySong: Song | null;
}

const ListeningPhase: React.FC<ListeningPhaseProps> = ({ mySong }) => {
  const [timeLeft, setTimeLeft] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const openInYouTubeMusic = () => {
    if (mySong) {
      window.open(mySong.youtubeMusicUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Timer */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
            <span className="text-3xl font-bold text-white">{timeLeft}</span>
          </div>
          <p className="text-white text-xl">seconds to listen</p>
        </div>

        {/* Song Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Your Song</h2>
          
          {mySong ? (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                {mySong.title}
              </h3>
              {mySong.artist && (
                <p className="text-blue-200 mb-6">by {mySong.artist}</p>
              )}

              {/* Play Button */}
              <div className="mb-6">
                <button
                  onClick={handlePlayPause}
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <p className="text-blue-200 text-sm mt-2">
                  {isPlaying ? 'Playing...' : 'Click to play'}
                </p>
              </div>

              {/* YouTube Music Link */}
              <button
                onClick={openInYouTubeMusic}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Open in YouTube Music
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-blue-200">Loading your song...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3">Instructions</h3>
          <ul className="text-blue-200 space-y-2 text-sm">
            <li>• Listen carefully to your assigned song</li>
            <li>• Pay attention to the melody, lyrics, and style</li>
            <li>• You'll need to give hints about this song later</li>
            <li>• Don't share what you're hearing with other players</li>
          </ul>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((40 - timeLeft) / 40) * 100}%` }}
            />
          </div>
          <p className="text-center text-blue-200 text-sm mt-2">
            Listening phase will end automatically
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListeningPhase;


