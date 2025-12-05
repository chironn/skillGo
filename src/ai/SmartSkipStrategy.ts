/**
 * 智能跳过策略
 * 判断何时可以跳过API调用，直接使用本地算法
 */

import type { Board, Move } from '../types';
import type { AIMove, AIDifficulty } from './types';

export class SmartSkipStrategy {
  private apiFailureRate = 0;
  private totalCalls = 0;
  private failedCalls = 0;
  
  /**
   * 判断是否应该跳过API调用
   */
  shouldSkipAPI(
    board: Board,
    history: Move[],
    localMove: AIMove,
    difficulty: AIDifficulty
  ): boolean {
    
    // 规则1：紧急情况（本地算法足够准确）
    if ('score' in localMove && (localMove as any).score >= 10000) {
      console.log('⚡️ 紧急情况，本地算法足够准确');
      return true;
    }
    
    // 规则2：本地算法非常确定
    if (localMove.confidence && localMove.confidence >= 0.95) {
      console.log('⚡️ 本地算法信心度>95%');
      return true;
    }
    
    // 规则3：开局阶段（用开局库）
    if (history.length < 10) {
      console.log('⚡️ 开局阶段，使用开局库');
      return true;
    }
    
    // 规则4：残局阶段（搜索空间小）
    const emptyCount = board.flat().filter(s => s === null).length;
    if (emptyCount < 30) {
      console.log('⚡️ 残局阶段，本地搜索足够');
      return true;
    }
    
    // 规则5：局面简单（没有复杂威胁）
    const threatLevel = this.analyzeThreatLevel(board);
    if (threatLevel === 'simple') {
      console.log('⚡️ 局面简单，无需深度分析');
      return true;
    }
    
    // 规则6：低难度模式
    if (difficulty === 'elementary') {
      console.log('⚡️ 低难度，本地算法即可');
      return true;
    }
    
    // 规则7：API不可用或超时过多
    if (this.apiFailureRate > 0.5) {
      console.log('⚠️ API不稳定，降级到本地');
      return true;
    }
    
    // 否则，需要API增强
    return false;
  }
  
  /**
   * 威胁等级分析
   */
  private analyzeThreatLevel(board: Board): 'simple' | 'medium' | 'complex' {
    const threats = {
      activeFour: 0,    // 活四
      blockedFour: 0,   // 冲四
      activeThree: 0,   // 活三
    };
    
    // 简化版威胁检测：统计连续棋子数量
    let maxConsecutive = 0;
    
    // 检查所有方向
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x]) {
          // 检查四个方向的连续数
          const directions = [
            [1, 0],  // 横
            [0, 1],  // 竖
            [1, 1],  // 斜
            [1, -1]  // 反斜
          ];
          
          for (const [dx, dy] of directions) {
            let count = 1;
            let nx = x + dx;
            let ny = y + dy;
            
            while (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && 
                   board[ny][nx] === board[y][x]) {
              count++;
              nx += dx;
              ny += dy;
            }
            
            maxConsecutive = Math.max(maxConsecutive, count);
            
            if (count >= 4) threats.activeFour++;
            else if (count === 3) threats.activeThree++;
          }
        }
      }
    }
    
    // 判断复杂度
    if (maxConsecutive >= 4 || threats.activeFour > 0) {
      return 'complex'; // 复杂局面
    }
    
    if (threats.activeThree > 2) {
      return 'medium'; // 中等复杂
    }
    
    return 'simple'; // 简单局面
  }
  
  /**
   * 记录API调用结果
   */
  recordAPIResult(success: boolean): void {
    this.totalCalls++;
    if (!success) {
      this.failedCalls++;
    }
    
    // 计算失败率（最近20次）
    if (this.totalCalls > 20) {
      this.apiFailureRate = this.failedCalls / Math.min(this.totalCalls, 20);
    } else {
      this.apiFailureRate = this.failedCalls / this.totalCalls;
    }
  }
  
  /**
   * 重置统计
   */
  reset(): void {
    this.apiFailureRate = 0;
    this.totalCalls = 0;
    this.failedCalls = 0;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalCalls: this.totalCalls,
      failedCalls: this.failedCalls,
      failureRate: this.apiFailureRate
    };
  }
}
