/**
 * 开局库管理器
 * 提供常见开局定式，加速开局阶段
 */

import type { Move } from '../types';
import type { AIDifficulty } from './types';

interface Position {
  x: number;
  y: number;
}

interface OpeningMove {
  pos: Position;
  name: string;
  winRate: number;
  difficulty: string;
}

export class OpeningBookManager {
  private book: Map<string, OpeningMove[]> = new Map();
  private readonly maxDepth = 10; // 前10手使用开局库
  
  constructor() {
    this.loadOpeningBook();
  }
  
  /**
   * 生成局面特征
   */
  private getBoardSignature(history: Move[]): string {
    return history
      .map(m => `${m.player[0]}${m.x}${m.y}`)
      .join(',');
  }
  
  /**
   * 查询开局库
   */
  query(history: Move[]): OpeningMove[] | null {
    // 超过深度限制
    if (history.length >= this.maxDepth) {
      return null;
    }
    
    const signature = this.getBoardSignature(history);
    const moves = this.book.get(signature);
    
    if (moves) {
      console.log(`📖 开局库命中: ${signature} → ${moves.length}个选项`);
      return moves;
    }
    
    return null;
  }
  
  /**
   * 选择最佳开局
   */
  selectBestMove(
    moves: OpeningMove[],
    difficulty: AIDifficulty
  ): Position {
    if (moves.length === 0) {
      return { x: 7, y: 7 }; // 默认天元
    }
    
    // 根据难度选择
    if (difficulty === 'elementary') {
      // 随机选一个
      const index = Math.floor(Math.random() * moves.length);
      return moves[index].pos;
    }
    
    if (difficulty === 'college') {
      // 选胜率高的
      const sorted = [...moves].sort((a, b) => b.winRate - a.winRate);
      return sorted[0].pos;
    }
    
    if (difficulty === 'master') {
      // 选最难应对的
      const hardest = moves.find(m => m.difficulty === 'aggressive') || moves[0];
      return hardest.pos;
    }
    
    return moves[0].pos;
  }
  
  /**
   * 加载开局库
   */
  private loadOpeningBook(): void {
    // 第1手：黑方开局
    this.book.set('', [
      {
        pos: { x: 7, y: 7 },
        name: '天元开局',
        winRate: 0.52,
        difficulty: 'standard'
      },
      {
        pos: { x: 6, y: 6 },
        name: '星位开局',
        winRate: 0.51,
        difficulty: 'flexible'
      },
      {
        pos: { x: 8, y: 8 },
        name: '星位开局',
        winRate: 0.51,
        difficulty: 'flexible'
      }
    ]);
    
    // 第2手：白方应对天元
    this.book.set('b77', [
      {
        pos: { x: 6, y: 6 },
        name: '对角星',
        winRate: 0.52,
        difficulty: 'balanced'
      },
      {
        pos: { x: 8, y: 8 },
        name: '对角星',
        winRate: 0.52,
        difficulty: 'balanced'
      },
      {
        pos: { x: 6, y: 7 },
        name: '直接对攻',
        winRate: 0.50,
        difficulty: 'aggressive'
      },
      {
        pos: { x: 7, y: 6 },
        name: '直接对攻',
        winRate: 0.50,
        difficulty: 'aggressive'
      }
    ]);
    
    // 第3手：黑方继续（天元+对角星）
    this.book.set('b77,w66', [
      {
        pos: { x: 8, y: 8 },
        name: '对称布局',
        winRate: 0.53,
        difficulty: 'standard'
      },
      {
        pos: { x: 7, y: 6 },
        name: '垂直压制',
        winRate: 0.52,
        difficulty: 'aggressive'
      },
      {
        pos: { x: 6, y: 7 },
        name: '水平压制',
        winRate: 0.52,
        difficulty: 'aggressive'
      }
    ]);
    
    this.book.set('b77,w88', [
      {
        pos: { x: 6, y: 6 },
        name: '对称布局',
        winRate: 0.53,
        difficulty: 'standard'
      },
      {
        pos: { x: 7, y: 8 },
        name: '垂直压制',
        winRate: 0.52,
        difficulty: 'aggressive'
      }
    ]);
    
    // 第2手：白方应对星位(6,6)
    this.book.set('b66', [
      {
        pos: { x: 8, y: 8 },
        name: '对角应对',
        winRate: 0.51,
        difficulty: 'balanced'
      },
      {
        pos: { x: 7, y: 7 },
        name: '天元控制',
        winRate: 0.52,
        difficulty: 'standard'
      },
      {
        pos: { x: 6, y: 8 },
        name: '侧翼压制',
        winRate: 0.50,
        difficulty: 'aggressive'
      }
    ]);
    
    // 第3手：黑方继续（星位+天元）
    this.book.set('b66,w77', [
      {
        pos: { x: 8, y: 8 },
        name: '三角布局',
        winRate: 0.53,
        difficulty: 'standard'
      },
      {
        pos: { x: 5, y: 5 },
        name: '扩展星位',
        winRate: 0.51,
        difficulty: 'flexible'
      }
    ]);
    
    console.log(`📖 开局库已加载: ${this.book.size}个局面`);
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalPositions: this.book.size,
      maxDepth: this.maxDepth
    };
  }
}
