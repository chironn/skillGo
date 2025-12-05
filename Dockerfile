# ==========================================
# 阶段1：构建前端
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端（生成dist目录）
RUN npm run build

# ==========================================
# 阶段2：生产环境
# ==========================================
FROM node:18-alpine

WORKDIR /app

# 安装nginx和supervisor（进程管理）
RUN apk add --no-cache nginx supervisor

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制API代理服务和依赖
COPY --from=builder /app/server /app/server
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/node_modules /app/node_modules

# 复制配置文件
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisord.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

# 创建必要的目录
RUN mkdir -p /var/log/nginx /var/log/supervisor /run/nginx \
    && chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80 3456

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]
