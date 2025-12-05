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
const PORT = 3001;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 代理Kimi API请求
app.post('/api/kimi/messages', async (req, res) => {
  const apiKey = process.env.VITE_KIMI_API_KEY;
  const baseURL = process.env.VITE_KIMI_API_BASE_URL || 'https://api.kimi.com/coding';
  
  console.log('🔍 环境变量检查:');
  console.log('  API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : '未设置');
  console.log('  Base URL:', baseURL);
  
  if (!apiKey || apiKey === 'your-api-key-here') {
    return res.status(401).json({ 
      error: '未配置API Key，请在.env文件中设置VITE_KIMI_API_KEY' 
    });
  }
  
  try {
    console.log('📡 代理Kimi API请求...');
    
    const response = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Kimi API错误:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Kimi API错误: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log('✅ Kimi API响应成功');
    res.json(data);
    
  } catch (error) {
    console.error('❌ 代理服务器错误:', error);
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
  console.log(`🚀 Kimi API代理服务已启动: http://localhost:${PORT}`);
  console.log(`📍 代理端点: http://localhost:${PORT}/api/kimi/messages`);
  console.log(`🔑 API Key状态: ${process.env.VITE_KIMI_API_KEY ? '已配置' : '未配置'}`);
  console.log(`🌐 Base URL: ${process.env.VITE_KIMI_API_BASE_URL || 'https://api.kimi.com/coding'}`);
});
