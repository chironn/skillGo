/**
 * 提示覆盖层组件
 * 在棋盘上高亮显示AI建议的落子位置
 */

import { useGameStore } from '../store/gameStore';
import './HintOverlay.css';

interface HintOverlayProps {
  cellSize: number;
  boardSize: number;
}

export const HintOverlay = ({ cellSize }: HintOverlayProps) => {
  const { currentHint, showHintOverlay } = useGameStore();

  if (!showHintOverlay || !currentHint) {
    return null;
  }

  return (
    <div className="hint-overlay">
      {currentHint.suggestions.map((suggestion, index) => {
        const { x, y } = suggestion.position;
        // 与棋子坐标完全一致：cellSize / 2 + x * cellSize
        const centerX = cellSize / 2 + x * cellSize;
        const centerY = cellSize / 2 + y * cellSize;

        // 根据排名确定样式
        const rankClass = index === 0 ? 'best' : index === 1 ? 'second' : 'third';
        const label = index === 0 ? '推荐' : index === 1 ? '备选' : '可选';

        return (
          <div
            key={`${x}-${y}`}
            className={`hint-marker ${rankClass}`}
            style={{
              left: `${centerX}px`,
              top: `${centerY}px`,
            }}
          >
            <div className="hint-circle"></div>
            <div className="hint-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
};
