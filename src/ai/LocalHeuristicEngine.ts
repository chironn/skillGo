// 本地启发式算法引擎
import type { Board, Player, Position } from '../types';

export class LocalHeuristicEngine {
  private readonly boardSize = 15;

  // 局面评估函数
  evaluateBoard(board: Board, player: Player): number {
    let score = 0;

    // 评估所有可能的位置
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === null) {
          score += this.evaluatePosition(board, x, y, player);
        }
      }
    }

    return score;
  }

  // 单点位置评估
  evaluatePosition(board: Board, x: number, y: number, player: Player): number {
    let score = 0;
    const directions = [
      [1, 0], // 横向
      [0, 1], // 纵向
      [1, 1], // 主对角
      [1, -1], // 副对角
    ];

    for (const [dx, dy] of directions) {
      const pattern = this.getPattern(board, x, y, dx, dy, player);
      score += this.patternScore(pattern);
    }

    return score;
  }

  // 模式识别与评分
  private patternScore(pattern: string): number {
    const scores: Record<string, number> = {
      '11111': 100000, // 五连
      '011110': 10000, // 活四
      '11110': 1000, // 冲四
      '01110': 1000, // 活三
      '11100': 100, // 眠三
      '01100': 100, // 活二
      '11000': 10, // 眠二
    };

    for (const [pat, score] of Object.entries(scores)) {
      if (pattern.includes(pat)) return score;
    }
    return 0;
  }

  // 获取某方向的棋型模式
  private getPattern(
    board: Board,
    x: number,
    y: number,
    dx: number,
    dy: number,
    player: Player
  ): string {
    let pattern = '';
    for (let i = -4; i <= 4; i++) {
      const nx = x + i * dx;
      const ny = y + i * dy;
      if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) {
        pattern += '2'; // 边界
      } else if (board[ny][nx] === player) {
        pattern += '1'; // 己方
      } else if (board[ny][nx] === null) {
        pattern += '0'; // 空位
      } else {
        pattern += '2'; // 对方
      }
    }
    return pattern;
  }

  // 获取最佳落子位置（本地算法）
  getBestMove(board: Board, player: Player): Position {
    let bestScore = -Infinity;
    let bestMove: Position = { x: 7, y: 7 };
    const opponentPlayer = player === 'black' ? 'white' : 'black';

    // 第一步：检查是否有必须防守的点（对手冲四或活四）
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === null) {
          const opponentScore = this.evaluatePosition(board, x, y, opponentPlayer);
          // 对手能形成活四或冲四，必须防守
          if (opponentScore >= 1000) {
            console.log(`检测到对手威胁，必须防守: (${x}, ${y}), 威胁值: ${opponentScore}`);
            return { x, y };
          }
        }
      }
    }

    // 第二步：检查是否有必胜点（己方能形成活四）
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === null) {
          const myScore = this.evaluatePosition(board, x, y, player);
          // 己方能形成活四，直接进攻
          if (myScore >= 10000) {
            console.log(`发现必胜点: (${x}, ${y}), 评分: ${myScore}`);
            return { x, y };
          }
        }
      }
    }

    // 第三步：综合评估所有位置
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === null) {
          const myScore = this.evaluatePosition(board, x, y, player);
          const opponentScore = this.evaluatePosition(board, x, y, opponentPlayer);

          // 边角惩罚：距离中心越远，惩罚越大
          const centerX = 7;
          const centerY = 7;
          const distanceFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
          const positionPenalty = distanceFromCenter > 6 ? -500 : 0;

          // 综合评分：己方得分 + 对手威胁 * 1.2（防守优先） + 位置惩罚
          const totalScore = myScore + opponentScore * 1.2 + positionPenalty;

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMove = { x, y };
          }
        }
      }
    }

    console.log(`本地算法推荐: (${bestMove.x}, ${bestMove.y}), 评分: ${bestScore}`);
    return bestMove;
  }

  // 获取候选位置（剪枝优化）
  getCandidatePositions(board: Board, radius: number = 3): Position[] {
    const candidates = new Set<string>();

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] !== null) {
          // 在已有棋子周围搜索
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (
                nx >= 0 &&
                nx < this.boardSize &&
                ny >= 0 &&
                ny < this.boardSize &&
                board[ny][nx] === null
              ) {
                candidates.add(`${nx},${ny}`);
              }
            }
          }
        }
      }
    }

    // 如果是开局，添加中心区域
    if (candidates.size === 0) {
      for (let i = 5; i < 10; i++) {
        for (let j = 5; j < 10; j++) {
          candidates.add(`${i},${j}`);
        }
      }
    }

    return Array.from(candidates).map((pos) => {
      const [x, y] = pos.split(',').map(Number);
      return { x, y };
    });
  }

  // 检测威胁（活三、冲四等）
  detectThreats(board: Board, player: Player): Position[] {
    const threats: Position[] = [];

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === null) {
          const score = this.evaluatePosition(board, x, y, player);
          // 如果评分超过1000，说明是重要威胁点
          if (score >= 1000) {
            threats.push({ x, y });
          }
        }
      }
    }

    return threats;
  }
}
