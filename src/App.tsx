import { useState } from 'react'
import { HomePage } from './components/HomePage'
import { Board } from './components/Board'
import { GameControls } from './components/GameControls'
import { HistoryList } from './components/HistoryList'
import { useGameStore } from './store/gameStore'
import type { GameMode, AIDifficulty } from './ai/types'
import './App.css'

type Page = 'home' | 'game' | 'history'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const { reset, setGameMode } = useGameStore()

  const handleStartGame = (mode: GameMode, difficulty?: AIDifficulty) => {
    reset()
    setGameMode(mode, difficulty)
    setCurrentPage('game')
    
    // 如果是AI模式且AI先手（白方），触发AI落子
    if (mode === 'ai' && difficulty) {
      // 玩家执黑，AI执白，黑方先手，所以不需要立即触发AI
      console.log(`开始${mode}模式游戏，难度: ${difficulty}`)
    }
  }

  const handleViewHistory = () => {
    setCurrentPage('history')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  if (currentPage === 'home') {
    return <HomePage onStartGame={handleStartGame} onViewHistory={handleViewHistory} />
  }

  if (currentPage === 'history') {
    return (
      <div className="app">
        <header className="app-header">
          <button className="back-btn" onClick={handleBackToHome}>
            ← 返回首页
          </button>
          <h1 className="app-title">历史记录</h1>
        </header>
        <HistoryList />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="back-btn" onClick={handleBackToHome}>
          ← 返回首页
        </button>
        <h1 className="app-title">欢迎来到 SkillGo</h1>
      </header>
      
      <main className="app-main">
        <Board />
        <GameControls />
      </main>
    </div>
  )
}

export default App
