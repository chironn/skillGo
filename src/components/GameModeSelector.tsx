// 游戏模式选择组件
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameMode, AIDifficulty } from '../ai/types';
import './GameModeSelector.css';

interface GameModeSelectorProps {
  onSelect: (mode: GameMode, difficulty?: AIDifficulty) => void;
  onCancel: () => void;
}

export const GameModeSelector = ({ onSelect, onCancel }: GameModeSelectorProps) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('pvp');
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('college');

  const handleConfirm = () => {
    if (selectedMode === 'ai') {
      onSelect(selectedMode, selectedDifficulty);
    } else {
      onSelect(selectedMode);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="mode-selector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="mode-selector-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mode-selector-title">选择游戏模式</h2>

          {/* 模式选择 */}
          <div className="mode-options">
            <div
              className={`mode-card ${selectedMode === 'pvp' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('pvp')}
            >
              <div className="mode-icon">👥</div>
              <div className="mode-name">双人对战</div>
              <div className="mode-desc">与好友面对面对弈</div>
            </div>

            <div
              className={`mode-card ${selectedMode === 'ai' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('ai')}
            >
              <div className="mode-icon">🤖</div>
              <div className="mode-name">AI对战</div>
              <div className="mode-desc">挑战不同难度的AI</div>
            </div>
          </div>

          {/* AI难度选择 */}
          {selectedMode === 'ai' && (
            <motion.div
              className="difficulty-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="difficulty-title">选择AI难度</h3>
              <div className="difficulty-options">
                <div
                  className={`difficulty-card ${selectedDifficulty === 'elementary' ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty('elementary')}
                >
                  <div className="difficulty-icon">🎓</div>
                  <div className="difficulty-name">小学生</div>
                  <div className="difficulty-desc">适合初学者</div>
                  <ul className="difficulty-features">
                    <li>• 基础防守</li>
                    <li>• 简单进攻</li>
                    <li>• 偶尔失误</li>
                  </ul>
                </div>

                <div
                  className={`difficulty-card ${selectedDifficulty === 'college' ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty('college')}
                >
                  <div className="difficulty-icon">🎯</div>
                  <div className="difficulty-name">大学生</div>
                  <div className="difficulty-desc">有挑战性</div>
                  <ul className="difficulty-features">
                    <li>• 良好棋感</li>
                    <li>• 复杂战术</li>
                    <li>• 较少失误</li>
                  </ul>
                </div>

                <div
                  className={`difficulty-card ${selectedDifficulty === 'master' ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty('master')}
                >
                  <div className="difficulty-icon">👑</div>
                  <div className="difficulty-name">大师</div>
                  <div className="difficulty-desc">极具挑战</div>
                  <ul className="difficulty-features">
                    <li>• 深度计算</li>
                    <li>• 高级战术</li>
                    <li>• 几乎不败</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button className="action-btn secondary" onClick={onCancel}>
              取消
            </button>
            <button className="action-btn primary" onClick={handleConfirm}>
              开始游戏
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
