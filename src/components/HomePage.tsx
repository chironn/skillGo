// 首页组件
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameModeSelector } from './GameModeSelector';
import type { GameMode, AIDifficulty } from '../ai/types';
import './HomePage.css';

interface HomePageProps {
  onStartGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
  onViewHistory: () => void;
}

export const HomePage = ({ onStartGame, onViewHistory }: HomePageProps) => {
  const [showModeSelector, setShowModeSelector] = useState(false);

  const handleModeSelect = (mode: GameMode, difficulty?: AIDifficulty) => {
    setShowModeSelector(false);
    onStartGame(mode, difficulty);
  };

  return (
    <div className="home-page">
      <motion.div
        className="home-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="home-title">SkillGo</h1>
        <p className="home-subtitle">五子棋对弈</p>

        <div className="home-buttons">
          <motion.button
            className="home-btn primary"
            onClick={() => setShowModeSelector(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>

          <motion.button
            className="home-btn secondary"
            onClick={onViewHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            历史记录
          </motion.button>
        </div>
      </motion.div>

      {/* 模式选择弹窗 */}
      {showModeSelector && (
        <GameModeSelector onSelect={handleModeSelect} onCancel={() => setShowModeSelector(false)} />
      )}
    </div>
  );
};
