#!/bin/sh
# Docker容器启动脚本

set -e

echo "=========================================="
echo "SkillGo Docker容器启动中..."
echo "=========================================="

# 检查环境变量
echo "检查环境变量..."
if [ -z "$VITE_KIMI_API_KEY" ] && [ -z "$VITE_NYXAR_API_KEY" ] && [ -z "$VITE_SILICONFLOW_API_KEY" ]; then
    echo "⚠️  警告：未配置任何AI API密钥，将使用纯本地模式"
else
    echo "✅ AI API密钥已配置"
fi

# 创建必要的目录
echo "创建日志目录..."
mkdir -p /var/log/nginx /var/log/supervisor /run/nginx

# 设置权限
echo "设置文件权限..."
chown -R nginx:nginx /usr/share/nginx/html
chmod -R 755 /usr/share/nginx/html

# 测试nginx配置
echo "测试Nginx配置..."
nginx -t

# 启动supervisor（管理nginx和node进程）
echo "启动服务..."
echo "=========================================="
echo "✅ SkillGo已启动"
echo "📍 访问地址: http://localhost"
echo "🔧 API代理: http://localhost:3456"
echo "=========================================="

exec /usr/bin/supervisord -c /etc/supervisord.conf
