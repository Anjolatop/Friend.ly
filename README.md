# Friend.ly - Music Guessing Game

A multiplayer music guessing game inspired by Among Us, where players try to identify the imposter through music hints and social deduction.

## 🎵 Game Overview

Friend.ly is a real-time multiplayer game where:
- Players are assigned songs based on a chosen theme
- One player (the imposter) gets a different song
- Players give hints about their songs
- Everyone votes to find the imposter
- You have 2 tries to guess correctly!

## 🚀 Features

- **Multiplayer Support**: Up to 10 players per room
- **Password Protection**: Secure room access
- **Multiple Themes**: Disney, Broadway, Movie soundtracks, and more
- **Real-time Communication**: Socket.IO for instant updates
- **YouTube Music Integration**: Direct links to songs
- **AI Hint Generation**: Fallback hints when players miss deadlines
- **Responsive Design**: Works on desktop and mobile

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **React Router** for navigation
- **Framer Motion** for animations

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **Socket.IO** for WebSocket communication
- **PostgreSQL** for persistent data
- **Redis** for real-time game state
- **JWT** for authentication

### External Services
- **YouTube Data API v3** for music search
- **OpenAI API** for AI-generated hints

### DevOps
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Vercel/Netlify** for frontend deployment
- **Railway/Render** for backend deployment

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- YouTube Data API v3 key
- OpenAI API key (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd friend-ly-music-game
```

### 2. Install Dependencies
```bash
npm run setup
```

### 3. Environment Setup
```bash
# Copy environment files
cp server/env.example server/.env
cp client/.env.example client/.env

# Edit server/.env with your configuration
```

### 4. Database Setup
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Or install locally and create database
createdb friendly
```

### 5. Run Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server:dev  # Backend on port 5000
npm run client:dev  # Frontend on port 3000
```

### 6. Access the Game
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 How to Play

1. **Create or Join Room**: Enter team name, password, and select theme
2. **Wait for Players**: Minimum 3 players required to start
3. **Listen to Your Song**: 40 seconds to familiarize yourself
4. **Give Hints**: One-word hints about your song (15 seconds each)
5. **Discuss**: 1 minute to chat and analyze hints
6. **Vote**: Choose who you think is the imposter
7. **Reveal**: See if you were right!

## 🏗 Project Structure

```
friend-ly-music-game/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── database/      # DB connection & schema
│   │   ├── game/          # Game logic & room management
│   │   ├── services/      # External API services
│   │   ├── routes/        # HTTP routes
│   │   └── types/         # TypeScript types
│   └── package.json
├── docker-compose.yml     # Development environment
├── package.json           # Root package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/friendly
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:3000
```

#### Client (.env)
```env
REACT_APP_SERVER_URL=http://localhost:5000
```

### API Keys Setup

#### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to server/.env

#### OpenAI API (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Add to server/.env
4. If not provided, system uses heuristic hint generation

## 🎯 Game Themes

### Easy Difficulty
- **Disney**: Classic Disney songs and soundtracks
- **DreamWorks**: DreamWorks animation soundtracks
- **P Square**: Nigerian music duo
- **Childhood Theme Songs**: Kids TV show themes

### Medium Difficulty
- **Broadway**: Musical theater classics
- **Movie Soundtracks**: Popular movie theme songs
- **Series Soundtracks**: TV show theme songs
- **Action**: High-energy action movie music

### Hard Difficulty
- **National Anthem**: Country national anthems
- **Underground Artist**: Independent and underground music

## 🔄 Game Flow

```mermaid
graph TD
    A[Create/Join Room] --> B[Lobby - Wait for Players]
    B --> C[Host Starts Game]
    C --> D[Assign Songs & Select Imposter]
    D --> E[Reminder: Use Headphones]
    E --> F[Listening Phase - 40s]
    F --> G[Hint Round - 15s per player]
    G --> H[Chat Phase - 60s]
    H --> I[Vote Phase]
    I --> J{Correct Guess?}
    J -->|Yes| K[Crewmates Win]
    J -->|No| L{Tries Left?}
    L -->|Yes| M[New Round]
    L -->|No| N[Imposter Wins]
    M --> G
    K --> O[Game Over - Reveal Songs]
    N --> O
```

## 🧪 Testing

### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test Categories
- **Unit Tests**: Game logic, utility functions
- **Integration Tests**: Socket.IO events, database operations
- **E2E Tests**: Complete user flows with Playwright

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

### Backend (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd server
railway login
railway up
```

### Docker Production
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Analytics

- **Error Tracking**: Sentry integration
- **Performance**: Custom metrics dashboard
- **User Analytics**: Game completion rates, popular themes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write tests for new features
- Update documentation

## 📝 API Documentation

### REST Endpoints

#### Get Themes
```http
GET /api/themes
```

#### Get Room Info
```http
GET /api/rooms/:code
```

### Socket.IO Events

#### Client → Server
- `create-room`: Create new game room
- `join-room`: Join existing room
- `start-game`: Host starts the game
- `submit-hint`: Submit hint for current round
- `vote`: Vote for suspected imposter
- `chat-message`: Send chat message

#### Server → Client
- `room-updated`: Room state changes
- `your-song`: Private song assignment
- `start-listen`: Begin listening phase
- `start-hint`: Begin hint phase
- `start-chat`: Begin chat phase
- `start-vote`: Begin voting phase
- `game-over`: Game finished with results

## 🔒 Security

- **Password Protection**: Bcrypt hashing for room passwords
- **JWT Authentication**: Secure socket connections
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **CORS Configuration**: Restrict cross-origin requests

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check if services are running
docker-compose ps

# Restart services
docker-compose restart
```

#### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run server:dev
```

#### API Key Issues
- Verify YouTube API quota hasn't exceeded
- Check API key permissions
- Ensure OpenAI API key is valid (if using)

## 📈 Performance

### Optimization Tips
- **Redis Caching**: Game state stored in memory
- **Connection Pooling**: Database connection optimization
- **CDN**: Static asset delivery
- **Compression**: Gzip compression enabled

### Scaling Considerations
- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: Distribute Socket.IO connections
- **Database Sharding**: Partition game data
- **Redis Cluster**: Distributed caching

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Among Us gameplay mechanics
- YouTube Music for song integration
- OpenAI for AI-powered hints
- Socket.IO for real-time communication

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@friendly-game.com

---

Made with ❤️ by the Friend.ly team


