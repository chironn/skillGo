// 游戏控制面板
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import './GameControls.css';

export const GameControls = () => {
  const { 
    currentPlayer, 
    status, 
    result, 
    moves, 
    gameMode, 
    aiDifficulty,
    isAIThinking,
    aiReasoning,
    undo, 
    reset, 
    surrender, 
    saveGame 
  } = useGameStore();

  const handleUndo = () => {
    if (window.confirm('确定要悔棋吗？')) {
      undo();
    }
  };

  const handleSurrender = () => {
    if (window.confirm('确定要认输吗？')) {
      surrender();
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重新开始吗？')) {
      reset();
    }
  };

  const handleSave = async () => {
    await saveGame();
    alert('对局已保存！');
  };

  return (
    <div className="game-controls">
      {/* 游戏模式显示 */}
      {gameMode === 'ai' && (
        <div className="game-mode-info">
          <span className="mode-badge">🤖 AI对战</span>
          <span className="difficulty-badge">
            {aiDifficulty === 'elementary' ? '🎓 小学生' : 
             aiDifficulty === 'college' ? '🎯 大学生' : '👑 大师'}
          </span>
        </div>
      )}
      
      {/* 当前状态 */}
      <div className="status-panel">
        {status === 'playing' ? (
          <>
            <div className="current-player">
              <div className={`player-indicator ${currentPlayer}`}>
                <div className="stone-preview" />
              </div>
              <span className="player-text">
                {currentPlayer === 'black' ? '黑方' : '白方'}回合
              </span>
            </div>
            
            {/* AI思考状态 */}
            {isAIThinking && (
              <motion.div
                className="ai-thinking"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="thinking-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <span className="thinking-text">AI思考中...</span>
              </motion.div>
            )}
            
            {/* AI推理显示 */}
            {aiReasoning && !isAIThinking && (
              <motion.div
                className="ai-reasoning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="reasoning-label">AI分析：</div>
                <div className="reasoning-text">{aiReasoning}</div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            className="game-result"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {result?.isDraw ? (
              <span className="result-text">和棋！</span>
            ) : (
              <span className="result-text">
                {result?.winner === 'black' ? '黑方' : '白方'}获胜！
              </span>
            )}
          </motion.div>
        )}
        
        <div className="move-count">
          第 {moves.length} 手
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="control-buttons">
        {status === 'playing' && (
          <>
            <button
              className="control-btn"
              onClick={handleUndo}
              disabled={moves.length === 0 || isAIThinking}
            >
              悔棋
            </button>
            <button
              className="control-btn danger"
              onClick={handleSurrender}
              disabled={isAIThinking}
            >
              认输
            </button>
          </>
        )}
        
        <button 
          className="control-btn" 
          onClick={handleReset}
          disabled={isAIThinking}
        >
          重新开始
        </button>
        
        {status === 'finished' && (
          <button className="control-btn primary" onClick={handleSave}>
            保存对局
          </button>
        )}
      </div>
    </div>
  );
};
