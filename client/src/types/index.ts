export interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isImposter: boolean;
  assignedSongId?: string;
  hasSubmittedHint: boolean;
  isReady: boolean;
}

export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  duration?: number;
  genre: string;
  youtubeMusicUrl: string;
}

export interface RoomState {
  code: string;
  hostId: string;
  theme: string;
  teamName: string;
  players: Player[];
  phase: GamePhase;
  hints: Record<string, string>;
  votes: Record<string, string>;
  triesLeft: number;
  currentHintPlayer?: string;
  timers: {
    listening?: number;
    hint?: number;
    chat?: number;
  };
  assignedSongs: Record<string, Song>;
  imposterSong?: Song;
  crewmateSong?: Song;
}

export type GamePhase = 
  | 'WAITING' 
  | 'REMINDER' 
  | 'LISTENING' 
  | 'HINT' 
  | 'CHAT' 
  | 'VOTE' 
  | 'REVEAL' 
  | 'ENDED';

export interface Theme {
  id: string;
  name: string;
  description: string;
  genres: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CreateRoomRequest {
  teamName: string;
  password: string;
  theme: string;
  hostName: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  password: string;
  playerName: string;
}

export interface GameResult {
  winner: 'crewmates' | 'imposter';
  imposterId: string;
  songs: {
    imposter: Song;
    crewmates: Song;
  };
  youtubeLinks: {
    imposter: string;
    crewmates: string;
  };
}

// Socket.IO Event Types
export interface ServerToClientEvents {
  'room-updated': (roomState: RoomState) => void;
  'game-started': (songs: Record<string, Song>) => void;
  'your-song': (song: Song) => void;
  'reminder-headphones': () => void;
  'start-listen': (duration: number) => void;
  'start-hint': (playerId: string, timeLimit: number) => void;
  'hint-submitted': (playerId: string, hintText: string) => void;
  'start-chat': (duration: number) => void;
  'start-vote': () => void;
  'vote-result': (targetId: string, isImposter: boolean, votes: Record<string, string>) => void;
  'game-over': (result: GameResult) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'create-room': (data: CreateRoomRequest, callback: (response: { success: boolean; roomCode?: string; error?: string }) => void) => void;
  'join-room': (data: JoinRoomRequest, callback: (response: { success: boolean; error?: string }) => void) => void;
  'start-game': () => void;
  'ready': () => void;
  'submit-hint': (hintText: string) => void;
  'chat-message': (text: string) => void;
  'vote': (targetPlayerId: string) => void;
  'request-open-song': (playerId: string) => void;
}

export interface InterServerEvents {
  // For scaling with multiple servers
}


