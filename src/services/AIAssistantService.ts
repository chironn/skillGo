/**
 * AI辅助服务
 * 为玩家提供实时对局辅助，包括AI提示、局面评估等功能
 */

import { EnhancedGomokuAI } from '../ai/EnhancedGomokuAI';
import type { Board, Player } from '../types';
import type { AIDifficulty } from '../ai/types';

// 提示建议
export interface HintSuggestion {
  position: { x: number; y: number };
  score: number;
  reason: string;
  type: 'attack' | 'defense' | 'strategy';
}

// 局面评估
export interface BoardEvaluation {
  score: number;
  advantage: 'black' | 'white' | 'equal';
  threat: string | null;
}

// 提示级别
export type HintLevel = 'quick' | 'standard' | 'deep';

// 提示结果
export interface HintResult {
  level: HintLevel;
  suggestions: HintSuggestion[];
  evaluation: BoardEvaluation;
  timestamp: number;
  energyCost: number;
}

// 能量系统配置
const INITIAL_ENERGY = 100;
const ENERGY_COSTS = {
  quick: 10,      // 快速提示
  standard: 30,   // 标准提示
  deep: 50,       // 深度分析
};

// 冷却配置
const COOLDOWNS = {
  quick: 0,       // 无冷却
  standard: 0,    // 无冷却
  deep: 3,        // 3步后才能再用
};

/**
 * AI辅助服务类 - 能量系统版本
 */
export class AIAssistantService {
  private aiEngine: EnhancedGomokuAI;
  private energy: number = INITIAL_ENERGY;
  private maxEnergy: number = INITIAL_ENERGY;
  private lastHintResult: HintResult | null = null;
  private currentDifficulty: AIDifficulty = 'college';
  private stepsSinceDeepHint: number = 0;
  private currentStep: number = 0;

  constructor() {
    this.aiEngine = new EnhancedGomokuAI();
  }

  /**
   * 初始化辅助服务
   */
  initialize(difficulty: AIDifficulty): void {
    this.currentDifficulty = difficulty;
    this.energy = INITIAL_ENERGY;
    this.maxEnergy = INITIAL_ENERGY;
    this.lastHintResult = null;
    this.stepsSinceDeepHint = 0;
    this.currentStep = 0;
    console.log(`🎯 AI辅助已初始化 - 难度:${difficulty}, 能量:${this.energy}点`);
  }

  /**
   * 步数增加（用于冷却计算）
   */
  incrementStep(): void {
    this.currentStep++;
    this.stepsSinceDeepHint++;
  }

  /**
   * 获取AI提示（支持不同级别）
   */
  async getHint(board: Board, currentPlayer: Player, level: HintLevel = 'standard'): Promise<HintResult> {
    const cost = ENERGY_COSTS[level];
    
    if (!this.canUseHint(level)) {
      if (this.energy < cost) {
        throw new Error(`能量不足，需要${cost}点，当前${this.energy}点`);
      }
      if (level === 'deep' && this.stepsSinceDeepHint < COOLDOWNS.deep) {
        throw new Error(`深度分析冷却中，还需${COOLDOWNS.deep - this.stepsSinceDeepHint}步`);
      }
    }

    console.log(`🔍 正在进行${level}级别分析...`);

    try {
      // 根据级别获取不同数量的建议
      const suggestionCount = level === 'quick' ? 1 : level === 'standard' ? 3 : 5;
      const suggestions = await this.analyzePosition(board, currentPlayer, suggestionCount);
      
      // 评估当前局面
      const evaluation = this.evaluateBoard(board, currentPlayer, suggestions);

      const result: HintResult = {
        level,
        suggestions,
        evaluation,
        timestamp: Date.now(),
        energyCost: cost,
      };

      this.lastHintResult = result;
      console.log(`✅ ${level}级别分析完成，消耗${cost}能量`);
      
      return result;
    } catch (error) {
      console.error('❌ 获取提示失败:', error);
      throw error;
    }
  }

  /**
   * 分析当前位置，获取多个建议
   */
  private async analyzePosition(board: Board, currentPlayer: Player, count: number = 3): Promise<HintSuggestion[]> {
    // 使用增强AI引擎获取最佳落子
    const bestMove = this.aiEngine.getBestMove(board, currentPlayer, this.currentDifficulty);
    
    // 构建建议列表
    const suggestions: HintSuggestion[] = [
      {
        position: { x: bestMove.x, y: bestMove.y },
        score: bestMove.score,
        reason: this.generateReason(bestMove.score, 0),
        type: this.determineType(bestMove.score),
      }
    ];

    // 如果需要更多建议，生成备选位置
    if (count > 1) {
      // TODO: 实现获取多个候选位置的逻辑
      // 目前简化处理，只返回最佳位置
      // 后续可以扩展为评估多个位置
    }
    
    return suggestions.slice(0, count);
  }

  /**
   * 评估整体局面
   */
  private evaluateBoard(_board: Board, currentPlayer: Player, suggestions: HintSuggestion[]): BoardEvaluation {
    if (suggestions.length === 0) {
      return {
        score: 0,
        advantage: 'equal',
        threat: null,
      };
    }

    const bestScore = suggestions[0].score;
    
    // 判断优势方
    let advantage: 'black' | 'white' | 'equal' = 'equal';
    if (bestScore > 1000) {
      advantage = currentPlayer;
    } else if (bestScore < -1000) {
      advantage = currentPlayer === 'black' ? 'white' : 'black';
    }

    // 检测威胁
    let threat: string | null = null;
    if (bestScore >= 100000) {
      threat = '必胜局面！';
    } else if (bestScore >= 50000) {
      threat = '发现活四，必须防守！';
    } else if (bestScore >= 10000) {
      threat = '发现冲四，需要防守';
    } else if (bestScore >= 5000) {
      threat = '发现活三，建议防守';
    }

    return {
      score: bestScore,
      advantage,
      threat,
    };
  }

  /**
   * 生成建议理由
   */
  private generateReason(score: number, rank: number): string {
    const prefix = rank === 0 ? '最佳选择' : rank === 1 ? '次优选择' : '备选方案';
    
    if (score >= 100000) {
      return `${prefix}：形成五连，直接获胜！`;
    } else if (score >= 50000) {
      return `${prefix}：形成活四，对手无法防守`;
    } else if (score >= 10000) {
      return `${prefix}：形成冲四或防守对手活四`;
    } else if (score >= 5000) {
      return `${prefix}：形成活三或防守对手冲四`;
    } else if (score >= 1000) {
      return `${prefix}：形成眠三或防守对手活三`;
    } else if (score >= 500) {
      return `${prefix}：占据关键位置，扩大优势`;
    } else {
      return `${prefix}：稳健发展，保持局面`;
    }
  }

  /**
   * 判断建议类型
   */
  private determineType(score: number): 'attack' | 'defense' | 'strategy' {
    if (score >= 5000) {
      return 'attack';
    } else if (score >= 1000) {
      return 'defense';
    } else {
      return 'strategy';
    }
  }

  /**
   * 使用提示（消耗能量）
   */
  useHint(level: HintLevel): void {
    const cost = ENERGY_COSTS[level];
    if (this.energy >= cost) {
      this.energy -= cost;
      if (level === 'deep') {
        this.stepsSinceDeepHint = 0;
      }
      console.log(`💡 使用${level}提示，消耗${cost}能量，剩余${this.energy}/${this.maxEnergy}`);
    }
  }

  /**
   * 检查是否可以使用提示
   */
  canUseHint(level: HintLevel): boolean {
    const cost = ENERGY_COSTS[level];
    const hasEnergy = this.energy >= cost;
    const notOnCooldown = level !== 'deep' || this.stepsSinceDeepHint >= COOLDOWNS.deep;
    return hasEnergy && notOnCooldown;
  }



  /**
   * 获取当前能量
   */
  getEnergy(): number {
    return this.energy;
  }

  /**
   * 获取最大能量
   */
  getMaxEnergy(): number {
    return this.maxEnergy;
  }

  /**
   * 获取能量消耗配置
   */
  getEnergyCosts() {
    return ENERGY_COSTS;
  }

  /**
   * 获取深度分析冷却剩余步数
   */
  getDeepHintCooldown(): number {
    const remaining = COOLDOWNS.deep - this.stepsSinceDeepHint;
    return Math.max(0, remaining);
  }

  /**
   * 获取上次提示结果
   */
  getLastHintResult(): HintResult | null {
    return this.lastHintResult;
  }

  /**
   * 清除提示结果
   */
  clearHint(): void {
    this.lastHintResult = null;
  }

  /**
   * 重置辅助服务
   */
  reset(difficulty?: AIDifficulty): void {
    if (difficulty) {
      this.initialize(difficulty);
    } else {
      this.initialize(this.currentDifficulty);
    }
  }
}

// 导出单例
export const aiAssistantService = new AIAssistantService();
