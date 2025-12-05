// 游戏引擎核心逻辑
import type { Board, Player, Move, WinResult, Position } from '../types';

export class GameEngine {
  private board: Board;
  private currentPlayer: Player;
  private moves: Move[];
  private readonly boardSize = 15;

  constructor() {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'black';
    this.moves = [];
  }

  // 创建空棋盘
  private createEmptyBoard(): Board {
    return Array(this.boardSize)
      .fill(null)
      .map(() => Array(this.boardSize).fill(null));
  }

  // 获取当前棋盘状态
  getBoard(): Board {
    return this.board.map(row => [...row]);
  }

  // 获取当前玩家
  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  // 获取历史步骤
  getMoves(): Move[] {
    return [...this.moves];
  }

  // 落子
  placeStone(x: number, y: number): boolean {
    // 检查位置是否合法
    if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) {
      console.log('落子位置超出棋盘范围');
      return false;
    }

    // 检查位置是否已有棋子
    if (this.board[y][x] !== null) {
      console.log('该位置已有棋子');
      return false;
    }

    // 落子
    this.board[y][x] = this.currentPlayer;
    
    // 记录步骤
    const move: Move = {
      x,
      y,
      player: this.currentPlayer,
      timestamp: Date.now(),
    };
    this.moves.push(move);

    console.log(`${this.currentPlayer}方落子于 (${x}, ${y})`);
    
    return true;
  }

  // 切换玩家
  switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
  }

  // 检查胜负
  checkWin(): WinResult {
    const lastMove = this.moves[this.moves.length - 1];
    if (!lastMove) {
      return { winner: null };
    }

    const { x, y, player } = lastMove;
    
    // 检查四个方向：横、竖、左斜、右斜
    const directions = [
      { dx: 1, dy: 0 },   // 横向
      { dx: 0, dy: 1 },   // 纵向
      { dx: 1, dy: 1 },   // 右斜
      { dx: 1, dy: -1 },  // 左斜
    ];

    for (const { dx, dy } of directions) {
      const line = this.getLine(x, y, dx, dy, player);
      if (line.length >= 5) {
        console.log(`${player}方获胜！`);
        return {
          winner: player,
          winningLine: line,
        };
      }
    }

    // 检查是否和棋（棋盘已满）
    if (this.moves.length === this.boardSize * this.boardSize) {
      console.log('和棋！');
      return {
        winner: null,
        isDraw: true,
      };
    }

    return { winner: null };
  }

  // 获取某个方向上的连续棋子
  private getLine(x: number, y: number, dx: number, dy: number, player: Player): Position[] {
    const line: Position[] = [{ x, y }];

    // 正方向搜索
    let nx = x + dx;
    let ny = y + dy;
    while (
      nx >= 0 && nx < this.boardSize &&
      ny >= 0 && ny < this.boardSize &&
      this.board[ny][nx] === player
    ) {
      line.push({ x: nx, y: ny });
      nx += dx;
      ny += dy;
    }

    // 反方向搜索
    nx = x - dx;
    ny = y - dy;
    while (
      nx >= 0 && nx < this.boardSize &&
      ny >= 0 && ny < this.boardSize &&
      this.board[ny][nx] === player
    ) {
      line.unshift({ x: nx, y: ny });
      nx -= dx;
      ny -= dy;
    }

    return line;
  }

  // 悔棋
  undo(): boolean {
    if (this.moves.length === 0) {
      console.log('没有可悔棋的步骤');
      return false;
    }

    const lastMove = this.moves.pop()!;
    this.board[lastMove.y][lastMove.x] = null;
    this.switchPlayer();
    
    console.log(`悔棋：撤销 (${lastMove.x}, ${lastMove.y})`);
    return true;
  }

  // 重置游戏
  reset(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'black';
    this.moves = [];
    console.log('游戏已重置');
  }

  // 从历史记录恢复游戏状态
  loadFromMoves(moves: Move[]): void {
    this.reset();
    for (const move of moves) {
      this.placeStone(move.x, move.y);
      this.switchPlayer();
    }
  }

  // 获取棋盘大小
  getBoardSize(): number {
    return this.boardSize;
  }
}
