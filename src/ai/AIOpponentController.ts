// AI对手控制器
import type { Board, Move } from '../types';
import type { AIMove, AIDifficulty } from './types';
import { HybridAIController } from './HybridAIController';

export class AIOpponentController {
  private hybridController: HybridAIController;
  private difficulty: AIDifficulty = 'college';
  private abortController: AbortController | null = null;

  constructor() {
    // 初始化混合AI控制器
    // 检查是否配置了任何AI提供商
    const hasAIProvider = 
      import.meta.env?.VITE_KIMI_API_KEY ||
      import.meta.env?.VITE_NYXAR_API_KEY ||
      import.meta.env?.VITE_SILICONFLOW_API_KEY;
    
    console.log('🔧 初始化AI控制器');
    console.log('  AI增强:', hasAIProvider ? '已启用' : '纯本地模式');
    
    this.hybridController = new HybridAIController(hasAIProvider);
  }

  // 获取AI落子
  async makeMove(board: Board, history: Move[]): Promise<AIMove> {
    this.abortController = new AbortController();

    console.log(`🎮 AI(${this.difficulty})开始思考...`);
    console.log(`📍 当前棋盘状态: ${history.length}手`);

    try {
      // 使用混合AI控制器（自动处理本地/混合模式）
      this.hybridController.setDifficulty(this.difficulty);
      console.log('⏳ 调用HybridAIController.makeMove()...');
      
      const result = await this.hybridController.makeMove(board, history);
      
      console.log(`✅ AI决策完成: (${result.x}, ${result.y})`);
      return result;
    } catch (error) {
      console.error('❌ AI决策失败:', error);
      console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
      
      // 降级：返回中心位置
      console.log('🔄 使用降级策略');
      return {
        x: 7,
        y: 7,
        confidence: 0.3,
        reasoning: '降级处理',
      };
    }
  }

  // 设置难度
  setDifficulty(level: AIDifficulty): void {
    this.difficulty = level;
    this.hybridController.setDifficulty(level);
    console.log(`AI难度设置为: ${level}`);
  }

  // 获取当前难度
  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  // 取消思考
  cancelThinking(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('AI思考已取消');
    }
  }
  
  // 重置AI控制器（新游戏时调用）
  reset(): void {
    this.hybridController.reset();
    this.cancelThinking();
    console.log('🔄 AI对手控制器已重置');
  }
  
  // 获取性能统计
  getStats() {
    return this.hybridController.getStats();
  }
}
