import axios from 'axios';

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateHint(songTitle: string, artist?: string): Promise<string> {
    try {
      const prompt = `Generate a single word hint for the song "${songTitle}"${artist ? ` by ${artist}` : ''}. 
      The hint should be related to the song's theme, lyrics, or mood. 
      Return only the single word, no explanations.`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const hint = response.data.choices[0]?.message?.content?.trim();
      return hint || this.generateFallbackHint(songTitle);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.generateFallbackHint(songTitle);
    }
  }

  private generateFallbackHint(songTitle: string): string {
    // Extract meaningful words from song title
    const words = songTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => 
        word.length > 3 && 
        !['the', 'and', 'for', 'with', 'from', 'into', 'this', 'that', 'they', 'have', 'been', 'were'].includes(word)
      );

    if (words.length === 0) {
      // Fallback to generic music-related words
      const genericHints = ['melody', 'rhythm', 'beat', 'sound', 'music', 'song', 'tune', 'harmony'];
      return genericHints[Math.floor(Math.random() * genericHints.length)];
    }

    return words[Math.floor(Math.random() * words.length)];
  }

  // Alternative method using heuristics
  generateHeuristicHint(songTitle: string, artist?: string): string {
    const title = songTitle.toLowerCase();
    
    // Check for common themes
    if (title.includes('love') || title.includes('heart')) return 'love';
    if (title.includes('night') || title.includes('dark')) return 'night';
    if (title.includes('dream') || title.includes('sleep')) return 'dream';
    if (title.includes('fire') || title.includes('burn')) return 'fire';
    if (title.includes('water') || title.includes('sea') || title.includes('ocean')) return 'water';
    if (title.includes('sky') || title.includes('fly') || title.includes('bird')) return 'sky';
    if (title.includes('dance') || title.includes('move')) return 'dance';
    if (title.includes('star') || title.includes('moon')) return 'star';
    if (title.includes('rain') || title.includes('storm')) return 'rain';
    if (title.includes('road') || title.includes('way') || title.includes('path')) return 'road';

    // Extract first meaningful word
    const words = title.split(' ').filter(word => word.length > 2);
    if (words.length > 0) {
      return words[0];
    }

    return 'music';
  }
}


