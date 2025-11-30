# Campus Pantry

A platform connecting students with surplus food resources on campus through map-based discovery and feed browsing.

## Project Overview

Campus Pantry helps students find food resources on campus, whether it's leftover pizza from dining halls or scheduled food pantry hours. The system supports both temporary postings (surplus food) and permanent resources (regular food pantry schedules).

## Architecture

- **Frontend**: React + Tailwind CSS (Single Page Application)
- **Backend**: Python + Flask (RESTful API)
- **Database**: PostgreSQL with PostGIS (geographic queries)
- **Cache**: Redis (sessions, rate limiting, caching)
- **Object Storage**: S3-compatible storage for images
- **Background Workers**: Celery for async tasks
- **Push Notifications**: Firebase Cloud Messaging
- **Monitoring**: Prometheus + Grafana, Sentry

## Features

### For Students
- Interactive map view showing nearby food resources
- Chronological feed of recent food postings
- Save posts for later
- Location-based notifications
- Privacy-focused (no tracking of who uses resources)

### For Organizations
- Create and manage food postings
- Schedule recurring offerings
- View analytics and engagement metrics
- Organization dashboard

### For Admins
- Review flagged posts
- Manage user accounts
- View platform statistics
- Export data for reports

## Project Structure

```
campus-pantry/
├── frontend/          # React application
├── backend/           # Flask API server
├── database/          # Database migrations and schemas
├── docker-compose.yml # Development environment setup
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 14+ with PostGIS extension
- Redis 6+

### Installation

1. **Backend Setup**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Frontend Setup**:
```bash
cd frontend
npm install
```

3. **Database Setup**:
```bash
# Create PostgreSQL database with PostGIS
createdb campus_pantry
psql campus_pantry -c "CREATE EXTENSION postgis;"

# Run migrations
cd backend
python manage.py db upgrade
```

4. **Environment Variables**:
Copy `backend/.env.example` to `backend/.env` and fill in your configuration.

5. **Run Development Servers**:
```bash
# Terminal 1: Backend
cd backend
python app.py

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Redis (if not running as service)
redis-server

# Terminal 4: Celery Worker (for background tasks)
cd backend
celery -A app.celery worker --loglevel=info
```

## API Documentation

See `API.md` for detailed API endpoint documentation.

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## License

MIT


