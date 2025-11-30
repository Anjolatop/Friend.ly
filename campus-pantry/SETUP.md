# Campus Pantry Setup Guide

## Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- Redis 6+
- Docker and Docker Compose (optional, for easy database setup)

## Quick Start with Docker

1. **Start database services:**
```bash
docker-compose up -d
```

This will start PostgreSQL with PostGIS and Redis.

2. **Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python manage.py db init
python manage.py db migrate -m "Initial migration"
python manage.py db upgrade

# Run the server
python app.py
```

3. **Frontend Setup:**
```bash
cd frontend
npm install

# Create .env file
echo "REACT_APP_MAPBOX_TOKEN=your-mapbox-token" > .env

# Run the development server
npm start
```

## Manual Setup (without Docker)

### PostgreSQL Setup

1. Install PostgreSQL with PostGIS:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# macOS
brew install postgresql postgis

# Windows: Download from postgresql.org and install PostGIS extension
```

2. Create database:
```bash
createdb campus_pantry
psql campus_pantry -c "CREATE EXTENSION postgis;"
```

### Redis Setup

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows: Download from redis.io
```

Start Redis:
```bash
redis-server
```

### Backend Configuration

1. Create `.env` file in `backend/` directory:
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/campus_pantry
REDIS_URL=redis://localhost:6379/0
```

2. Install dependencies and run:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend Configuration

1. Create `.env` file in `frontend/` directory:
```env
REACT_APP_MAPBOX_TOKEN=your-mapbox-access-token
```

Get a Mapbox token from https://account.mapbox.com/

2. Install dependencies and run:
```bash
cd frontend
npm install
npm start
```

## Running Background Workers

For notifications and scheduled tasks, run Celery:

```bash
cd backend
celery -A app.celery worker --loglevel=info
```

## Database Migrations

When you change models, create a migration:

```bash
cd backend
python manage.py db migrate -m "Description of changes"
python manage.py db upgrade
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Production Deployment

1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

3. Build frontend for production:
```bash
cd frontend
npm run build
```

4. Serve the `build/` directory with a web server like Nginx

## Troubleshooting

### PostGIS Extension Error
If you get an error about PostGIS, make sure the extension is installed:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Redis Connection Error
Make sure Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Mapbox Map Not Loading
Make sure you've set `REACT_APP_MAPBOX_TOKEN` in the frontend `.env` file.


