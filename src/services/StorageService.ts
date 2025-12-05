// 数据持久化服务
import Dexie, { type Table } from 'dexie';
import type { GameRecord, GameSummary, Statistics } from '../types';

class GameDatabase extends Dexie {
  games!: Table<GameRecord, string>;

  constructor() {
    super('SkillGoDatabase');
    
    this.version(1).stores({
      games: 'id, timestamp, result, duration',
    });
  }
}

export class StorageService {
  private db: GameDatabase;

  constructor() {
    this.db = new GameDatabase();
  }

  // 保存对局
  async saveGame(game: GameRecord): Promise<string> {
    try {
      await this.db.games.put(game);
      console.log(`对局已保存，ID: ${game.id}`);
      return game.id;
    } catch (error) {
      console.error('保存对局失败:', error);
      throw error;
    }
  }

  // 加载对局
  async loadGame(id: string): Promise<GameRecord | undefined> {
    try {
      const game = await this.db.games.get(id);
      if (game) {
        console.log(`加载对局: ${id}`);
      } else {
        console.log(`未找到对局: ${id}`);
      }
      return game;
    } catch (error) {
      console.error('加载对局失败:', error);
      throw error;
    }
  }

  // 获取对局列表
  async listGames(filter?: {
    result?: 'black' | 'white' | 'draw';
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }): Promise<GameSummary[]> {
    try {
      let query = this.db.games.orderBy('timestamp').reverse();

      // 应用筛选
      if (filter?.result) {
        query = query.filter(game => game.result === filter.result);
      }
      if (filter?.startDate) {
        query = query.filter(game => game.timestamp >= filter.startDate!);
      }
      if (filter?.endDate) {
        query = query.filter(game => game.timestamp <= filter.endDate!);
      }

      // 分页
      if (filter?.offset) {
        query = query.offset(filter.offset);
      }
      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      const games = await query.toArray();

      // 转换为摘要格式
      return games.map(game => ({
        id: game.id,
        timestamp: game.timestamp,
        blackPlayer: game.players.black.name,
        whitePlayer: game.players.white.name,
        result: game.result,
        moves: game.moves.length,
        duration: game.duration,
      }));
    } catch (error) {
      console.error('获取对局列表失败:', error);
      throw error;
    }
  }

  // 删除对局
  async deleteGame(id: string): Promise<void> {
    try {
      await this.db.games.delete(id);
      console.log(`对局已删除: ${id}`);
    } catch (error) {
      console.error('删除对局失败:', error);
      throw error;
    }
  }

  // 导出对局（JSON格式）
  async exportGame(id: string): Promise<string> {
    try {
      const game = await this.loadGame(id);
      if (!game) {
        throw new Error('对局不存在');
      }
      return JSON.stringify(game, null, 2);
    } catch (error) {
      console.error('导出对局失败:', error);
      throw error;
    }
  }

  // 获取统计数据
  async getStatistics(): Promise<Statistics> {
    try {
      const games = await this.db.games.toArray();
      
      const totalGames = games.length;
      const blackWins = games.filter(g => g.result === 'black').length;
      const whiteWins = games.filter(g => g.result === 'white').length;
      const draws = games.filter(g => g.result === 'draw').length;
      
      const totalMoves = games.reduce((sum, g) => sum + g.moves.length, 0);
      const totalDuration = games.reduce((sum, g) => sum + g.duration, 0);
      
      return {
        totalGames,
        blackWins,
        whiteWins,
        draws,
        averageMoves: totalGames > 0 ? Math.round(totalMoves / totalGames) : 0,
        averageDuration: totalGames > 0 ? Math.round(totalDuration / totalGames) : 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  }

  // 清空所有数据
  async clearAll(): Promise<void> {
    try {
      await this.db.games.clear();
      console.log('所有对局数据已清空');
    } catch (error) {
      console.error('清空数据失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const storageService = new StorageService();
