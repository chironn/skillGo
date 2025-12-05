// 历史记录列表组件
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GameSummary, Statistics } from '../types';
import { storageService } from '../services/StorageService';
import './HistoryList.css';

export const HistoryList = () => {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [gameList, statistics] = await Promise.all([
        storageService.listGames({ limit: 50 }),
        storageService.getStatistics(),
      ]);
      setGames(gameList);
      setStats(statistics);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这局对局吗？')) {
      try {
        await storageService.deleteGame(id);
        await loadHistory();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const handleExport = async (id: string) => {
    try {
      const json = await storageService.exportGame(id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game_${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  if (loading) {
    return <div className="history-loading">加载中...</div>;
  }

  return (
    <div className="history-container">
      {/* 统计面板 */}
      {stats && (
        <motion.div
          className="stats-panel"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="stats-title">对局统计</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalGames}</div>
              <div className="stat-label">总对局</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.blackWins}</div>
              <div className="stat-label">黑方胜</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.whiteWins}</div>
              <div className="stat-label">白方胜</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.draws}</div>
              <div className="stat-label">和棋</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 对局列表 */}
      <div className="games-list">
        <h2 className="list-title">历史对局</h2>
        {games.length === 0 ? (
          <div className="empty-state">暂无对局记录</div>
        ) : (
          games.map((game, index) => (
            <motion.div
              key={game.id}
              className="game-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="game-info">
                <div className="game-players">
                  <span className="player-name black">{game.blackPlayer}</span>
                  <span className="vs">VS</span>
                  <span className="player-name white">{game.whitePlayer}</span>
                </div>
                <div className="game-result">
                  {game.result === 'draw' ? '和棋' : 
                   game.result === 'black' ? '黑方胜' : '白方胜'}
                </div>
                <div className="game-meta">
                  <span>{game.moves} 手</span>
                  <span>{formatDuration(game.duration)}</span>
                  <span>{formatDate(game.timestamp)}</span>
                </div>
              </div>
              <div className="game-actions">
                <button
                  className="action-btn"
                  onClick={() => handleExport(game.id)}
                >
                  导出
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => handleDelete(game.id)}
                >
                  删除
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
