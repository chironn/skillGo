// 混合AI控制器
// 结合本地算法和多个AI API，提供可靠且智能的AI对手
import type { Board, Move, Player } from '../types';
import type { AIMove, AIDifficulty } from './types';
import { EnhancedGomokuAI, type EnhancedMove } from './EnhancedGomokuAI';
import { PromptBuilder } from './PromptBuilder';
import { aiProviderService } from '../services/AIProviderService';
import { PredictiveEngine } from './PredictiveEngine';
import { SmartSkipStrategy } from './SmartSkipStrategy';
import { OpeningBookManager } from './OpeningBookManager';
import { TimeoutController } from './TimeoutController';
import { FallbackStrategy } from './FallbackStrategy';

interface DifficultyConfig {
  level: AIDifficulty;
  useAI: boolean; // 是否使用AI增强
  aiWeight: number; // AI的权重 0-1
  temperature: number;
  thinkingTimeRange: [number, number];
  localFailsafeEnabled: boolean; // 本地算法保底
}

export class HybridAIController {
  private localEngine: EnhancedGomokuAI;
  private useAIEnhancement: boolean = false;
  private difficulty: AIDifficulty = 'college';
  
  // 优化模块
  private predictiveEngine: PredictiveEngine;
  private skipStrategy: SmartSkipStrategy;
  private openingBook: OpeningBookManager;
  private timeoutController: TimeoutController;
  private fallbackStrategy: FallbackStrategy;
  
  // 缓存标志：避免重复测试提供商
  private static providersTested = false;
  
  constructor(enableAI?: boolean) {
    this.localEngine = new EnhancedGomokuAI();
    
    // 初始化优化模块
    this.predictiveEngine = new PredictiveEngine();
    this.skipStrategy = new SmartSkipStrategy();
    this.openingBook = new OpeningBookManager();
    this.timeoutController = new TimeoutController();
    this.fallbackStrategy = new FallbackStrategy();
    
    // 设置预测引擎的AI控制器引用（避免循环依赖）
    this.predictiveEngine.setAIController(this);
    
    // 初始化AI提供商服务（只测试一次）
    if (import.meta.env.DEV && !HybridAIController.providersTested) {
      HybridAIController.providersTested = true;
      aiProviderService.testAllProviders().catch(console.error);
    }
    
    // 启用AI增强
    if (enableAI) {
      this.useAIEnhancement = true;
      console.log('✅ AI增强服务已启用');
    } else {
      console.log('ℹ️ 未配置AI API，使用纯本地模式');
    }
  }
  
  /**
   * 获取AI落子（优化版：集成预测、跳过、开局库等）
   */
  async makeMove(board: Board, history: Move[]): Promise<AIMove> {
    const startTime = Date.now();
    const config = this.getDifficultyConfig(this.difficulty);
    const currentPlayer: Player = history.length % 2 === 0 ? 'black' : 'white';
    
    // ===== 优化1：开局库查询 (0.001秒) =====
    const openingMoves = this.openingBook.query(history);
    if (openingMoves) {
      const pos = this.openingBook.selectBestMove(openingMoves, this.difficulty);
      console.log(`📖 使用开局库: (${pos.x}, ${pos.y})`);
      
      const elapsed = Date.now() - startTime;
      console.log(`⚡️ 总耗时: ${elapsed}ms`);
      
      return {
        x: pos.x,
        y: pos.y,
        confidence: 1.0,
        reasoning: `开局定式: ${openingMoves[0].name}`,
        alternatives: []
      };
    }
    
    // ===== 优化2：预测缓存查询 (0.1秒) =====
    const cachedMove = this.predictiveEngine.getFromCache(board);
    if (cachedMove) {
      console.log('🎯 预测缓存命中！');
      
      // 启动下一轮预测（为下下步准备）
      this.predictiveEngine.startPrediction(board, history).catch(console.error);
      
      const elapsed = Date.now() - startTime;
      console.log(`⚡️ 总耗时: ${elapsed}ms`);
      
      return cachedMove;
    }
    
    // ===== 步骤1：本地算法计算（必须步骤）=====
    console.log('🔍 本地算法分析中...');
    const localMove = this.localEngine.getBestMove(board, currentPlayer, this.difficulty);
    console.log(`📊 本地建议: (${localMove.x},${localMove.y}) 分数:${localMove.score} 类型:${localMove.type}`);
    
    // ===== 优化3：智能跳过判断 =====
    const shouldSkip = this.skipStrategy.shouldSkipAPI(board, history, localMove, this.difficulty);
    
    if (shouldSkip || !config.useAI || !this.useAIEnhancement) {
      if (shouldSkip) {
        console.log('⚡️ 智能跳过API，使用本地结果');
      }
      
      // 启动后台预测
      this.predictiveEngine.startPrediction(board, history).catch(console.error);
      
      const elapsed = Date.now() - startTime;
      console.log(`⚡️ 总耗时: ${elapsed}ms`);
      
      await this.simulateThinking(config.thinkingTimeRange);
      return this.convertToAIMove(localMove, '本地');
    }
    
    // ===== 步骤2：AI增强（带超时和降级）=====
    const provider = aiProviderService.getCurrentProvider();
    const providerName = provider?.name || 'AI';
    console.log(`🤖 调用${providerName}增强...`);
    
    try {
      // 检查是否应该直接降级
      if (this.fallbackStrategy.shouldFallback()) {
        console.warn('⚠️ API连续失败，直接使用本地算法');
        this.skipStrategy.recordAPIResult(false);
        
        const elapsed = Date.now() - startTime;
        console.log(`⚡️ 总耗时（降级）: ${elapsed}ms`);
        
        return this.convertToAIMove(localMove, '本地');
      }
      
      const systemPrompt = PromptBuilder.getSystemPrompt(this.difficulty);
      const userPrompt = this.buildEnhancedUserPrompt(board, history, localMove);
      
      console.log(`📡 发送请求到${providerName}...`);
      
      // ===== 优化4：超时控制 =====
      const timeout = this.timeoutController.getAdaptiveTimeout();
      console.log(`⏱️ 超时设置: ${timeout}ms`);
      
      const aiMovePromise = this.requestAIMove(systemPrompt, userPrompt, config.temperature);
      const aiMove = await this.timeoutController.executeWithTimeout(
        aiMovePromise,
        timeout,
        null // 超时返回null
      );
      
      if (aiMove) {
        console.log(`🎯 ${providerName}建议: (${aiMove.x},${aiMove.y})`);
        
        // 验证AI建议
        const isValid = this.validateMove(aiMove, board, localMove);
        
        if (isValid) {
          // 记录成功
          this.skipStrategy.recordAPIResult(true);
          this.fallbackStrategy.recordResult(true);
          
          // 混合决策
          const finalMove = this.blendMoves(localMove, aiMove, config.aiWeight);
          console.log(`✅ 最终决策: (${finalMove.x},${finalMove.y}) [混合]`);
          
          // 启动后台预测
          this.predictiveEngine.startPrediction(board, history).catch(console.error);
          
          const elapsed = Date.now() - startTime;
          console.log(`⚡️ 总耗时: ${elapsed}ms`);
          
          await this.simulateThinking(config.thinkingTimeRange);
          return this.convertToAIMove(finalMove, '混合');
        } else {
          console.log(`❌ ${providerName}建议未通过验证，使用本地算法`);
          this.skipStrategy.recordAPIResult(false);
          this.fallbackStrategy.recordResult(false);
        }
      } else {
        console.log(`⚠️ ${providerName}超时或返回空结果，使用本地算法`);
        this.skipStrategy.recordAPIResult(false);
        this.fallbackStrategy.recordResult(false);
      }
    } catch (error) {
      console.error(`❌ ${providerName}调用异常:`, error);
      this.skipStrategy.recordAPIResult(false);
      this.fallbackStrategy.recordResult(false);
    }
    
    // ===== 步骤3：默认返回本地算法 =====
    console.log(`✅ 最终决策: (${localMove.x},${localMove.y}) [本地]`);
    
    // 启动后台预测
    this.predictiveEngine.startPrediction(board, history).catch(console.error);
    
    const elapsed = Date.now() - startTime;
    console.log(`⚡️ 总耗时: ${elapsed}ms`);
    
    await this.simulateThinking(config.thinkingTimeRange);
    return this.convertToAIMove(localMove, '本地');
  }
  
  /**
   * 请求AI提供商的落子建议
   */
  private async requestAIMove(systemPrompt: string, userPrompt: string, temperature: number): Promise<EnhancedMove | null> {
    try {
      // 调用AI提供商服务
      const response = await aiProviderService.callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature,
        max_tokens: 1000
      });

      // 解析响应
      if (response?.choices?.[0]?.message?.content) {
        const content = response.choices[0].message.content;
        return this.parseAIResponse(content);
      }

      return null;
    } catch (error) {
      console.error('AI请求失败:', error);
      return null;
    }
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(content: string): EnhancedMove | null {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (!parsed.move || typeof parsed.move.x !== 'number' || typeof parsed.move.y !== 'number') {
        throw new Error('无效的响应格式');
      }
      
      return {
        x: parsed.move.x,
        y: parsed.move.y,
        score: 0,
        type: 'ai',
        reasoning: parsed.reasoning || 'AI决策',
        confidence: parsed.confidence || 0.7
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return null;
    }
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
3. 如果本地算法建议是紧急防守（score > 50000），你应该同意或提供更紧急的位置
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
    
    // 检查3：如果本地算法检测到必防（>50000分），Kimi必须在附近
    if (localMove.score >= 50000) {
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
  private blendMoves(localMove: EnhancedMove, aiMove: EnhancedMove, aiWeight: number): EnhancedMove {
    // 如果AI和本地算法建议相同，直接返回
    if (localMove.x === aiMove.x && localMove.y === aiMove.y) {
      return {
        ...localMove,
        confidence: Math.min(1.0, localMove.confidence + 0.1),
        reasoning: `本地算法和AI一致建议：${localMove.reasoning}`
      };
    }
    
    // 根据权重决定
    const useAI = Math.random() < aiWeight;
    
    if (useAI) {
      return {
        ...aiMove,
        type: 'ai-enhanced',
        reasoning: `AI建议：${aiMove.reasoning}（本地备选：${localMove.type}）`
      };
    } else {
      return {
        ...localMove,
        type: 'local-primary',
        reasoning: `${localMove.reasoning}（AI备选：(${aiMove.x},${aiMove.y})）`
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
        useAI: false,
        aiWeight: 0,
        temperature: 1.0,
        thinkingTimeRange: [500, 1500],
        localFailsafeEnabled: true
      },
      college: {
        level: 'college',
        useAI: true,
        aiWeight: 0.3, // AI 30%影响
        temperature: 0.8,
        thinkingTimeRange: [1000, 2500],
        localFailsafeEnabled: true
      },
      master: {
        level: 'master',
        useAI: true,
        aiWeight: 0.4, // AI 40%影响
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
  
  /**
   * 重置所有优化模块（新游戏时调用）
   */
  reset(): void {
    this.predictiveEngine.reset();
    this.skipStrategy.reset();
    this.timeoutController.reset();
    this.fallbackStrategy.reset();
    console.log('🔄 AI控制器已重置');
  }
  
  /**
   * 获取性能统计
   */
  getStats() {
    return {
      prediction: this.predictiveEngine.getStats(),
      skip: this.skipStrategy.getStats(),
      opening: this.openingBook.getStats(),
      timeout: this.timeoutController.getStats(),
      fallback: this.fallbackStrategy.getStats()
    };
  }
}
