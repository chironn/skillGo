/**
 * 超时控制器
 * 管理API调用超时和降级策略
 */

export class TimeoutController {
  private readonly DEFAULT_TIMEOUT = 2000; // 2秒
  private readonly MAX_TIMEOUT = 5000;     // 最多5秒
  private responseTimeHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;
  
  /**
   * 执行带超时的异步任务
   */
  async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT,
    fallback: T
  ): Promise<T> {
    
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      
      // 记录响应时间
      this.recordResponseTime(elapsed);
      
      console.log(`✅ 任务完成，用时 ${elapsed}ms`);
      return result;
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        console.warn(`⏰ 任务超时 (${timeoutMs}ms)，使用降级方案`);
        return fallback;
      }
      throw error;
    }
  }
  
  /**
   * 记录响应时间
   */
  private recordResponseTime(time: number): void {
    this.responseTimeHistory.push(time);
    
    // 只保留最近N次
    if (this.responseTimeHistory.length > this.HISTORY_SIZE) {
      this.responseTimeHistory.shift();
    }
  }
  
  /**
   * 自适应超时（根据历史表现）
   */
  getAdaptiveTimeout(): number {
    if (this.responseTimeHistory.length === 0) {
      return this.DEFAULT_TIMEOUT;
    }
    
    // 计算平均响应时间
    const avg = this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
    
    // 允许1.5倍的平均时间
    const adaptive = Math.ceil(avg * 1.5);
    
    // 限制在合理范围内
    return Math.min(
      Math.max(adaptive, this.DEFAULT_TIMEOUT),
      this.MAX_TIMEOUT
    );
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const avg = this.responseTimeHistory.length > 0
      ? this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length
      : 0;
    
    return {
      averageResponseTime: Math.round(avg),
      adaptiveTimeout: this.getAdaptiveTimeout(),
      historySize: this.responseTimeHistory.length
    };
  }
  
  /**
   * 重置统计
   */
  reset(): void {
    this.responseTimeHistory = [];
  }
}
