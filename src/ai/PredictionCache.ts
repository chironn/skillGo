/**
 * 预测缓存管理器
 * 用于缓存AI预测结果，提升响应速度
 */

import type { Board } from '../types';
import type { AIMove } from './types';

interface CachedPrediction {
  move: AIMove;
  timestamp: number;
  confidence: number;
}

export class PredictionCache {
  private cache: Map<string, CachedPrediction> = new Map();
  private readonly maxSize = 50; // 最多缓存50个局面
  private readonly ttl = 30000;  // 缓存30秒过期
  
  /**
   * 生成棋盘哈希（只记录有子位置）
   */
  private getBoardHash(board: Board): string {
    const stones: string[] = [];
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x]) {
          stones.push(`${board[y][x]![0]}${x}${y}`);
        }
      }
    }
    return stones.join(',');
  }
  
  /**
   * 存入缓存
   */
  set(board: Board, move: AIMove): void {
    const hash = this.getBoardHash(board);
    
    // LRU淘汰：超过容量删除最旧的
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(hash, {
      move,
      timestamp: Date.now(),
      confidence: move.confidence || 0.5
    });
    
    console.log(`💾 缓存预测结果: ${hash.slice(0, 30)}...`);
  }
  
  /**
   * 查询缓存
   */
  get(board: Board): AIMove | null {
    const hash = this.getBoardHash(board);
    const cached = this.cache.get(hash);
    
    if (!cached) return null;
    
    // 检查是否过期
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(hash);
      console.log('⏰ 缓存已过期');
      return null;
    }
    
    console.log(`🎯 命中预测缓存！(${age}ms前)`);
    return cached.move;
  }
  
  /**
   * 清空缓存（新游戏时）
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ 预测缓存已清空');
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}
