// 游戏状态管理
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEngine } from '../core/GameEngine';
import type { GameState, PlayerInfo } from '../types';
import { storageService } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { AIOpponentController } from '../ai/AIOpponentController';
import type { GameMode, AIDifficulty } from '../ai/types';

interface GameStore extends GameState {
  engine: GameEngine;
  
  // AI相关状态
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  aiController: AIOpponentController | null;
  isAIThinking: boolean;
  aiReasoning?: string;
  
  // 操作方法
  placeStone: (x: number, y: number) => void;
  undo: () => void;
  reset: () => void;
  surrender: () => void;
  setPlayers: (black: PlayerInfo, white: PlayerInfo) => void;
  saveGame: () => Promise<void>;
  
  // AI相关方法
  setGameMode: (mode: GameMode, difficulty?: AIDifficulty) => void;
  triggerAIMove: () => Promise<void>;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => {
    const engine = new GameEngine();
    
    return {
      // 初始状态
      engine,
      board: engine.getBoard(),
      currentPlayer: engine.getCurrentPlayer(),
      moves: [],
      players: {
        black: { name: '黑方', color: 'black' },
        white: { name: '白方', color: 'white' },
      },
      status: 'playing',
      startTime: Date.now(),
      
      // AI相关初始状态
      gameMode: 'pvp',
      aiDifficulty: 'college',
      aiController: null,
      isAIThinking: false,
      aiReasoning: undefined,

      // 落子
      placeStone: (x: number, y: number) => {
        const state = get();
        if (state.status !== 'playing' || state.isAIThinking) {
          console.log('游戏已结束或AI正在思考');
          return;
        }

        const success = state.engine.placeStone(x, y);
        if (!success) return;

        // 播放音效
        audioService.playStoneSound();

        // 检查胜负
        const winResult = state.engine.checkWin();
        
        // 记录是否需要触发AI（在状态更新前判断）
        const isAIMode = state.gameMode === 'ai';
        const shouldTriggerAI = isAIMode && !winResult.winner && !winResult.isDraw;
        
        // 先切换玩家（在状态更新前）
        if (!winResult.winner && !winResult.isDraw) {
          state.engine.switchPlayer();
        }
        
        const nextPlayer = state.engine.getCurrentPlayer();
        
        set((draft) => {
          draft.board = state.engine.getBoard();
          draft.moves = state.engine.getMoves();
          
          if (winResult.winner || winResult.isDraw) {
            draft.status = 'finished';
            draft.result = winResult;
            
            if (winResult.winner) {
              audioService.playWinSound();
            }
          } else {
            draft.currentPlayer = nextPlayer;
          }
        });
        
        // AI模式下，如果轮到AI，触发AI落子
        if (shouldTriggerAI && nextPlayer === 'white') {
          console.log('🤖 轮到AI落子，当前玩家:', nextPlayer);
          setTimeout(() => {
            get().triggerAIMove();
          }, 300);
        }
      },

      // 悔棋
      undo: () => {
        const state = get();
        const success = state.engine.undo();
        
        if (success) {
          set((draft) => {
            draft.board = state.engine.getBoard();
            draft.moves = state.engine.getMoves();
            draft.currentPlayer = state.engine.getCurrentPlayer();
            draft.status = 'playing';
            draft.result = undefined;
          });
        }
      },

      // 重置游戏
      reset: () => {
        const state = get();
        state.engine.reset();
        
        set((draft) => {
          draft.board = state.engine.getBoard();
          draft.moves = [];
          draft.currentPlayer = 'black';
          draft.status = 'playing';
          draft.result = undefined;
          draft.startTime = Date.now();
        });
      },

      // 认输
      surrender: () => {
        const state = get();
        const winner = state.currentPlayer === 'black' ? 'white' : 'black';
        
        set((draft) => {
          draft.status = 'finished';
          draft.result = { winner };
        });
        
        console.log(`${state.currentPlayer}方认输`);
      },

      // 设置玩家信息
      setPlayers: (black: PlayerInfo, white: PlayerInfo) => {
        set((draft) => {
          draft.players.black = black;
          draft.players.white = white;
        });
      },

      // 保存对局
      saveGame: async () => {
        const state = get();
        
        if (state.status !== 'finished' || !state.result) {
          console.log('对局未结束，无法保存');
          return;
        }

        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const result = state.result.isDraw ? 'draw' : state.result.winner!;

        const gameRecord = {
          id: `game_${Date.now()}`,
          timestamp: Date.now(),
          players: state.players,
          moves: state.moves,
          result: result as 'black' | 'white' | 'draw',
          duration,
        };

        try {
          await storageService.saveGame(gameRecord);
          console.log('对局已保存');
        } catch (error) {
          console.error('保存对局失败:', error);
        }
      },
      
      // 设置游戏模式
      setGameMode: (mode: GameMode, difficulty?: AIDifficulty) => {
        set((draft) => {
          draft.gameMode = mode;
          
          if (mode === 'ai') {
            // 创建AI控制器
            if (!draft.aiController) {
              draft.aiController = new AIOpponentController();
            }
            
            if (difficulty) {
              draft.aiDifficulty = difficulty;
              draft.aiController.setDifficulty(difficulty);
            }
            
            // 设置玩家信息
            draft.players.black = { name: '玩家', color: 'black' };
            draft.players.white = { name: `AI(${draft.aiDifficulty})`, color: 'white' };
            
            console.log(`✅ AI模式已启用，难度: ${draft.aiDifficulty}`);
          } else {
            // PVP模式
            draft.players.black = { name: '黑方', color: 'black' };
            draft.players.white = { name: '白方', color: 'white' };
            
            console.log(`✅ PVP模式已启用`);
          }
        });
      },
      
      // 触发AI落子
      triggerAIMove: async () => {
        const state = get();
        
        if (state.gameMode !== 'ai' || !state.aiController || state.status !== 'playing') {
          return;
        }
        
        // 设置AI思考状态
        set((draft) => {
          draft.isAIThinking = true;
          draft.aiReasoning = undefined;
        });
        
        try {
          // 调用AI获取落子
          const aiMove = await state.aiController.makeMove(state.board, state.moves);
          
          // 更新AI推理信息
          set((draft) => {
            draft.aiReasoning = aiMove.reasoning;
          });
          
          // 执行AI落子
          const success = state.engine.placeStone(aiMove.x, aiMove.y);
          
          if (success) {
            audioService.playStoneSound();
            
            // 检查胜负
            const winResult = state.engine.checkWin();
            
            set((draft) => {
              draft.board = state.engine.getBoard();
              draft.moves = state.engine.getMoves();
              draft.isAIThinking = false;
              
              if (winResult.winner || winResult.isDraw) {
                draft.status = 'finished';
                draft.result = winResult;
                
                if (winResult.winner) {
                  audioService.playWinSound();
                }
              } else {
                // 切换回玩家
                state.engine.switchPlayer();
                draft.currentPlayer = state.engine.getCurrentPlayer();
              }
            });
          } else {
            set((draft) => {
              draft.isAIThinking = false;
            });
          }
        } catch (error) {
          console.error('AI落子失败:', error);
          set((draft) => {
            draft.isAIThinking = false;
          });
        }
      },
    };
  })
);
