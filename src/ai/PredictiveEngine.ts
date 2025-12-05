/**
 * 预测引擎
 * 在用户思考时后台预测并计算AI应对
 */

import type { Board, Move, Player } from '../types';
import type { AIMove } from './types';
import { PredictionCache } from './PredictionCache';
import { EnhancedGomokuAI } from './EnhancedGomokuAI';
import type { HybridAIController } from './HybridAIController';

interface Position {
  x: number;
  y: number;
}

export class PredictiveEngine {
  private cache: PredictionCache;
  private localEngine: EnhancedGomokuAI;
  private aiController: HybridAIController | null = null;
  private isPredicting = false;
  
  constructor() {
    this.cache = new PredictionCache();
    this.localEngine = new EnhancedGomokuAI();
  }
  
  /**
   * 设置AI控制器（延迟初始化避免循环依赖）
   */
  setAIController(controller: HybridAIController): void {
    this.aiController = controller;
  }
  
  /**
   * 预测用户可能的落子位置
   */
  private predictUserMoves(board: Board, player: Player): Position[] {
    const candidates: Array<{pos: Position, score: number}> = [];
    
    // 获取候选位置（已有棋子周围3格内）
    const possibleMoves = this.getCandidatePositions(board);
    
    // 快速评分（不需要太精确）
    for (const pos of possibleMoves.slice(0, 20)) { // 限制评估数量
      const score = this.localEngine.evaluatePosition(
        board, 
        pos.x, 
        pos.y, 
        player,
        'master'
      );
      candidates.push({ pos, score });
    }
    
    // 返回得分最高的3个
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.pos);
  }
  
  /**
   * 后台预测（在用户思考时调用）
   */
  async startPrediction(board: Board, history: Move[]): Promise<void> {
    // 防止重复预测
    if (this.isPredicting) {
      console.log('⏸️ 已有预测任务在运行');
      return;
    }
    
    // 不在开局和残局预测
    if (history.length < 6 || history.length > 200) {
      return;
    }
    
    if (!this.aiController) {
      console.warn('⚠️ AI控制器未设置，跳过预测');
      return;
    }
    
    this.isPredicting = true;
    console.log('🔮 开始后台预测...');
    
    const currentPlayer: Player = history.length % 2 === 0 ? 'black' : 'white';
    const predictedMoves = this.predictUserMoves(board, currentPlayer);
    
    console.log(`📍 预测用户可能走: ${predictedMoves.map(p => `(${p.x},${p.y})`).join(', ')}`);
    
    // 并行计算AI对这3个位置的应对
    const predictions = predictedMoves.map(async (userMove) => {
      try {
        // 模拟用户落子
        const newBoard = this.simulateMove(board, userMove, currentPlayer);
        const newHistory = [...history, {
          x: userMove.x,
          y: userMove.y,
          player: currentPlayer,
          timestamp: Date.now()
        }];
        
        // 计算AI应对（这里会调用API，但不阻塞主线程）
        const aiMove = await this.aiController!.makeMove(newBoard, newHistory);
        
        // 存入缓存
        this.cache.set(newBoard, aiMove);
        
        console.log(`✅ 预测完成: 如果用户走(${userMove.x},${userMove.y}), AI应走(${aiMove.x},${aiMove.y})`);
        
      } catch (error) {
        console.error(`❌ 预测失败 (${userMove.x},${userMove.y}):`, error);
      }
    });
    
    // 等待所有预测完成
    await Promise.all(predictions);
    
    this.isPredicting = false;
    console.log('✅ 后台预测全部完成');
  }
  
  /**
   * 从缓存获取AI落子
   */
  getFromCache(board: Board): AIMove | null {
    return this.cache.get(board);
  }
  
  /**
   * 辅助：模拟落子
   */
  private simulateMove(board: Board, pos: Position, player: Player): Board {
    const newBoard = board.map(row => [...row]);
    newBoard[pos.y][pos.x] = player;
    return newBoard;
  }
  
  /**
   * 辅助：获取候选位置
   */
  private getCandidatePositions(board: Board): Position[] {
    const candidates = new Set<string>();
    
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x] !== null) {
          // 在已有棋子周围3格搜索
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === null) {
                candidates.add(`${nx},${ny}`);
              }
            }
          }
        }
      }
    }
    
    return Array.from(candidates).map(pos => {
      const [x, y] = pos.split(',').map(Number);
      return { x, y };
    });
  }
  
  /**
   * 清空缓存（新游戏）
   */
  reset(): void {
    this.cache.clear();
    this.isPredicting = false;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.cache.getStats(),
      isPredicting: this.isPredicting
    };
  }
}
