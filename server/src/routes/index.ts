import { Express } from 'express';
import { pool } from '../database/connection';

export const setupRoutes = (app: Express) => {
  // Get available themes
  app.get('/api/themes', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM themes ORDER BY name');
      client.release();
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get themes error:', error);
      res.status(500).json({ error: 'Failed to fetch themes' });
    }
  });

  // Get room info (for joining)
  app.get('/api/rooms/:code', async (req, res) => {
    try {
      const { code } = req.params;
      
      const client = await pool.connect();
      const result = await client.query(
        'SELECT id, code, team_name, theme, max_players, status FROM rooms WHERE code = $1',
        [code]
      );
      client.release();
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  });

  // Get match history (optional feature)
  app.get('/api/matches/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM matches WHERE room_id = $1 ORDER BY created_at DESC LIMIT 10',
        [roomId]
      );
      client.release();
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  // Search songs endpoint (for testing/debugging)
  app.post('/api/search-song', async (req, res) => {
    try {
      const { genre, keywords } = req.body;
      
      if (!genre) {
        return res.status(400).json({ error: 'Genre is required' });
      }
      
      // This would typically use the YouTube service
      // For now, return a mock response
      res.json({
        genre,
        keywords,
        message: 'Song search endpoint - implement with YouTube service'
      });
    } catch (error) {
      console.error('Search song error:', error);
      res.status(500).json({ error: 'Failed to search songs' });
    }
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
};


