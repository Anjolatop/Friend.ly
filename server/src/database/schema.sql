-- Friend.ly Music Game Database Schema

-- Users table (optional, for future features)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    theme VARCHAR(50) NOT NULL,
    host_user_id UUID REFERENCES users(id),
    max_players INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'waiting' -- waiting, active, finished
);

-- Matches table (completed games)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    winner VARCHAR(20) NOT NULL, -- crewmates, imposter
    imposter_id UUID,
    log JSONB, -- game events log
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs cache table (optional, for performance)
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query VARCHAR(255) NOT NULL,
    video_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    duration INTEGER, -- in seconds
    genre VARCHAR(50),
    source VARCHAR(20) DEFAULT 'youtube',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game themes and genres
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    genres TEXT[] NOT NULL, -- array of genres for this theme
    difficulty VARCHAR(10) DEFAULT 'easy' -- easy, medium, hard
);

-- Insert default themes
INSERT INTO themes (name, description, genres, difficulty) VALUES
('Disney', 'Classic Disney songs and soundtracks', ARRAY['Pop', 'Musical', 'Children'], 'easy'),
('DreamWorks', 'DreamWorks animation soundtracks', ARRAY['Pop', 'Musical', 'Children'], 'easy'),
('P Square', 'Nigerian music duo', ARRAY['Afrobeats', 'Pop', 'RnB'], 'easy'),
('Broadway', 'Musical theater classics', ARRAY['Musical', 'Pop', 'Classical Music'], 'medium'),
('Movie Soundtracks', 'Popular movie theme songs', ARRAY['Pop', 'Classical Music', 'Instrumental'], 'medium'),
('Series Soundtracks', 'TV show theme songs', ARRAY['Pop', 'Instrumental'], 'medium'),
('Childhood Theme Songs', 'Kids TV show themes', ARRAY['Children', 'Pop'], 'easy'),
('Action', 'High-energy action movie music', ARRAY['Instrumental', 'Rock', 'Electronic'], 'medium'),
('National Anthem', 'Country national anthems', ARRAY['Classical Music', 'Patriotic'], 'hard'),
('Underground Artist', 'Independent and underground music', ARRAY['HipHop', 'Alternative', 'Indie'], 'hard');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_matches_room_id ON matches(room_id);
CREATE INDEX IF NOT EXISTS idx_songs_video_id ON songs(video_id);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_themes_name ON themes(name);

