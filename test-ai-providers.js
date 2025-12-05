/**
 * AI提供商连接测试脚本
 * 运行: node test-ai-providers.js
 */

// Node.js 18+ 内置 fetch，如果是旧版本需要安装 node-fetch
// 或者使用 http 模块
import http from 'http';

const providers = [
  {
    id: 'kimi',
    name: 'Kimi AI',
    url: 'http://127.0.0.1:3456/api/ai/test?provider=kimi',
  },
  {
    id: 'nyxar',
    name: 'Nyxar AI',
    url: 'http://127.0.0.1:3456/api/ai/test?provider=nyxar',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow AI',
    url: 'http://127.0.0.1:3456/api/ai/test?provider=siliconflow',
  },
];

async function testProvider(provider) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const url = new URL(provider.url);
    
    const req = http.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      timeout: 5000,
    }, (res) => {
      const latency = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        console.log(`✅ ${provider.name}: ${latency}ms`);
        resolve({ ...provider, latency, success: true });
      } else {
        console.log(`❌ ${provider.name}: HTTP ${res.statusCode}`);
        resolve({ ...provider, latency: Infinity, success: false });
      }
      
      // 消费响应数据
      res.resume();
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${provider.name}: ${error.message}`);
      resolve({ ...provider, latency: Infinity, success: false });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ ${provider.name}: 超时`);
      resolve({ ...provider, latency: Infinity, success: false });
    });
  });
}

async function main() {
  console.log('🔍 开始测试AI提供商连接...\n');
  console.log('⚠️  请确保代理服务器正在运行: npm run dev:proxy\n');
  
  const results = await Promise.all(providers.map(testProvider));
  
  console.log('\n📊 测试结果汇总:');
  const sorted = results.sort((a, b) => a.latency - b.latency);
  
  sorted.forEach((result, index) => {
    if (result.success) {
      const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`  ${badge} ${result.name}: ${result.latency}ms`);
    } else {
      console.log(`  ❌ ${result.name}: 连接失败`);
    }
  });
  
  const fastest = sorted.find(r => r.success);
  if (fastest) {
    console.log(`\n🚀 推荐使用: ${fastest.name} (${fastest.latency}ms)`);
  } else {
    console.log('\n⚠️  所有提供商都连接失败，请检查代理服务器');
  }
}

main().catch(console.error);
