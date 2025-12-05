/**
 * AI辅助面板组件
 * 提供AI提示、悔棋等辅助功能
 */

import { useGameStore } from '../store/gameStore';
import { aiProviderService } from '../services/AIProviderService';
import { useEffect, useState } from 'react';
import './AssistantPanel.css';

export const AssistantPanel = () => {
  const {
    gameMode,
    assistantEnabled,
    energy,
    maxEnergy,
    currentPlayer,
    isAIThinking,
    currentHint,
    toggleAssistant,
    requestHint,
    clearHint,
  } = useGameStore();

  // 获取当前AI提供商信息
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('');

  useEffect(() => {
    const provider = aiProviderService.getCurrentProvider();
    if (provider) {
      setCurrentProvider(provider.name);
      setCurrentModel(provider.model);
    } else {
      setCurrentProvider('本地引擎');
      setCurrentModel('');
    }
  }, [assistantEnabled]);

  // 仅在AI模式下显示
  if (gameMode !== 'ai') {
    return null;
  }

  // 能量消耗配置
  const energyCosts = {
    quick: 10,
    standard: 30,
    deep: 50,
  };

  const canRequestQuick = assistantEnabled && currentPlayer === 'black' && !isAIThinking && energy >= energyCosts.quick;
  const canRequestStandard = assistantEnabled && currentPlayer === 'black' && !isAIThinking && energy >= energyCosts.standard;
  const canRequestDeep = assistantEnabled && currentPlayer === 'black' && !isAIThinking && energy >= energyCosts.deep;

  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <div className="header-title">
          <h3>🎯 AI辅助</h3>
          {currentProvider && (
            <div className="ai-provider-info">
              <span className="provider-name">{currentProvider}</span>
              {currentModel && <span className="model-name">{currentModel}</span>}
            </div>
          )}
        </div>
        <label className="assistant-toggle">
          <input
            type="checkbox"
            checked={assistantEnabled}
            onChange={toggleAssistant}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {assistantEnabled && (
        <div className="assistant-content">
          {/* 能量显示 */}
          <div className="energy-display">
            <div className="energy-header">
              <span className="energy-icon">⚡</span>
              <span className="energy-text">能量</span>
              <span className="energy-value">{energy}/{maxEnergy}</span>
            </div>
            <div className="energy-bar">
              <div 
                className="energy-fill"
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 快速提示按钮 */}
          <button
            className={`assistant-btn hint-btn quick ${!canRequestQuick ? 'disabled' : ''}`}
            onClick={() => requestHint('quick')}
            disabled={!canRequestQuick}
            title="快速提示：显示最佳位置"
          >
            <span className="btn-icon">⚡</span>
            <span className="btn-text">快速提示</span>
            <span className="btn-badge">-{energyCosts.quick}</span>
          </button>

          {/* 标准提示按钮 */}
          <button
            className={`assistant-btn hint-btn standard ${!canRequestStandard ? 'disabled' : ''}`}
            onClick={() => requestHint('standard')}
            disabled={!canRequestStandard}
            title="标准提示：显示前3个推荐"
          >
            <span className="btn-icon">💡</span>
            <span className="btn-text">标准提示</span>
            <span className="btn-badge">-{energyCosts.standard}</span>
          </button>

          {/* 深度分析按钮 */}
          <button
            className={`assistant-btn hint-btn deep ${!canRequestDeep ? 'disabled' : ''}`}
            onClick={() => requestHint('deep')}
            disabled={!canRequestDeep}
            title="深度分析：完整局面评估"
          >
            <span className="btn-icon">🔍</span>
            <span className="btn-text">深度分析</span>
            <span className="btn-badge">-{energyCosts.deep}</span>
          </button>

          {/* 局面评估 */}
          {currentHint && (
            <div className="evaluation-panel">
              <div className="evaluation-header">
                <span>局面评估</span>
                <button className="close-btn" onClick={clearHint}>✕</button>
              </div>
              
              <div className="evaluation-score">
                <div className="score-bar">
                  <div 
                    className={`score-fill ${currentHint.evaluation.advantage}`}
                    style={{ 
                      width: `${Math.min(100, Math.abs(currentHint.evaluation.score) / 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="score-label">
                  {currentHint.evaluation.advantage === 'black' && '黑方优势'}
                  {currentHint.evaluation.advantage === 'white' && '白方优势'}
                  {currentHint.evaluation.advantage === 'equal' && '势均力敌'}
                </div>
              </div>

              {currentHint.evaluation.threat && (
                <div className="threat-alert">
                  ⚠️ {currentHint.evaluation.threat}
                </div>
              )}

              <div className="suggestions-list">
                {currentHint.suggestions.map((suggestion, index) => (
                  <div key={index} className={`suggestion-item ${suggestion.type}`}>
                    <div className="suggestion-rank">#{index + 1}</div>
                    <div className="suggestion-info">
                      <div className="suggestion-pos">
                        ({suggestion.position.x}, {suggestion.position.y})
                      </div>
                      <div className="suggestion-reason">{suggestion.reason}</div>
                    </div>
                    <div className="suggestion-type-badge">{
                      suggestion.type === 'attack' ? '进攻' :
                      suggestion.type === 'defense' ? '防守' : '布局'
                    }</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 使用提示 */}
          {!currentHint && (
            <div className="assistant-tips">
              <p>⚡ 快速提示(10能量)：最佳位置</p>
              <p>💡 标准提示(30能量)：前3推荐</p>
              <p>🔍 深度分析(50能量)：完整评估</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
