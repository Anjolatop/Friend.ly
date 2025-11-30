import { v4 as uuidv4 } from 'uuid';
import { RoomState, Player, Song, GamePhase, GameResult } from '../types';
import { YouTubeService } from '../services/youtubeService';
import { AIService } from '../services/aiService';

export class GameLogic {
  private youtubeService: YouTubeService;
  private aiService: AIService;

  constructor(youtubeApiKey: string, openaiApiKey: string) {
    this.youtubeService = new YouTubeService(youtubeApiKey);
    this.aiService = new AIService(openaiApiKey);
  }

  async startGame(roomState: RoomState): Promise<RoomState> {
    if (roomState.players.length < 3) {
      throw new Error('Minimum 3 players required to start game');
    }

    // Select random imposter
    const imposterIndex = Math.floor(Math.random() * roomState.players.length);
    
    // Get songs for the theme
    const songs = await this.getSongsForTheme(roomState.theme, roomState.players.length);
    
    if (songs.length < 2) {
      throw new Error('Not enough songs found for theme');
    }

    // Assign songs: one for crewmates, different one for imposter
    const crewmateSong = songs[0];
    const imposterSong = songs[1];

    // Update players with imposter status and assigned songs
    const updatedPlayers = roomState.players.map((player, index) => ({
      ...player,
      isImposter: index === imposterIndex,
      assignedSongId: index === imposterIndex ? imposterSong.id : crewmateSong.id,
      hasSubmittedHint: false,
      isReady: false
    }));

    return {
      ...roomState,
      players: updatedPlayers,
      phase: 'REMINDER' as GamePhase,
      hints: {},
      votes: {},
      triesLeft: 2,
      assignedSongs: {
        [crewmateSong.id]: crewmateSong,
        [imposterSong.id]: imposterSong
      },
      imposterSong,
      crewmateSong,
      timers: {}
    };
  }

  async processHintSubmission(
    roomState: RoomState, 
    playerId: string, 
    hintText: string
  ): Promise<RoomState> {
    const updatedHints = { ...roomState.hints };
    updatedHints[playerId] = hintText;

    const updatedPlayers = roomState.players.map(player => 
      player.id === playerId 
        ? { ...player, hasSubmittedHint: true }
        : player
    );

    return {
      ...roomState,
      hints: updatedHints,
      players: updatedPlayers,
      currentHintPlayer: undefined
    };
  }

  async generateFallbackHint(
    roomState: RoomState, 
    playerId: string
  ): Promise<RoomState> {
    const player = roomState.players.find(p => p.id === playerId);
    if (!player || !player.assignedSongId) {
      return roomState;
    }

    const song = roomState.assignedSongs[player.assignedSongId];
    if (!song) {
      return roomState;
    }

    // Try AI service first, fallback to heuristic
    let hint: string;
    try {
      hint = await this.aiService.generateHint(song.title, song.artist);
    } catch (error) {
      hint = this.aiService.generateHeuristicHint(song.title, song.artist);
    }

    const updatedHints = { ...roomState.hints };
    updatedHints[playerId] = `auto:${hint}`;

    const updatedPlayers = roomState.players.map(p => 
      p.id === playerId 
        ? { ...p, hasSubmittedHint: true }
        : p
    );

    return {
      ...roomState,
      hints: updatedHints,
      players: updatedPlayers,
      currentHintPlayer: undefined
    };
  }

  processVote(roomState: RoomState, voterId: string, targetId: string): RoomState {
    const updatedVotes = { ...roomState.votes };
    updatedVotes[voterId] = targetId;

    return {
      ...roomState,
      votes: updatedVotes
    };
  }

  processVoteResults(roomState: RoomState): { roomState: RoomState; gameResult?: GameResult } {
    const votes = roomState.votes;
    const voteCounts: Record<string, number> = {};

    // Count votes
    Object.values(votes).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // Find player with most votes
    const mostVotedPlayer = Object.entries(voteCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    if (!mostVotedPlayer) {
      return { roomState };
    }

    const votedPlayer = roomState.players.find(p => p.id === mostVotedPlayer);
    if (!votedPlayer) {
      return { roomState };
    }

    if (votedPlayer.isImposter) {
      // Correct guess - crewmates win
      const gameResult: GameResult = {
        winner: 'crewmates',
        imposterId: votedPlayer.id,
        songs: {
          imposter: roomState.imposterSong!,
          crewmates: roomState.crewmateSong!
        },
        youtubeLinks: {
          imposter: roomState.imposterSong!.youtubeMusicUrl,
          crewmates: roomState.crewmateSong!.youtubeMusicUrl
        }
      };

      return {
        roomState: {
          ...roomState,
          phase: 'ENDED' as GamePhase
        },
        gameResult
      };
    } else {
      // Wrong guess - decrement tries
      const newTriesLeft = roomState.triesLeft - 1;
      
      if (newTriesLeft <= 0) {
        // Out of tries - imposter wins
        const gameResult: GameResult = {
          winner: 'imposter',
          imposterId: roomState.players.find(p => p.isImposter)!.id,
          songs: {
            imposter: roomState.imposterSong!,
            crewmates: roomState.crewmateSong!
          },
          youtubeLinks: {
            imposter: roomState.imposterSong!.youtubeMusicUrl,
            crewmates: roomState.crewmateSong!.youtubeMusicUrl
          }
        };

        return {
          roomState: {
            ...roomState,
            phase: 'ENDED' as GamePhase,
            triesLeft: 0
          },
          gameResult
        };
      } else {
        // Continue with fewer tries
        return {
          roomState: {
            ...roomState,
            triesLeft: newTriesLeft,
            phase: 'CHAT' as GamePhase,
            votes: {},
            hints: {},
            players: roomState.players.map(p => ({
              ...p,
              hasSubmittedHint: false
            }))
          }
        };
      }
    }
  }

  getNextHintPlayer(roomState: RoomState): string | null {
    const playersWithoutHints = roomState.players.filter(p => !p.hasSubmittedHint);
    if (playersWithoutHints.length === 0) {
      return null;
    }

    // Return random player who hasn't submitted hint
    const randomIndex = Math.floor(Math.random() * playersWithoutHints.length);
    return playersWithoutHints[randomIndex].id;
  }

  private async getSongsForTheme(theme: string, playerCount: number): Promise<Song[]> {
    // Map themes to genres
    const themeGenreMap: Record<string, string[]> = {
      'Disney': ['pop', 'musical', 'children'],
      'DreamWorks': ['pop', 'musical', 'children'],
      'P Square': ['afrobeats', 'pop', 'rnb'],
      'Broadway': ['musical', 'pop', 'classical'],
      'Movie Soundtracks': ['pop', 'classical', 'instrumental'],
      'Series Soundtracks': ['pop', 'instrumental'],
      'Childhood Theme Songs': ['children', 'pop'],
      'Action': ['instrumental', 'rock', 'electronic'],
      'National Anthem': ['classical', 'patriotic'],
      'Underground Artist': ['hiphop', 'alternative', 'indie']
    };

    const genres = themeGenreMap[theme] || ['pop'];
    const songs: Song[] = [];

    // Get songs for each genre
    for (const genre of genres) {
      const genreSongs = await this.youtubeService.searchMultipleSongs(genre, 3);
      songs.push(...genreSongs);
    }

    // Remove duplicates and return
    const uniqueSongs = songs.filter((song, index, self) => 
      index === self.findIndex(s => s.videoId === song.videoId)
    );

    return uniqueSongs.slice(0, Math.max(2, playerCount));
  }
}


