import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { redisClient } from '../database/connection';
import { pool } from '../database/connection';
import { RoomState, Player, CreateRoomRequest, JoinRoomRequest, ServerToClientEvents, ClientToServerEvents, InterServerEvents } from '../types';
import { GameLogic } from './gameLogic';

export class RoomManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;
  private gameLogic: GameLogic;
  private timers: Map<string, NodeJS.Timeout[]> = new Map();

  constructor(io: Server, youtubeApiKey: string, openaiApiKey: string) {
    this.io = io;
    this.gameLogic = new GameLogic(youtubeApiKey, openaiApiKey);
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents>) => {
      console.log(`Player connected: ${socket.id}`);

      socket.on('create-room', async (data: CreateRoomRequest, callback) => {
        try {
          await this.handleCreateRoom(socket, data, callback);
        } catch (error) {
          callback({ success: false, error: 'Failed to create room' });
        }
      });

      socket.on('join-room', async (data: JoinRoomRequest, callback) => {
        try {
          await this.handleJoinRoom(socket, data, callback);
        } catch (error) {
          callback({ success: false, error: 'Failed to join room' });
        }
      });

      socket.on('start-game', async () => {
        await this.handleStartGame(socket);
      });

      socket.on('ready', async () => {
        await this.handleReady(socket);
      });

      socket.on('submit-hint', async (hintText: string) => {
        await this.handleSubmitHint(socket, hintText);
      });

      socket.on('chat-message', async (text: string) => {
        await this.handleChatMessage(socket, text);
      });

      socket.on('vote', async (targetPlayerId: string) => {
        await this.handleVote(socket, targetPlayerId);
      });

      socket.on('request-open-song', async (playerId: string) => {
        await this.handleRequestOpenSong(socket, playerId);
      });

      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async handleCreateRoom(
    socket: Socket, 
    data: CreateRoomRequest, 
    callback: (response: { success: boolean; roomCode?: string; error?: string }) => void
  ) {
    try {
      // Generate room code
      const roomCode = this.generateRoomCode();
      
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create room in database
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO rooms (code, password_hash, team_name, theme, host_user_id) VALUES ($1, $2, $3, $4, NULL) RETURNING id',
        [roomCode, passwordHash, data.teamName, data.theme]
      );
      const roomId = result.rows[0].id;
      client.release();

      // Create initial room state
      const hostPlayer: Player = {
        id: uuidv4(),
        name: data.hostName,
        socketId: socket.id,
        isHost: true,
        isImposter: false,
        hasSubmittedHint: false,
        isReady: false
      };

      const roomState: RoomState = {
        code: roomCode,
        hostId: hostPlayer.id,
        theme: data.theme,
        teamName: data.teamName,
        players: [hostPlayer],
        phase: 'WAITING',
        hints: {},
        votes: {},
        triesLeft: 2,
        assignedSongs: {}
      };

      // Store in Redis
      await redisClient.setEx(`room:${roomCode}`, 3600, JSON.stringify(roomState));

      // Join socket room
      socket.join(roomCode);

      // Generate JWT token
      const token = jwt.sign(
        { roomCode, playerId: hostPlayer.id, isHost: true },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );

      callback({ success: true, roomCode });
      socket.emit('room-updated', roomState);
    } catch (error) {
      console.error('Create room error:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  }

  private async handleJoinRoom(
    socket: Socket,
    data: JoinRoomRequest,
    callback: (response: { success: boolean; error?: string }) => void
  ) {
    try {
      // Verify room exists and password
      const client = await pool.connect();
      const roomResult = await client.query(
        'SELECT * FROM rooms WHERE code = $1 AND status = $2',
        [data.roomCode, 'waiting']
      );
      
      if (roomResult.rows.length === 0) {
        client.release();
        callback({ success: false, error: 'Room not found or game already started' });
        return;
      }

      const room = roomResult.rows[0];
      const passwordMatch = await bcrypt.compare(data.password, room.password_hash);
      
      if (!passwordMatch) {
        client.release();
        callback({ success: false, error: 'Incorrect password' });
        return;
      }

      // Get room state from Redis
      const roomStateJson = await redisClient.get(`room:${data.roomCode}`);
      if (!roomStateJson) {
        client.release();
        callback({ success: false, error: 'Room state not found' });
        return;
      }

      const roomState: RoomState = JSON.parse(roomStateJson);

      // Check if room is full
      if (roomState.players.length >= room.max_players) {
        client.release();
        callback({ success: false, error: 'Room is full' });
        return;
      }

      // Check if name is taken
      if (roomState.players.some(p => p.name === data.playerName)) {
        client.release();
        callback({ success: false, error: 'Name already taken' });
        return;
      }

      // Add player
      const newPlayer: Player = {
        id: uuidv4(),
        name: data.playerName,
        socketId: socket.id,
        isHost: false,
        isImposter: false,
        hasSubmittedHint: false,
        isReady: false
      };

      roomState.players.push(newPlayer);

      // Update Redis
      await redisClient.setEx(`room:${data.roomCode}`, 3600, JSON.stringify(roomState));

      // Join socket room
      socket.join(data.roomCode);

      // Generate JWT token
      const token = jwt.sign(
        { roomCode: data.roomCode, playerId: newPlayer.id, isHost: false },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );

      client.release();

      callback({ success: true });
      
      // Broadcast updated room state to all players
      this.io.to(data.roomCode).emit('room-updated', roomState);
    } catch (error) {
      console.error('Join room error:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  }

  private async handleStartGame(socket: Socket) {
    try {
      const roomCode = await this.getRoomCodeFromSocket(socket);
      if (!roomCode) return;

      const roomState = await this.getRoomState(roomCode);
      if (!roomState) return;

      // Verify host
      const player = roomState.players.find(p => p.socketId === socket.id);
      if (!player || !player.isHost) {
        socket.emit('error', 'Only host can start the game');
        return;
      }

      // Check minimum players
      if (roomState.players.length < 3) {
        socket.emit('error', 'Minimum 3 players required');
        return;
      }

      // Start game
      const updatedRoomState = await this.gameLogic.startGame(roomState);
      await this.saveRoomState(roomCode, updatedRoomState);

      // Send private song to each player
      updatedRoomState.players.forEach(player => {
        const socket = this.io.sockets.sockets.get(player.socketId);
        if (socket && player.assignedSongId) {
          const song = updatedRoomState.assignedSongs[player.assignedSongId];
          socket.emit('your-song', song);
        }
      });

      // Broadcast room update
      this.io.to(roomCode).emit('room-updated', updatedRoomState);

      // Start reminder phase
      this.startReminderPhase(roomCode);
    } catch (error) {
      console.error('Start game error:', error);
      socket.emit('error', 'Failed to start game');
    }
  }

  private async handleSubmitHint(socket: Socket, hintText: string) {
    try {
      const roomCode = await this.getRoomCodeFromSocket(socket);
      if (!roomCode) return;

      const roomState = await this.getRoomState(roomCode);
      if (!roomState) return;

      const player = roomState.players.find(p => p.socketId === socket.id);
      if (!player || roomState.currentHintPlayer !== player.id) {
        socket.emit('error', 'Not your turn to submit hint');
        return;
      }

      const updatedRoomState = await this.gameLogic.processHintSubmission(roomState, player.id, hintText);
      await this.saveRoomState(roomCode, updatedRoomState);

      // Broadcast hint submission
      this.io.to(roomCode).emit('hint-submitted', player.id, hintText);

      // Move to next player or next phase
      await this.processHintPhase(roomCode);
    } catch (error) {
      console.error('Submit hint error:', error);
      socket.emit('error', 'Failed to submit hint');
    }
  }

  private async handleVote(socket: Socket, targetPlayerId: string) {
    try {
      const roomCode = await this.getRoomCodeFromSocket(socket);
      if (!roomCode) return;

      const roomState = await this.getRoomState(roomCode);
      if (!roomState) return;

      const voter = roomState.players.find(p => p.socketId === socket.id);
      if (!voter) return;

      const updatedRoomState = this.gameLogic.processVote(roomState, voter.id, targetPlayerId);
      await this.saveRoomState(roomCode, updatedRoomState);

      // Check if all players have voted
      const allVoted = updatedRoomState.players.every(p => updatedRoomState.votes[p.id]);
      if (allVoted) {
        await this.processVoteResults(roomCode);
      }
    } catch (error) {
      console.error('Vote error:', error);
      socket.emit('error', 'Failed to process vote');
    }
  }

  private async processVoteResults(roomCode: string) {
    const roomState = await this.getRoomState(roomCode);
    if (!roomState) return;

    const { roomState: updatedRoomState, gameResult } = this.gameLogic.processVoteResults(roomState);
    await this.saveRoomState(roomCode, updatedRoomState);

    if (gameResult) {
      // Game over
      this.io.to(roomCode).emit('game-over', gameResult);
      
      // Clear timers
      this.clearTimers(roomCode);
    } else {
      // Continue game
      this.io.to(roomCode).emit('room-updated', updatedRoomState);
      
      // Start new round
      if (updatedRoomState.triesLeft > 0) {
        this.startHintPhase(roomCode);
      }
    }
  }

  private async handleDisconnect(socket: Socket) {
    // Find and remove player from all rooms
    const rooms = await redisClient.keys('room:*');
    
    for (const roomKey of rooms) {
      const roomCode = roomKey.replace('room:', '');
      const roomStateJson = await redisClient.get(roomKey);
      
      if (roomStateJson) {
        const roomState: RoomState = JSON.parse(roomStateJson);
        const playerIndex = roomState.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIndex !== -1) {
          const player = roomState.players[playerIndex];
          roomState.players.splice(playerIndex, 1);
          
          // If host left, promote next player
          if (player.isHost && roomState.players.length > 0) {
            roomState.players[0].isHost = true;
            roomState.hostId = roomState.players[0].id;
          }
          
          await this.saveRoomState(roomCode, roomState);
          this.io.to(roomCode).emit('room-updated', roomState);
        }
      }
    }
  }

  // Timer management methods
  private startReminderPhase(roomCode: string) {
    this.io.to(roomCode).emit('reminder-headphones');
    
    setTimeout(() => {
      this.startListeningPhase(roomCode);
    }, 3000);
  }

  private startListeningPhase(roomCode: string) {
    this.io.to(roomCode).emit('start-listen', 40);
    
    const timer = setTimeout(() => {
      this.startHintPhase(roomCode);
    }, 40000);
    
    this.addTimer(roomCode, timer);
  }

  private async startHintPhase(roomCode: string) {
    const roomState = await this.getRoomState(roomCode);
    if (!roomState) return;

    // Reset hint submissions
    roomState.players.forEach(player => {
      player.hasSubmittedHint = false;
    });
    roomState.hints = {};
    roomState.currentHintPlayer = undefined;

    await this.saveRoomState(roomCode, roomState);
    await this.processHintPhase(roomCode);
  }

  private async processHintPhase(roomCode: string) {
    const roomState = await this.getRoomState(roomCode);
    if (!roomState) return;

    const nextPlayerId = this.gameLogic.getNextHintPlayer(roomState);
    
    if (!nextPlayerId) {
      // All hints submitted, start chat
      this.startChatPhase(roomCode);
      return;
    }

    // Update current hint player
    roomState.currentHintPlayer = nextPlayerId;
    await this.saveRoomState(roomCode, roomState);

    // Notify player
    const player = roomState.players.find(p => p.id === nextPlayerId);
    if (player) {
      const socket = this.io.sockets.sockets.get(player.socketId);
      socket?.emit('start-hint', nextPlayerId, 15);
    }

    // Set timeout for hint submission
    const timer = setTimeout(async () => {
      const currentRoomState = await this.getRoomState(roomCode);
      if (currentRoomState && currentRoomState.currentHintPlayer === nextPlayerId) {
        const updatedRoomState = await this.gameLogic.generateFallbackHint(currentRoomState, nextPlayerId);
        await this.saveRoomState(roomCode, updatedRoomState);
        
        this.io.to(roomCode).emit('hint-submitted', nextPlayerId, updatedRoomState.hints[nextPlayerId]);
        await this.processHintPhase(roomCode);
      }
    }, 15000);
    
    this.addTimer(roomCode, timer);
  }

  private startChatPhase(roomCode: string) {
    this.io.to(roomCode).emit('start-chat', 60);
    
    const timer = setTimeout(() => {
      this.startVotePhase(roomCode);
    }, 60000);
    
    this.addTimer(roomCode, timer);
  }

  private startVotePhase(roomCode: string) {
    this.io.to(roomCode).emit('start-vote');
  }

  private addTimer(roomCode: string, timer: NodeJS.Timeout) {
    if (!this.timers.has(roomCode)) {
      this.timers.set(roomCode, []);
    }
    this.timers.get(roomCode)!.push(timer);
  }

  private clearTimers(roomCode: string) {
    const timers = this.timers.get(roomCode);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.timers.delete(roomCode);
    }
  }

  // Helper methods
  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async getRoomCodeFromSocket(socket: Socket): Promise<string | null> {
    const rooms = Array.from(socket.rooms);
    return rooms.find(room => room !== socket.id) || null;
  }

  private async getRoomState(roomCode: string): Promise<RoomState | null> {
    try {
      const roomStateJson = await redisClient.get(`room:${roomCode}`);
      return roomStateJson ? JSON.parse(roomStateJson) : null;
    } catch (error) {
      console.error('Get room state error:', error);
      return null;
    }
  }

  private async saveRoomState(roomCode: string, roomState: RoomState): Promise<void> {
    try {
      await redisClient.setEx(`room:${roomCode}`, 3600, JSON.stringify(roomState));
    } catch (error) {
      console.error('Save room state error:', error);
    }
  }

  private async handleReady(socket: Socket) {
    // Implementation for ready state if needed
  }

  private async handleChatMessage(socket: Socket, text: string) {
    // Implementation for chat messages if needed
  }

  private async handleRequestOpenSong(socket: Socket, playerId: string) {
    // Implementation for opening songs on YouTube Music
  }
}


