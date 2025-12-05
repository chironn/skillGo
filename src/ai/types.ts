// AI系统类型定义
import type { Position } from '../types';

export type AIDifficulty = 'elementary' | 'college' | 'master';

// AI决策结果
export interface AIMove {
  x: number;
  y: number;
  confidence: number; // 0-1，AI对这步棋的信心
  reasoning?: string; // AI的思考过程
  alternatives?: Position[]; // 备选位置
}

// 难度配置
export interface DifficultyConfig {
  level: AIDifficulty;
  temperature: number; // API temperature参数
  useLocalAlgorithm: boolean; // 是否混合本地算法
  localAlgorithmWeight: number; // 本地算法权重 0-1
  thinkingTimeRange: [number, number]; // 思考时间范围（毫秒）
  showReasoning: boolean; // 是否显示思考过程
  maxDepth?: number; // 搜索深度限制
}

// 游戏模式
export type GameMode = 'pvp' | 'ai';

// 游戏模式选择
export interface GameModeSelection {
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  playerSide?: 'black' | 'white'; // AI模式下玩家执子颜色
}
