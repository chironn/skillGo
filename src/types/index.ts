// 核心类型定义

export type Stone = 'black' | 'white' | null;
export type Board = Stone[][];
export type Player = 'black' | 'white';

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  x: number;
  y: number;
  player: Player;
  timestamp: number;
  skillUsed?: string; // 技能预留
}

export interface PlayerInfo {
  name: string;
  color: Player;
  avatar?: string;
}

export interface WinResult {
  winner: Player | null;
  winningLine?: Position[];
  isDraw?: boolean;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  moves: Move[];
  players: {
    black: PlayerInfo;
    white: PlayerInfo;
  };
  status: 'playing' | 'finished' | 'paused';
  result?: WinResult;
  startTime: number;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  players: {
    black: PlayerInfo;
    white: PlayerInfo;
  };
  moves: Move[];
  result: 'black' | 'white' | 'draw';
  duration: number;
  openingType?: string;
}

export interface GameSummary {
  id: string;
  timestamp: number;
  blackPlayer: string;
  whitePlayer: string;
  result: 'black' | 'white' | 'draw';
  moves: number;
  duration: number;
}

export interface Statistics {
  totalGames: number;
  blackWins: number;
  whiteWins: number;
  draws: number;
  averageMoves: number;
  averageDuration: number;
}

// 技能系统预留接口
export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  targetType: 'self' | 'position' | 'stone';
  effect: SkillEffect;
  animation: string;
}

export interface SkillEffect {
  type: string;
  value: any;
}

export interface SkillSlot {
  skill: Skill | null;
  cooldownRemaining: number;
}

export interface ActiveSkill {
  skillId: string;
  activatedAt: number;
  target?: Position;
}
