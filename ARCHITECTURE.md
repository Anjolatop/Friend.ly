# Friend.ly Architecture Documentation

## System Overview

Friend.ly is a real-time multiplayer music guessing game built with a modern microservices-inspired architecture. The system consists of a React frontend, Node.js backend with Socket.IO, PostgreSQL database, and Redis cache.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   React Client  │    │   React Client  │
│   (Browser)     │    │   (Browser)     │    │   (Browser)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Load Balancer         │
                    │    (Nginx/Cloudflare)     │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Node.js Backend        │
                    │   + Express.js           │
                    │   + Socket.IO            │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   External APIs          │
                    │   • YouTube Data API     │
                    │   • OpenAI API           │
                    └───────────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Data Layer             │
                    │   • PostgreSQL           │
                    │   • Redis                │
                    └───────────────────────────┘
```

## Component Architecture

### Frontend (React + TypeScript)

```
src/
├── components/           # UI Components
│   ├── LandingPage.tsx   # Room creation/joining
│   ├── GameRoom.tsx      # Main game container
│   ├── Lobby.tsx         # Pre-game lobby
│   ├── ReminderPhase.tsx # Headphone reminder
│   ├── ListeningPhase.tsx# Music listening
│   ├── HintPhase.tsx     # Hint submission
│   ├── ChatPhase.tsx     # Discussion
│   ├── VotePhase.tsx     # Voting
│   └── GameOver.tsx      # Results screen
├── types/               # TypeScript definitions
├── hooks/               # Custom React hooks
└── utils/               # Utility functions
```

**Key Frontend Patterns:**
- **Context API**: Global game state management
- **Socket.IO Client**: Real-time communication
- **Component Composition**: Reusable UI components
- **Responsive Design**: Mobile-first approach

### Backend (Node.js + TypeScript)

```
src/
├── database/            # Database layer
│   ├── connection.ts    # PostgreSQL & Redis setup
│   └── schema.sql       # Database schema
├── game/               # Game logic
│   ├── gameLogic.ts    # Core game mechanics
│   └── roomManager.ts  # Room & player management
├── services/           # External services
│   ├── youtubeService.ts# YouTube API integration
│   └── aiService.ts    # AI hint generation
├── routes/             # HTTP endpoints
│   └── index.ts        # REST API routes
└── types/              # TypeScript definitions
```

**Key Backend Patterns:**
- **Service Layer**: Business logic separation
- **Repository Pattern**: Data access abstraction
- **Event-Driven**: Socket.IO event handling
- **Dependency Injection**: Testable architecture

## Data Flow

### 1. Room Creation Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as PostgreSQL
    participant R as Redis

    C->>S: create-room (teamName, password, theme)
    S->>DB: INSERT INTO rooms
    S->>R: SET room:{code} (roomState)
    S->>C: room-updated (roomState)
```

### 2. Game Start Flow

```mermaid
sequenceDiagram
    participant H as Host Client
    participant S as Server
    participant YT as YouTube API
    participant R as Redis
    participant P as Players

    H->>S: start-game
    S->>YT: searchMultipleSongs(theme)
    YT->>S: songs[]
    S->>R: UPDATE room state
    S->>P: your-song (private)
    S->>P: room-updated (public)
    S->>P: reminder-headphones
```

### 3. Hint Submission Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant AI as OpenAI API
    participant R as Redis

    S->>C: start-hint (playerId, 15s)
    alt Player submits hint
        C->>S: submit-hint (hintText)
        S->>R: UPDATE room state
    else Timeout
        S->>AI: generateHint(songTitle)
        AI->>S: hint
        S->>R: UPDATE room state
    end
    S->>C: hint-submitted (playerId, hint)
```

## Database Design

### PostgreSQL Schema

```sql
-- Core tables
rooms (id, code, password_hash, team_name, theme, status, created_at)
matches (id, room_id, winner, imposter_id, log, created_at)
songs (id, video_id, title, artist, genre, created_at)
themes (id, name, description, genres, difficulty)

-- Indexes for performance
idx_rooms_code ON rooms(code)
idx_matches_room_id ON matches(room_id)
idx_songs_video_id ON songs(video_id)
```

### Redis Data Structure

```javascript
// Room state (JSON)
room:{code} = {
  code: "ABC123",
  hostId: "player-123",
  theme: "Disney",
  players: [
    {
      id: "player-123",
      name: "Alice",
      socketId: "socket-456",
      isHost: true,
      isImposter: false,
      assignedSongId: "song-789",
      hasSubmittedHint: false
    }
  ],
  phase: "HINT",
  hints: { "player-123": "magic" },
  votes: { "player-456": "player-123" },
  triesLeft: 2,
  assignedSongs: {
    "song-789": {
      id: "song-789",
      videoId: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      artist: "Rick Astley",
      youtubeMusicUrl: "https://music.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  }
}
```

## Socket.IO Event Architecture

### Event Categories

1. **Room Management**
   - `create-room` / `join-room`
   - `room-updated`

2. **Game Flow**
   - `start-game`
   - `your-song` (private)
   - `reminder-headphones`

3. **Game Phases**
   - `start-listen` / `start-hint` / `start-chat` / `start-vote`

4. **Player Actions**
   - `submit-hint` / `chat-message` / `vote`

5. **Game End**
   - `game-over` / `vote-result`

### Event Flow Pattern

```typescript
// Client sends action
socket.emit('submit-hint', hintText);

// Server processes and updates state
const updatedRoomState = await gameLogic.processHintSubmission(roomState, playerId, hintText);
await saveRoomState(roomCode, updatedRoomState);

// Server broadcasts update to all clients in room
io.to(roomCode).emit('room-updated', updatedRoomState);

// Server sends specific events
io.to(roomCode).emit('hint-submitted', playerId, hintText);
```

## Security Architecture

### Authentication & Authorization

```typescript
// JWT Token Structure
{
  roomCode: "ABC123",
  playerId: "player-123",
  isHost: true,
  exp: 1640995200
}

// Socket Authentication
socket.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, JWT_SECRET);
  // Validate player belongs to room
});
```

### Security Measures

1. **Input Validation**
   - Sanitize all user inputs
   - Validate room codes and player names
   - Rate limiting on API endpoints

2. **Room Security**
   - Password hashing with bcrypt
   - JWT tokens for socket authentication
   - Room state validation

3. **Data Protection**
   - No sensitive data in client state
   - Server-authoritative game logic
   - Encrypted connections (HTTPS/WSS)

## Performance Considerations

### Caching Strategy

```typescript
// Redis caching layers
1. Room State (real-time game data)
2. Song Cache (frequently accessed songs)
3. Theme Data (static theme information)
4. Session Data (player authentication)

// Cache TTL
room:{code} = 3600s (1 hour)
songs:{videoId} = 86400s (24 hours)
themes = 3600s (1 hour)
```

### Database Optimization

```sql
-- Connection pooling
max_connections = 100
connection_timeout = 30s

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM rooms WHERE code = $1;
-- Uses index idx_rooms_code

-- Prepared statements
PREPARE get_room AS SELECT * FROM rooms WHERE code = $1;
```

### Socket.IO Optimization

```typescript
// Connection management
io.engine.on('connection_error', (err) => {
  console.log('Connection error:', err.req, err.code, err.message, err.context);
});

// Room-based broadcasting
io.to(roomCode).emit('room-updated', roomState); // Efficient
io.emit('global-message', message); // Avoid

// Compression
io.engine.compression = true;
```

## Scalability Architecture

### Horizontal Scaling

```
┌─────────────────┐
│   Load Balancer │
│   (Sticky Sessions)│
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐
│Server1│   │Server2│
│Redis  │   │Redis  │
│Adapter│   │Adapter│
└───┬───┘   └───┬───┘
    │           │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │  Redis    │
    │  Cluster  │
    └───────────┘
```

### Scaling Strategies

1. **Socket.IO Scaling**
   - Redis Adapter for multi-server support
   - Sticky sessions for connection affinity
   - Horizontal server instances

2. **Database Scaling**
   - Read replicas for queries
   - Connection pooling
   - Query optimization

3. **Cache Scaling**
   - Redis Cluster for high availability
   - Cache warming strategies
   - TTL optimization

## Monitoring & Observability

### Metrics Collection

```typescript
// Custom metrics
const gameMetrics = {
  roomsCreated: new Counter('rooms_created_total'),
  gamesCompleted: new Counter('games_completed_total'),
  activeConnections: new Gauge('active_connections'),
  hintSubmissionTime: new Histogram('hint_submission_duration_ms')
};

// Health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    redis: await redisClient.ping(),
    database: await pool.query('SELECT 1')
  });
});
```

### Logging Strategy

```typescript
// Structured logging
logger.info('Game started', {
  roomCode: 'ABC123',
  playerCount: 5,
  theme: 'Disney',
  imposterId: 'player-123'
});

// Error tracking
logger.error('Failed to start game', {
  error: error.message,
  stack: error.stack,
  roomCode: roomCode,
  playerCount: players.length
});
```

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: friendly
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  server:
    build: ./server
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://friendly:password@postgres:5432/friendly
      REDIS_URL: redis://redis:6379
```

### Production Environment

```
┌─────────────────┐
│   CDN/Edge      │
│   (Cloudflare)  │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Load Balancer │
│   (Nginx/HAProxy)│
└─────────┬───────┘
          │
┌─────────▼───────┐
│   App Servers   │
│   (Railway/Render)│
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Managed DB    │
│   (Supabase)    │
└─────────────────┘
```

## Error Handling Strategy

### Client-Side Error Handling

```typescript
// Socket error handling
socket.on('error', (error) => {
  showErrorNotification(error.message);
  // Attempt reconnection
  socket.connect();
});

// React Error Boundaries
class GameErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logger.error('Game error boundary caught error', {
      error: error.message,
      errorInfo
    });
  }
}
```

### Server-Side Error Handling

```typescript
// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Socket error handling
socket.on('error', (error) => {
  logger.error('Socket error', {
    socketId: socket.id,
    error: error.message
  });
});
```

## Testing Architecture

### Test Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  ← Playwright
        │   (10%)     │
        └─────────────┘
       ┌───────────────┐
       │Integration    │  ← Jest + Socket.IO
       │Tests (20%)    │
       └───────────────┘
    ┌─────────────────────┐
    │   Unit Tests        │  ← Jest
    │   (70%)             │
    └─────────────────────┘
```

### Test Categories

1. **Unit Tests**
   - Game logic functions
   - Utility functions
   - Service classes

2. **Integration Tests**
   - Socket.IO event flows
   - Database operations
   - API endpoints

3. **E2E Tests**
   - Complete game flows
   - Multi-player scenarios
   - Error handling

## Future Enhancements

### Planned Features

1. **Advanced Game Modes**
   - Tournament mode
   - Custom themes
   - Difficulty levels

2. **Social Features**
   - Player profiles
   - Friend system
   - Leaderboards

3. **Analytics**
   - Game statistics
   - Player behavior tracking
   - A/B testing framework

4. **Mobile App**
   - React Native version
   - Push notifications
   - Offline mode

### Technical Improvements

1. **Performance**
   - WebRTC for direct peer communication
   - WebAssembly for game logic
   - Service Workers for caching

2. **Scalability**
   - Microservices architecture
   - Event sourcing
   - CQRS pattern

3. **Security**
   - OAuth integration
   - End-to-end encryption
   - Advanced rate limiting

---

This architecture document provides a comprehensive overview of the Friend.ly system design. For specific implementation details, refer to the individual component documentation and source code.


