// 混合AI控制器
// 结合本地算法和Kimi API，提供可靠且智能的AI对手
import type { Board, Move, Player } from '../types';
import type { AIMove, AIDifficulty } from './types';
import { EnhancedGomokuAI, type EnhancedMove } from './EnhancedGomokuAI';
import { KimiAPIService } from './KimiAPIService';
import { PromptBuilder } from './PromptBuilder';

interface DifficultyConfig {
  level: AIDifficulty;
  useKimi: boolean;
  kimiWeight: number; // Kimi AI的权重 0-1
  temperature: number;
  thinkingTimeRange: [number, number];
  localFailsafeEnabled: boolean; // 本地算法保底
}

export class HybridAIController {
  private localEngine: EnhancedGomokuAI;
  private kimiService: KimiAPIService | null = null;
  private difficulty: AIDifficulty = 'college';
  
  constructor(apiKey?: string, baseURL?: string) {
    this.localEngine = new EnhancedGomokuAI();
    
    // 如果提供了API Key，初始化Kimi服务
    if (apiKey) {
      try {
        this.kimiService = new KimiAPIService(apiKey, baseURL || 'https://api.kimi.com/coding');
        console.log('✅ Kimi API服务已启用');
      } catch (error) {
        console.warn('⚠️ Kimi API初始化失败，将使用纯本地模式:', error);
      }
    } else {
      console.log('ℹ️ 未配置Kimi API，使用纯本地模式');
    }
  }
  
  /**
   * 获取AI落子
   */
  async makeMove(board: Board, history: Move[]): Promise<AIMove> {
    const config = this.getDifficultyConfig(this.difficulty);
    const currentPlayer: Player = history.length % 2 === 0 ? 'black' : 'white';
    
    // 步骤1：本地算法计算（必须步骤）
    console.log('🔍 本地算法分析中...');
    const localMove = this.localEngine.getBestMove(board, currentPlayer, this.difficulty);
    console.log(`📊 本地建议: (${localMove.x},${localMove.y}) 分数:${localMove.score} 类型:${localMove.type}`);
    
    // 步骤2：紧急情况直接返回本地结果
    if (config.localFailsafeEnabled && localMove.score >= 10000) {
      console.log('⚠️ 检测到紧急情况，直接使用本地算法');
      await this.simulateThinking(config.thinkingTimeRange);
      return this.convertToAIMove(localMove, '本地');
    }
    
    // 步骤3：Kimi增强（如果启用且非紧急）
    if (config.useKimi && this.kimiService) {
      console.log('🤖 调用Kimi AI增强...');
      
      try {
        const systemPrompt = PromptBuilder.getSystemPrompt(this.difficulty);
        const userPrompt = this.buildEnhancedUserPrompt(board, history, localMove);
        
        console.log('📡 发送请求到Kimi API...');
        const kimiMove = await this.kimiService.requestMove(systemPrompt, userPrompt, config.temperature);
        
        if (kimiMove) {
          console.log(`🎯 Kimi建议: (${kimiMove.x},${kimiMove.y})`);
          
          // 步骤4：验证Kimi建议
          const isValid = this.validateMove(kimiMove, board, localMove);
          
          if (isValid) {
            // 步骤5：混合决策
            const finalMove = this.blendMoves(localMove, kimiMove, config.kimiWeight);
            console.log(`✅ 最终决策: (${finalMove.x},${finalMove.y}) [混合]`);
            await this.simulateThinking(config.thinkingTimeRange);
            return this.convertToAIMove(finalMove, '混合');
          } else {
            console.log('❌ Kimi建议未通过验证，使用本地算法');
          }
        } else {
          console.log('⚠️ Kimi API返回空结果，使用本地算法');
        }
      } catch (error) {
        console.error('❌ Kimi API调用异常:', error);
      }
    }
    
    // 步骤6：默认返回本地算法
    console.log(`✅ 最终决策: (${localMove.x},${localMove.y}) [本地]`);
    await this.simulateThinking(config.thinkingTimeRange);
    return this.convertToAIMove(localMove, '本地');
  }
  
  /**
   * 构建增强的用户提示（包含本地算法建议）
   */
  private buildEnhancedUserPrompt(board: Board, history: Move[], localSuggestion: EnhancedMove): string {
    const lastMove = history[history.length - 1];
    const currentPlayer: Player = lastMove ? (lastMove.player === 'black' ? 'white' : 'black') : 'black';
    const boardStr = this.serializeBoard(board);
    const recentMoves = history.slice(-8).map(m => `(${m.x},${m.y})-${m.player}`).join(', ');

    return `
# 当前局面（第${history.length + 1}手）

## 基本信息
- 执子方：${currentPlayer}
- 最近步骤：${recentMoves}
- 上一手：${lastMove ? `(${lastMove.x},${lastMove.y})` : '开局'}

## 棋盘状态
${boardStr}

## 本地算法建议
位置：(${localSuggestion.x}, ${localSuggestion.y})
类型：${localSuggestion.type}
评分：${localSuggestion.score}
理由：${localSuggestion.reasoning}

## 你的任务
1. 评估本地算法的建议是否合理
2. 从战略角度考虑是否有更好的选择
3. 如果本地算法建议是紧急防守（score > 10000），你应该同意或提供更紧急的位置
4. 给出你的建议和2个备选位置

立即输出JSON格式，不要有其他文字：
`;
  }
  
  /**
   * 序列化棋盘
   */
  private serializeBoard(board: Board): string {
    let result = '   ';
    for (let i = 0; i < 15; i++) result += String.fromCharCode(65 + i) + ' ';
    result += '\n';

    for (let y = 0; y < 15; y++) {
      result += (y + 1).toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < 15; x++) {
        const stone = board[y][x];
        result += (stone === 'black' ? '●' : stone === 'white' ? '○' : '+') + ' ';
      }
      result += '\n';
    }
    return result;
  }
  
  /**
   * 验证Kimi的决策是否合理
   */
  private validateMove(kimiMove: EnhancedMove, board: Board, localMove: EnhancedMove): boolean {
    const { x, y } = kimiMove;
    
    // 检查1：位置合法性
    if (x < 0 || x >= 15 || y < 0 || y >= 15 || board[y][x] !== null) {
      console.warn('❌ Kimi返回非法位置');
      return false;
    }
    
    // 检查2：不能走角落（低级错误）
    const corners = [[0, 0], [0, 14], [14, 0], [14, 14]];
    if (corners.some(([cx, cy]) => x === cx && y === cy)) {
      console.warn('❌ Kimi试图走角落');
      return false;
    }
    
    // 检查3：如果本地算法检测到必防（>10000分），Kimi必须在附近
    if (localMove.score >= 10000) {
      const distance = Math.max(Math.abs(x - localMove.x), Math.abs(y - localMove.y));
      if (distance > 2) {
        console.warn(`❌ Kimi忽略了紧急威胁（本地评分${localMove.score}）`);
        return false;
      }
    }
    
    // 检查4：位置不能太远离已有棋子（防止乱走）
    let nearStone = false;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] !== null) {
          nearStone = true;
          break;
        }
      }
      if (nearStone) break;
    }
    
    if (!nearStone && board.flat().some(s => s !== null)) {
      console.warn('❌ Kimi位置太远离棋局');
      return false;
    }
    
    return true;
  }
  
  /**
   * 混合两个决策
   */
  private blendMoves(localMove: EnhancedMove, kimiMove: EnhancedMove, kimiWeight: number): EnhancedMove {
    // 如果Kimi和本地算法建议相同，直接返回
    if (localMove.x === kimiMove.x && localMove.y === kimiMove.y) {
      return {
        ...localMove,
        confidence: Math.min(1.0, localMove.confidence + 0.1),
        reasoning: `本地算法和Kimi AI一致建议：${localMove.reasoning}`
      };
    }
    
    // 根据权重决定
    const useKimi = Math.random() < kimiWeight;
    
    if (useKimi) {
      return {
        ...kimiMove,
        type: 'kimi-enhanced',
        reasoning: `Kimi建议：${kimiMove.reasoning}（本地备选：${localMove.type}）`
      };
    } else {
      return {
        ...localMove,
        type: 'local-primary',
        reasoning: `${localMove.reasoning}（Kimi备选：(${kimiMove.x},${kimiMove.y})）`
      };
    }
  }
  
  /**
   * 转换为AIMove格式
   */
  private convertToAIMove(move: EnhancedMove, source: string): AIMove {
    return {
      x: move.x,
      y: move.y,
      confidence: move.confidence,
      reasoning: `[${source}] ${move.reasoning}`,
      alternatives: []
    };
  }
  
  /**
   * 获取难度配置
   */
  private getDifficultyConfig(level: AIDifficulty): DifficultyConfig {
    const configs: Record<AIDifficulty, DifficultyConfig> = {
      elementary: {
        level: 'elementary',
        useKimi: false,
        kimiWeight: 0,
        temperature: 1.0,
        thinkingTimeRange: [500, 1500],
        localFailsafeEnabled: true
      },
      college: {
        level: 'college',
        useKimi: true,
        kimiWeight: 0.3, // Kimi 30%影响
        temperature: 0.8,
        thinkingTimeRange: [1000, 2500],
        localFailsafeEnabled: true
      },
      master: {
        level: 'master',
        useKimi: true,
        kimiWeight: 0.4, // Kimi 40%影响
        temperature: 0.5,
        thinkingTimeRange: [2000, 4000],
        localFailsafeEnabled: true
      }
    };
    
    return configs[level];
  }
  
  /**
   * 模拟思考时间
   */
  private async simulateThinking(range: [number, number]): Promise<void> {
    const [min, max] = range;
    const time = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, time));
  }
  
  /**
   * 设置难度
   */
  setDifficulty(level: AIDifficulty): void {
    this.difficulty = level;
    console.log(`🎮 难度设置为: ${level}`);
  }
  
  /**
   * 获取当前难度
   */
  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }
}
