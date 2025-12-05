/**
 * AI提供商配置
 * 支持多个AI API提供商，自动选择延迟最低的
 */

// 默认提供商ID（从环境变量读取，如果设置，将优先使用此提供商，否则自动选择延迟最低的）
// 可选值: 'kimi' | 'nyxar' | 'siliconflow' | 'auto' | null
const envProvider = import.meta.env.VITE_DEFAULT_AI_PROVIDER;
export const DEFAULT_PROVIDER_ID: string | null = 
  envProvider && envProvider !== 'auto' ? envProvider : null;

export interface AIProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  model: string; // 默认使用的模型
  enabled: boolean;
  latency?: number; // 延迟（毫秒）
  lastChecked?: number; // 上次检测时间
}

// AI提供商列表
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'kimi',
    name: 'Kimi AI',
    baseURL: 'https://api.kimi.com/coding',
    apiKey: import.meta.env.VITE_KIMI_API_KEY || '',
    model: 'kimi-for-coding', // Kimi 专用编程模型
    enabled: true,
  },
  {
    id: 'nyxar',
    name: 'Nyxar AI',
    baseURL: 'https://api.nyxar.org',
    apiKey: import.meta.env.VITE_NYXAR_API_KEY || '',
    model: 'gpt-4o-mini', // Nyxar 支持的高性价比模型
    enabled: true,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow AI',
    baseURL: 'https://api.siliconflow.cn',
    apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || '',
    model: 'deepseek-ai/DeepSeek-V3', // SiliconFlow 的 DeepSeek-V3 模型
    enabled: true,
  },
];

// 获取启用的提供商
export function getEnabledProviders(): AIProvider[] {
  return AI_PROVIDERS.filter(p => p.enabled && p.apiKey);
}

// 根据ID获取提供商
export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id);
}

// 获取最快的提供商
export function getFastestProvider(): AIProvider | null {
  const enabled = getEnabledProviders();
  if (enabled.length === 0) return null;
  
  // 如果配置了默认提供商，优先使用
  if (DEFAULT_PROVIDER_ID) {
    const defaultProvider = enabled.find(p => p.id === DEFAULT_PROVIDER_ID);
    if (defaultProvider) {
      console.log(`🎯 使用配置的默认提供商: ${defaultProvider.name}`);
      return defaultProvider;
    }
  }
  
  // 否则按延迟排序，返回最快的
  const sorted = enabled
    .filter(p => p.latency !== undefined)
    .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
  
  return sorted[0] || enabled[0];
}
