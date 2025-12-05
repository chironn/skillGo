// 增强版本地五子棋引擎
// 提供完整的威胁检测、棋型识别和位置评估
import type { Board, Player, Position } from '../types';

export interface EnhancedMove extends Position {
  score: number;
  type: string;
  reasoning: string;
  confidence: number;
}

export class EnhancedGomokuAI {
  private readonly BOARD_SIZE = 15;
  
  // 棋型模式库（更完整的模式识别）
  private readonly PATTERNS = [
    { pattern: '11111', score: 1000000, name: '五连' },
    { pattern: '011110', score: 100000, name: '活四' },
    { pattern: '211110', score: 10000, name: '冲四-1' },
    { pattern: '011112', score: 10000, name: '冲四-2' },
    { pattern: '11011', score: 10000, name: '冲四-3' },
    { pattern: '10111', score: 10000, name: '冲四-4' },
    { pattern: '11101', score: 10000, name: '冲四-5' },
    { pattern: '011100', score: 5000, name: '活三-1' },
    { pattern: '001110', score: 5000, name: '活三-2' },
    { pattern: '011010', score: 5000, name: '活三-3' },
    { pattern: '010110', score: 5000, name: '活三-4' },
    { pattern: '211100', score: 500, name: '眠三-1' },
    { pattern: '001112', score: 500, name: '眠三-2' },
    { pattern: '11001', score: 500, name: '眠三-3' },
    { pattern: '10011', score: 500, name: '眠三-4' },
    { pattern: '10101', score: 500, name: '眠三-5' },
    { pattern: '001100', score: 200, name: '活二-1' },
    { pattern: '011000', score: 200, name: '活二-2' },
    { pattern: '000110', score: 200, name: '活二-3' },
    { pattern: '010100', score: 200, name: '活二-4' },
    { pattern: '001010', score: 200, name: '活二-5' },
  ];
  
  // 位置权重矩阵（中心位置更有价值）
  private readonly POSITION_WEIGHTS = this.generatePositionWeights();
  
  private generatePositionWeights(): number[][] {
    const weights: number[][] = [];
    const center = Math.floor(this.BOARD_SIZE / 2);
    
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      weights[y] = [];
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        const dx = Math.abs(x - center);
        const dy = Math.abs(y - center);
        const distance = Math.max(dx, dy);
        weights[y][x] = Math.max(0, 7 - distance);
      }
    }
    return weights;
  }
  
  /**
   * 获取最佳落子位置
   */
  getBestMove(board: Board, player: Player, difficulty: string = 'master'): EnhancedMove {
    const opponent = player === 'black' ? 'white' : 'black';
    
    // 1. 必胜检查
    const winMove = this.findWinningMove(board, player);
    if (winMove) {
      return { ...winMove, score: 1000000, type: 'winning', reasoning: '发现必胜位置', confidence: 1.0 };
    }
    
    // 2. 必防检查
    const defendWinMove = this.findWinningMove(board, opponent);
    if (defendWinMove) {
      return { ...defendWinMove, score: 900000, type: 'defend-win', reasoning: '防守对手必胜', confidence: 0.99 };
    }
    
    // 3. 己方活四
    const myLiveFour = this.findPatternMove(board, player, '011110');
    if (myLiveFour) {
      return { ...myLiveFour, score: 100000, type: 'live-four', reasoning: '形成活四', confidence: 0.95 };
    }
    
    // 4. 对手活四
    const opponentLiveFour = this.findPatternMove(board, opponent, '011110');
    if (opponentLiveFour) {
      return { ...opponentLiveFour, score: 90000, type: 'defend-live-four', reasoning: '防守对手活四', confidence: 0.95 };
    }
    
    // 5. 己方冲四
    const myBlockedFour = this.findBlockedFourMove(board, player);
    if (myBlockedFour && difficulty !== 'elementary') {
      return { ...myBlockedFour, score: 50000, type: 'blocked-four', reasoning: '形成冲四', confidence: 0.85 };
    }
    
    // 6. 对手冲四
    const opponentBlockedFour = this.findBlockedFourMove(board, opponent);
    if (opponentBlockedFour) {
      return { ...opponentBlockedFour, score: 45000, type: 'defend-blocked-four', reasoning: '防守对手冲四', confidence: 0.90 };
    }
    
    // 7. 双三机会
    if (difficulty === 'master') {
      const doubleThreat = this.findDoubleThreatMove(board, player);
      if (doubleThreat) {
        return { ...doubleThreat, score: 30000, type: 'double-threat', reasoning: '制造双重威胁', confidence: 0.80 };
      }
    }
    
    // 8. 综合评估
    const candidates = this.getCandidatePositions(board);
    let bestMove: EnhancedMove | null = null;
    
    for (const pos of candidates) {
      const score = this.evaluatePosition(board, pos.x, pos.y, player, difficulty);
      if (!bestMove || score > bestMove.score) {
        bestMove = { ...pos, score, type: 'evaluated', reasoning: `综合评分: ${score}`, confidence: 0.6 };
      }
    }
    
    // 9. 难度调整
    if (difficulty === 'elementary' && Math.random() < 0.3) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, candidates.length));
      return { ...candidates[randomIndex], score: 0, type: 'random', reasoning: '随机落子', confidence: 0.3 };
    }
    
    return bestMove || { x: 7, y: 7, score: 0, type: 'default', reasoning: '默认中心', confidence: 0.5 };
  }
  
  /**
   * 查找必胜位置
   */
  private findWinningMove(board: Board, player: Player): Position | null {
    // 创建board副本，避免修改只读数组
    const boardCopy = board.map(row => [...row]);
    
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (boardCopy[y][x] !== null) continue;
        boardCopy[y][x] = player;
        const isWin = this.checkWin(boardCopy, x, y);
        boardCopy[y][x] = null;
        if (isWin) return { x, y };
      }
    }
    return null;
  }
  
  /**
   * 检查是否获胜
   */
  private checkWin(board: Board, x: number, y: number): boolean {
    const player = board[y][x];
    if (!player) return false;
    
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      let count = 1;
      let nx = x + dx, ny = y + dy;
      while (this.isValid(nx, ny) && board[ny][nx] === player) {
        count++;
        nx += dx; ny += dy;
      }
      nx = x - dx; ny = y - dy;
      while (this.isValid(nx, ny) && board[ny][nx] === player) {
        count++;
        nx -= dx; ny -= dy;
      }
      if (count >= 5) return true;
    }
    return false;
  }
  
  /**
   * 查找特定模式的落子位置
   */
  private findPatternMove(board: Board, player: Player, pattern: string): Position | null {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (board[y][x] !== null) continue;
        for (const [dx, dy] of directions) {
          const linePattern = this.getLinePattern(board, x, y, dx, dy, player);
          if (linePattern.includes(pattern)) return { x, y };
        }
      }
    }
    return null;
  }
  
  /**
   * 查找冲四位置
   */
  private findBlockedFourMove(board: Board, player: Player): Position | null {
    const patterns = ['211110', '011112', '11011', '10111', '11101'];
    for (const pattern of patterns) {
      const move = this.findPatternMove(board, player, pattern);
      if (move) return move;
    }
    return null;
  }
  
  /**
   * 查找双重威胁位置
   */
  private findDoubleThreatMove(board: Board, player: Player): Position | null {
    // 创建board副本，避免修改只读数组
    const boardCopy = board.map(row => [...row]);
    
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (boardCopy[y][x] !== null) continue;
        boardCopy[y][x] = player;
        const threats = this.countThreats(boardCopy, x, y, player);
        boardCopy[y][x] = null;
        if (threats >= 2) return { x, y };
      }
    }
    return null;
  }
  
  /**
   * 统计威胁数量
   */
  private countThreats(board: Board, x: number, y: number, player: Player): number {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let threats = 0;
    for (const [dx, dy] of directions) {
      const pattern = this.getLinePattern(board, x, y, dx, dy, player);
      if (pattern.includes('01110') || pattern.includes('11110')) threats++;
    }
    return threats;
  }
  
  /**
   * 获取某方向的棋型模式
   */
  private getLinePattern(board: Board, x: number, y: number, dx: number, dy: number, player: Player): string {
    let pattern = '';
    for (let i = -4; i <= 4; i++) {
      const nx = x + i * dx, ny = y + i * dy;
      if (!this.isValid(nx, ny)) pattern += '2';
      else if (board[ny][nx] === player) pattern += '1';
      else if (board[ny][nx] === null) pattern += '0';
      else pattern += '2';
    }
    return pattern;
  }
  
  /**
   * 评估位置得分
   */
  evaluatePosition(board: Board, x: number, y: number, player: Player, difficulty: string = 'master'): number {
    const opponent = player === 'black' ? 'white' : 'black';
    let score = this.POSITION_WEIGHTS[y][x] * 10;
    
    // 创建board副本，避免修改只读数组
    const boardCopy = board.map(row => [...row]);
    
    boardCopy[y][x] = player;
    score += this.evaluatePatterns(boardCopy, x, y, player) * 1.5;
    boardCopy[y][x] = null;
    
    boardCopy[y][x] = opponent;
    score += this.evaluatePatterns(boardCopy, x, y, opponent) * 1.2;
    boardCopy[y][x] = null;
    
    score += this.evaluateConnectivity(board, x, y, player) * 5;
    
    if (difficulty === 'elementary') score *= 0.5;
    else if (difficulty === 'college') score *= 0.8;
    
    return score;
  }
  
  /**
   * 评估棋型得分
   */
  private evaluatePatterns(board: Board, x: number, y: number, player: Player): number {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let totalScore = 0;
    for (const [dx, dy] of directions) {
      const pattern = this.getLinePattern(board, x, y, dx, dy, player);
      for (const p of this.PATTERNS) {
        if (pattern.includes(p.pattern)) totalScore += p.score;
      }
    }
    return totalScore;
  }
  
  /**
   * 评估连接性得分
   */
  private evaluateConnectivity(board: Board, x: number, y: number, player: Player): number {
    let score = 0;
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (this.isValid(nx, ny) && board[ny][nx] === player) {
        score += 3;
        const nnx = x + dx * 2, nny = y + dy * 2;
        if (this.isValid(nnx, nny) && board[nny][nnx] === player) score += 5;
      }
    }
    return score;
  }
  
  /**
   * 获取候选位置
   */
  getCandidatePositions(board: Board): Position[] {
    const candidates = new Set<string>();
    let hasStone = false;
    
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        if (board[y][x] !== null) {
          hasStone = true;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx, ny = y + dy;
              if (this.isValid(nx, ny) && board[ny][nx] === null) {
                candidates.add(`${nx},${ny}`);
              }
            }
          }
        }
      }
    }
    
    if (!hasStone) {
      const center = Math.floor(this.BOARD_SIZE / 2);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          candidates.add(`${center + dx},${center + dy}`);
        }
      }
    }
    
    return Array.from(candidates).map(pos => {
      const [x, y] = pos.split(',').map(Number);
      return { x, y };
    });
  }
  
  /**
   * 检查位置是否有效
   */
  private isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.BOARD_SIZE && y >= 0 && y < this.BOARD_SIZE;
  }
}
