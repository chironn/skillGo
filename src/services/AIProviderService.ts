/**
 * AI提供商管理服务
 * 负责测试延迟、选择最优提供商、统一API调用
 */

import { AI_PROVIDERS, getEnabledProviders, getFastestProvider, type AIProvider } from '../config/aiProviders';

export class AIProviderService {
  private currentProvider: AIProvider | null = null;
  private useProxy: boolean = true;
  private lastTestTime: number = 0;
  private readonly TEST_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.useProxy = import.meta.env.DEV; // 开发环境使用代理
  }

  /**
   * 测试单个提供商的延迟
   */
  async testProviderLatency(provider: AIProvider): Promise<number> {
    const startTime = Date.now();
    
    try {
      const endpoint = this.useProxy 
        ? `http://localhost:3456/api/ai/test?provider=${provider.id}`
        : `${provider.baseURL}/v1/models`; // 使用models端点测试连接
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`${provider.name} 连接失败: ${response.status}`);
        return Infinity;
      }
      
      const latency = Date.now() - startTime;
      console.log(`✅ ${provider.name} 延迟: ${latency}ms`);
      return latency;
      
    } catch (error) {
      console.error(`❌ ${provider.name} 测试失败:`, error);
      return Infinity;
    }
  }

  /**
   * 测试所有提供商的延迟（带缓存）
   */
  async testAllProviders(): Promise<void> {
    // 检查缓存是否有效
    const now = Date.now();
    if (this.currentProvider && (now - this.lastTestTime) < this.TEST_CACHE_TTL) {
      console.log(`⚡️ 使用缓存的提供商: ${this.currentProvider.name} (${Math.round((now - this.lastTestTime) / 1000)}秒前测试)`);
      return;
    }
    
    console.log('🔍 开始测试所有AI提供商...');
    
    const providers = getEnabledProviders();
    const results = await Promise.all(
      providers.map(async (provider) => {
        const latency = await this.testProviderLatency(provider);
        provider.latency = latency;
        provider.lastChecked = Date.now();
        return { provider, latency };
      })
    );
    
    // 按延迟排序并显示结果
    results.sort((a, b) => a.latency - b.latency);
    console.log('📊 延迟测试结果:');
    results.forEach(({ provider, latency }) => {
      if (latency === Infinity) {
        console.log(`  ❌ ${provider.name}: 连接失败`);
      } else {
        console.log(`  ✅ ${provider.name}: ${latency}ms`);
      }
    });
    
    // 选择最快的提供商
    this.currentProvider = getFastestProvider();
    if (this.currentProvider) {
      console.log(`🚀 已选择最快的提供商: ${this.currentProvider.name} (${this.currentProvider.latency}ms)`);
      this.lastTestTime = now; // 更新测试时间
    } else {
      console.warn('⚠️ 没有可用的AI提供商');
    }
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): AIProvider | null {
    return this.currentProvider;
  }

  /**
   * 手动设置提供商
   */
  setProvider(providerId: string): void {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider && provider.enabled) {
      this.currentProvider = provider;
      console.log(`✅ 已切换到: ${provider.name}`);
    }
  }

  /**
   * 调用AI API（统一接口）
   */
  async callAI(messages: any[], options: any = {}): Promise<any> {
    if (!this.currentProvider) {
      // 如果没有选择提供商，先测试
      await this.testAllProviders();
      if (!this.currentProvider) {
        throw new Error('没有可用的AI提供商');
      }
    }

    const provider = this.currentProvider;
    
    try {
      const endpoint = this.useProxy
        ? `http://localhost:3456/api/ai/chat?provider=${provider.id}`
        : `${provider.baseURL}/v1/chat/completions`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || provider.model, // 使用提供商配置的默认模型
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error(`${provider.name} 调用失败:`, error);
      
      // 尝试切换到下一个可用的提供商
      const providers = getEnabledProviders()
        .filter(p => p.id !== provider.id && p.latency !== Infinity)
        .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
      
      if (providers.length > 0) {
        console.log(`🔄 切换到备用提供商: ${providers[0].name}`);
        this.currentProvider = providers[0];
        return this.callAI(messages, options); // 重试
      }
      
      throw error;
    }
  }
}

// 导出单例
export const aiProviderService = new AIProviderService();
