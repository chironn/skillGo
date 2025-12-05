// Kimi API服务
// 提供与Kimi AI的交互接口
import type { EnhancedMove } from './EnhancedGomokuAI';

export const KIMI_MODEL = 'kimi-for-coding';

export class KimiAPIService {
  private apiKey: string;
  private baseURL: string;
  private retryCount = 2;
  private useProxy: boolean;
  
  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL || 'https://api.kimi.com/coding';
    // 开发环境使用代理，生产环境直连（需要后端支持）
    this.useProxy = import.meta.env.DEV;
  }
  
  /**
   * 请求Kimi AI的落子建议
   */
  async requestMove(systemPrompt: string, userPrompt: string, temperature: number): Promise<EnhancedMove | null> {
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        // 开发环境使用本地代理，避免CORS问题
        const endpoint = this.useProxy 
          ? 'http://localhost:3456/api/kimi/messages'
          : `${this.baseURL}/v1/messages`;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // 直连模式需要认证头，代理模式由服务器处理
        if (!this.useProxy) {
          headers['x-api-key'] = this.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: KIMI_MODEL,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            temperature,
            stream: false
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Kimi API返回错误: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        // Anthropic格式响应：data.content[0].text
        const contentBlock = data.content?.[0];
        if (!contentBlock || contentBlock.type !== 'text') {
          throw new Error('响应格式错误：未找到text类型内容');
        }
        const content = contentBlock.text || '';
        
        return this.parseResponse(content);
        
      } catch (error) {
        console.error(`Kimi API调用失败 (尝试 ${attempt + 1}/${this.retryCount}):`, error);
        if (attempt < this.retryCount - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    return null;
  }
  
  /**
   * 解析Kimi API响应
   */
  private parseResponse(content: string): EnhancedMove | null {
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
        type: 'kimi',
        reasoning: parsed.reasoning || 'Kimi AI决策',
        confidence: parsed.confidence || 0.7
      };
    } catch (error) {
      console.error('解析Kimi响应失败:', error);
      return null;
    }
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
