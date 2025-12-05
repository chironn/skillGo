// 棋盘组件
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import './Board.css';

export const Board = () => {
  const { board, placeStone, currentPlayer, status, gameMode, isAIThinking } = useGameStore();
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const boardSize = 15;
  const cellSize = 40;

  const handleCellClick = (x: number, y: number) => {
    if (status !== 'playing') return;
    
    // AI模式下，如果当前是AI回合（白方）或AI正在思考，禁止玩家落子
    if (gameMode === 'ai') {
      if (currentPlayer === 'white') {
        console.log('⚠️ 当前是AI回合，请等待AI落子');
        return;
      }
      if (isAIThinking) {
        console.log('⚠️ AI正在思考中，请稍候');
        return;
      }
    }
    
    placeStone(x, y);
  };

  const handleCellHover = (x: number, y: number) => {
    if (status !== 'playing' || board[y][x] !== null) return;
    
    // AI模式下，如果当前是AI回合或AI正在思考，不显示悬停预览
    if (gameMode === 'ai' && (currentPlayer === 'white' || isAIThinking)) {
      return;
    }
    
    setHoverPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  // 判断是否禁用棋盘交互
  const isBoardDisabled = gameMode === 'ai' && (currentPlayer === 'white' || isAIThinking);

  return (
    <div className={`board-container ${isBoardDisabled ? 'ai-active' : ''}`}>
      <svg
        width={cellSize * boardSize}
        height={cellSize * boardSize}
        className="board-svg"
        onMouseLeave={handleMouseLeave}
      >
        {/* 棋盘网格 */}
        {Array.from({ length: boardSize }).map((_, i) => (
          <g key={`grid-${i}`}>
            {/* 横线 */}
            <line
              x1={cellSize / 2}
              y1={cellSize / 2 + i * cellSize}
              x2={cellSize * boardSize - cellSize / 2}
              y2={cellSize / 2 + i * cellSize}
              stroke="currentColor"
              strokeWidth="1"
              className="grid-line"
            />
            {/* 竖线 */}
            <line
              x1={cellSize / 2 + i * cellSize}
              y1={cellSize / 2}
              x2={cellSize / 2 + i * cellSize}
              y2={cellSize * boardSize - cellSize / 2}
              stroke="currentColor"
              strokeWidth="1"
              className="grid-line"
            />
          </g>
        ))}

        {/* 星位 */}
        {[3, 7, 11].map((row) =>
          [3, 7, 11].map((col) => (
            <circle
              key={`star-${row}-${col}`}
              cx={cellSize / 2 + col * cellSize}
              cy={cellSize / 2 + row * cellSize}
              r="4"
              fill="currentColor"
              className="star-point"
            />
          ))
        )}

        {/* 交互区域 */}
        {Array.from({ length: boardSize }).map((_, y) =>
          Array.from({ length: boardSize }).map((_, x) => (
            <rect
              key={`cell-${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="transparent"
              className="cell-interactive"
              onClick={() => handleCellClick(x, y)}
              onMouseEnter={() => handleCellHover(x, y)}
            />
          ))
        )}

        {/* 悬停预览 */}
        {hoverPos && (
          <circle
            cx={cellSize / 2 + hoverPos.x * cellSize}
            cy={cellSize / 2 + hoverPos.y * cellSize}
            r="16"
            fill={currentPlayer === 'black' ? '#1C1C1E' : '#FFFFFF'}
            opacity="0.3"
            className="hover-stone"
          />
        )}

        {/* 棋子 */}
        {board.map((row, y) =>
          row.map((stone, x) =>
            stone ? (
              <motion.g
                key={`stone-${x}-${y}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <circle
                  cx={cellSize / 2 + x * cellSize}
                  cy={cellSize / 2 + y * cellSize}
                  r="16"
                  fill={stone === 'black' ? '#1C1C1E' : '#FFFFFF'}
                  stroke={stone === 'black' ? '#000' : '#ccc'}
                  strokeWidth="1"
                  className="stone"
                />
              </motion.g>
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
