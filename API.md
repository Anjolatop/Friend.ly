# Friend.ly API Documentation

This document provides comprehensive API documentation for the Friend.ly music guessing game backend.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.friendly-game.com`

## Authentication

Most endpoints require JWT authentication via Socket.IO connection. REST endpoints are primarily for public data access.

## REST API Endpoints

### Health Check

#### GET /health

Check the health status of the API server.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 45678912,
    "heapTotal": 25165824,
    "heapUsed": 18965432
  },
  "version": "1.0.0"
}
```

### Themes

#### GET /api/themes

Retrieve all available game themes.

**Response:**
```json
[
  {
    "id": "uuid-123",
    "name": "Disney",
    "description": "Classic Disney songs and soundtracks",
    "genres": ["Pop", "Musical", "Children"],
    "difficulty": "easy"
  },
  {
    "id": "uuid-456",
    "name": "Broadway",
    "description": "Musical theater classics",
    "genres": ["Musical", "Pop", "Classical Music"],
    "difficulty": "medium"
  }
]
```

### Rooms

#### GET /api/rooms/:code

Get basic information about a room.

**Parameters:**
- `code` (string): 6-character room code

**Response:**
```json
{
  "id": "uuid-789",
  "code": "ABC123",
  "team_name": "Music Lovers",
  "theme": "Disney",
  "max_players": 10,
  "status": "waiting"
}
```

**Error Responses:**
- `404`: Room not found
- `500`: Server error

### Matches

#### GET /api/matches/:roomId

Get match history for a specific room.

**Parameters:**
- `roomId` (string): Room UUID

**Response:**
```json
[
  {
    "id": "uuid-match-1",
    "room_id": "uuid-789",
    "started_at": "2024-01-15T10:00:00.000Z",
    "ended_at": "2024-01-15T10:15:00.000Z",
    "winner": "crewmates",
    "imposter_id": "uuid-player-123",
    "log": {
      "events": [...],
      "hints": {...},
      "votes": {...}
    }
  }
]
```

### Song Search

#### POST /api/search-song

Search for songs (debugging/testing endpoint).

**Request Body:**
```json
{
  "genre": "pop",
  "keywords": "love"
}
```

**Response:**
```json
{
  "genre": "pop",
  "keywords": "love",
  "songs": [
    {
      "id": "yt_abc123",
      "videoId": "abc123",
      "title": "Love Song",
      "artist": "Artist Name",
      "duration": 180,
      "genre": "pop",
      "youtubeMusicUrl": "https://music.youtube.com/watch?v=abc123"
    }
  ]
}
```

## Socket.IO API

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt-token-here'
  }
});
```

### Client to Server Events

#### create-room

Create a new game room.

**Payload:**
```typescript
{
  teamName: string;
  password: string;
  theme: string;
  hostName: string;
}
```

**Callback Response:**
```typescript
{
  success: boolean;
  roomCode?: string;
  error?: string;
}
```

**Example:**
```javascript
socket.emit('create-room', {
  teamName: 'Music Squad',
  password: 'secret123',
  theme: 'Disney',
  hostName: 'Alice'
}, (response) => {
  if (response.success) {
    console.log('Room created:', response.roomCode);
  } else {
    console.error('Error:', response.error);
  }
});
```

#### join-room

Join an existing game room.

**Payload:**
```typescript
{
  roomCode: string;
  password: string;
  playerName: string;
}
```

**Callback Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### start-game

Host starts the game (host only).

**Payload:** None

**Example:**
```javascript
socket.emit('start-game');
```

#### ready

Mark player as ready.

**Payload:** None

#### submit-hint

Submit a hint for the current hint round.

**Payload:**
```typescript
{
  hintText: string; // One word hint
}
```

**Example:**
```javascript
socket.emit('submit-hint', 'magic');
```

#### chat-message

Send a chat message during discussion phase.

**Payload:**
```typescript
{
  text: string;
}
```

#### vote

Vote for a suspected imposter.

**Payload:**
```typescript
{
  targetPlayerId: string;
}
```

#### request-open-song

Request YouTube Music link for a song.

**Payload:**
```typescript
{
  playerId: string;
}
```

### Server to Client Events

#### room-updated

Room state has been updated.

**Payload:**
```typescript
{
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
}
```

**Example:**
```javascript
socket.on('room-updated', (roomState) => {
  console.log('Room updated:', roomState);
  // Update UI with new room state
});
```

#### your-song

Private song assignment for current player.

**Payload:**
```typescript
{
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  duration?: number;
  genre: string;
  youtubeMusicUrl: string;
}
```

**Example:**
```javascript
socket.on('your-song', (song) => {
  console.log('Your song:', song.title, 'by', song.artist);
  // Display song to player
});
```

#### reminder-headphones

Reminder to use headphones before game starts.

**Payload:** None

#### start-listen

Begin listening phase.

**Payload:**
```typescript
{
  duration: number; // Duration in seconds (40)
}
```

#### start-hint

Begin hint phase for specific player.

**Payload:**
```typescript
{
  playerId: string;
  timeLimit: number; // Time limit in seconds (15)
}
```

#### hint-submitted

A player has submitted their hint.

**Payload:**
```typescript
{
  playerId: string;
  hintText: string;
}
```

#### start-chat

Begin discussion phase.

**Payload:**
```typescript
{
  duration: number; // Duration in seconds (60)
}
```

#### start-vote

Begin voting phase.

**Payload:** None

#### vote-result

Voting results and game outcome.

**Payload:**
```typescript
{
  targetId: string;
  isImposter: boolean;
  votes: Record<string, string>;
}
```

#### game-over

Game has ended with final results.

**Payload:**
```typescript
{
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
```

#### error

Error message from server.

**Payload:**
```typescript
{
  message: string;
}
```

## Data Types

### Player

```typescript
interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isImposter: boolean;
  assignedSongId?: string;
  hasSubmittedHint: boolean;
  isReady: boolean;
}
```

### Song

```typescript
interface Song {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  duration?: number;
  genre: string;
  youtubeMusicUrl: string;
}
```

### GamePhase

```typescript
type GamePhase = 
  | 'WAITING' 
  | 'REMINDER' 
  | 'LISTENING' 
  | 'HINT' 
  | 'CHAT' 
  | 'VOTE' 
  | 'REVEAL' 
  | 'ENDED';
```

### Theme

```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  genres: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}
```

## Error Handling

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

### Socket.IO Error Handling

```javascript
// Global error handler
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Handle error appropriately
});

// Connection error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Attempt reconnection or show error message
});

// Disconnect handling
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Handle disconnection
});
```

## Rate Limiting

### REST API

- **General endpoints**: 100 requests per 15 minutes per IP
- **Song search**: 50 requests per hour per IP

### Socket.IO

- **Chat messages**: 30 messages per minute per socket
- **Hints**: 1 hint per 15 seconds per socket
- **Votes**: 1 vote per game phase per socket

## Webhook Events

### Game Completion Webhook

```typescript
interface GameCompletionWebhook {
  event: 'game.completed';
  data: {
    roomId: string;
    matchId: string;
    winner: 'crewmates' | 'imposter';
    duration: number; // in seconds
    playerCount: number;
    theme: string;
    timestamp: string;
  };
}
```

## SDK Examples

### JavaScript/TypeScript Client

```typescript
import io, { Socket } from 'socket.io-client';

class FriendlyGameClient {
  private socket: Socket;
  
  constructor(serverUrl: string) {
    this.socket = io(serverUrl);
    this.setupEventListeners();
  }
  
  createRoom(teamName: string, password: string, theme: string, hostName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-room', {
        teamName,
        password,
        theme,
        hostName
      }, (response) => {
        if (response.success && response.roomCode) {
          resolve(response.roomCode);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }
  
  joinRoom(roomCode: string, password: string, playerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('join-room', {
        roomCode,
        password,
        playerName
      }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }
  
  submitHint(hintText: string): void {
    this.socket.emit('submit-hint', hintText);
  }
  
  vote(targetPlayerId: string): void {
    this.socket.emit('vote', targetPlayerId);
  }
  
  onRoomUpdate(callback: (roomState: RoomState) => void): void {
    this.socket.on('room-updated', callback);
  }
  
  onYourSong(callback: (song: Song) => void): void {
    this.socket.on('your-song', callback);
  }
  
  onGameOver(callback: (result: GameResult) => void): void {
    this.socket.on('game-over', callback);
  }
  
  private setupEventListeners(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
}

// Usage
const client = new FriendlyGameClient('http://localhost:5000');

client.onRoomUpdate((roomState) => {
  console.log('Room updated:', roomState);
});

client.createRoom('My Team', 'password123', 'Disney', 'Alice')
  .then(roomCode => {
    console.log('Created room:', roomCode);
  })
  .catch(error => {
    console.error('Failed to create room:', error);
  });
```

## Testing

### Unit Tests

```javascript
// Example test for room creation
describe('Room Creation', () => {
  it('should create a room with valid data', async () => {
    const response = await request(app)
      .post('/api/rooms/create')
      .send({
        teamName: 'Test Team',
        password: 'test123',
        theme: 'Disney',
        hostName: 'Test Player'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.roomCode).toBeDefined();
  });
});
```

### Socket.IO Testing

```javascript
// Example Socket.IO test
describe('Socket.IO Events', () => {
  let clientSocket;
  
  beforeAll((done) => {
    clientSocket = io('http://localhost:5000');
    clientSocket.on('connect', done);
  });
  
  afterAll(() => {
    clientSocket.close();
  });
  
  it('should emit create-room event', (done) => {
    clientSocket.emit('create-room', {
      teamName: 'Test Team',
      password: 'test123',
      theme: 'Disney',
      hostName: 'Test Player'
    }, (response) => {
      expect(response.success).toBe(true);
      done();
    });
  });
});
```

## Changelog

### Version 1.0.0
- Initial API release
- Room creation and joining
- Game flow implementation
- Socket.IO real-time communication
- YouTube Music integration

### Version 1.1.0 (Planned)
- Tournament mode
- Custom themes
- Player statistics
- Enhanced error handling

---

For more examples and detailed implementation guides, refer to the main documentation and source code.


