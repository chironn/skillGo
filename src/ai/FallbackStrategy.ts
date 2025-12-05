/**
 * 降级策略管理器
 * 根据API失败情况决定降级级别
 */

export type FallbackLevel = 'api' | 'local-hybrid' | 'local-only';

export class FallbackStrategy {
  private failureCount = 0;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RECOVERY_THRESHOLD = 5; // 连续成功5次后恢复
  private successCount = 0;
  
  /**
   * 记录API调用结果
   */
  recordResult(success: boolean): void {
    if (success) {
      this.successCount++;
      this.failureCount = Math.max(0, this.failureCount - 1);
      
      // 连续成功多次后完全恢复
      if (this.successCount >= this.RECOVERY_THRESHOLD) {
        this.failureCount = 0;
        console.log('✅ API已恢复正常');
      }
    } else {
      this.failureCount++;
      this.successCount = 0;
      console.warn(`⚠️ API失败次数: ${this.failureCount}`);
    }
  }
  
  /**
   * 判断是否应该降级
   */
  shouldFallback(): boolean {
    return this.failureCount >= this.FAILURE_THRESHOLD;
  }
  
  /**
   * 获取降级方案级别
   */
  getFallbackLevel(): FallbackLevel {
    if (this.failureCount === 0) {
      return 'api'; // 正常使用API
    } else if (this.failureCount < this.FAILURE_THRESHOLD) {
      return 'local-hybrid'; // 主要靠本地，偶尔尝试API
    } else {
      return 'local-only'; // 完全降级到本地
    }
  }
  
  /**
   * 重置（游戏结束后）
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      failureCount: this.failureCount,
      successCount: this.successCount,
      currentLevel: this.getFallbackLevel(),
      shouldFallback: this.shouldFallback()
    };
  }
}
