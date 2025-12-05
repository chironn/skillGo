// Kimi API 代理服务器
// 解决浏览器CORS跨域问题
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载.env文件（从项目根目录）
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = 3456;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// AI提供商配置
const AI_PROVIDERS = {
  kimi: {
    name: 'Kimi AI',
    baseURL: process.env.VITE_KIMI_API_BASE_URL || 'https://api.kimi.com/coding',
    apiKey: process.env.VITE_KIMI_API_KEY,
    model: 'kimi-for-coding',
    endpoint: '/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
  },
  nyxar: {
    name: 'Nyxar AI',
    baseURL: 'https://api.nyxar.org',
    apiKey: process.env.VITE_NYXAR_API_KEY,
    model: 'gpt-4o-mini',
    endpoint: '/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
  },
  siliconflow: {
    name: 'SiliconFlow AI',
    baseURL: 'https://api.siliconflow.cn',
    apiKey: process.env.VITE_SILICONFLOW_API_KEY,
    model: 'deepseek-ai/DeepSeek-V3',
    endpoint: '/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
  },
};

// 测试AI提供商连接
app.get('/api/ai/test', async (req, res) => {
  const providerId = req.query.provider;
  const provider = AI_PROVIDERS[providerId];
  
  if (!provider) {
    return res.status(400).json({ error: '未知的提供商' });
  }
  
  try {
    // 简单的健康检查
    res.json({ status: 'ok', provider: providerId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 统一的AI聊天接口
app.post('/api/ai/chat', async (req, res) => {
  const providerId = req.query.provider || 'kimi';
  const provider = AI_PROVIDERS[providerId];
  
  if (!provider) {
    return res.status(400).json({ error: '未知的提供商' });
  }
  
  if (!provider.apiKey) {
    return res.status(401).json({ error: `${providerId} API Key未配置` });
  }
  
  try {
    console.log(`📡 代理${providerId} API请求...`);
    
    const response = await fetch(`${provider.baseURL}${provider.endpoint}`, {
      method: 'POST',
      headers: provider.headers(provider.apiKey),
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${providerId} API错误:`, response.status, errorText);
      return res.status(response.status).json({ 
        error: `${providerId} API错误: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log(`✅ ${providerId} API响应成功`);
    res.json(data);
    
  } catch (error) {
    console.error(`❌ ${providerId} 代理错误:`, error);
    res.status(500).json({ 
      error: '代理服务器错误', 
      message: error.message 
    });
  }
});

// 兼容旧的Kimi API端点
app.post('/api/kimi/messages', async (req, res) => {
  const provider = AI_PROVIDERS.kimi;
  
  if (!provider.apiKey) {
    return res.status(401).json({ error: 'Kimi API Key未配置' });
  }
  
  try {
    console.log(`📡 代理Kimi API请求...`);
    
    const response = await fetch(`${provider.baseURL}${provider.endpoint}`, {
      method: 'POST',
      headers: provider.headers(provider.apiKey),
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Kimi API错误:`, response.status, errorText);
      return res.status(response.status).json({ 
        error: `Kimi API错误: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log(`✅ Kimi API响应成功`);
    res.json(data);
    
  } catch (error) {
    console.error(`❌ Kimi 代理错误:`, error);
    res.status(500).json({ 
      error: '代理服务器错误', 
      message: error.message 
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kimi API代理服务运行中' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI代理服务已启动: http://localhost:${PORT}`);
  console.log(`\n📋 已配置的AI提供商:`);
  
  Object.entries(AI_PROVIDERS).forEach(([id, provider]) => {
    const status = provider.apiKey ? '✅' : '❌';
    console.log(`  ${status} ${provider.name} (${id})`);
    if (provider.apiKey) {
      console.log(`     模型: ${provider.model}`);
    }
  });
  
  const defaultProvider = process.env.VITE_DEFAULT_AI_PROVIDER;
  
  if (defaultProvider && defaultProvider !== 'auto' && defaultProvider.trim() !== '') {
    const providerName = AI_PROVIDERS[defaultProvider]?.name || defaultProvider;
    console.log(`\n🎯 默认提供商: ${providerName} (${defaultProvider})`);
  } else {
    console.log(`\n🎯 默认提供商: 自动选择（延迟最低）`);
  }
  
  console.log(`\n📍 统一代理端点: http://localhost:${PORT}/api/ai/chat?provider=<id>`);
  console.log(`📍 测试端点: http://localhost:${PORT}/api/ai/test?provider=<id>`);
});
