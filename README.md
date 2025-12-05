# SkillGo 五子棋

一个基于 React + TypeScript 的现代化五子棋游戏，支持人机对战和双人对战模式。

## ✨ 特性

- 🎮 **双人对战模式**：本地双人对战
- 🤖 **AI 对战模式**：集成混合 AI 系统（本地算法 + Kimi API）
- 📊 **游戏记录**：自动保存对局记录，支持历史回放
- 🎨 **现代化 UI**：流畅的动画效果和响应式设计
- 🔊 **音效系统**：落子音效反馈

## 📋 前置条件

在开始之前，请确保你的系统已安装：

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/chironn/skillGo.git
cd skillGo
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量（可选）

如果需要使用 Kimi AI 增强功能，请配置 API Key：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Kimi API Key
# VITE_KIMI_API_KEY=your-api-key-here
```

> 💡 如果不配置 API Key，系统将使用纯本地算法模式，仍可正常游戏。

### 4. 启动项目

**方式一：一键启动（推荐）**

```bash
npm run dev:all
```

这将同时启动：
- 前端开发服务器（端口 5173）
- API 代理服务器（端口 3001）

**方式二：分别启动**

```bash
# 终端 1：启动代理服务器
npm run dev:proxy

# 终端 2：启动前端
npm run dev
```

### 5. 访问应用

打开浏览器访问：http://localhost:5173

## 📦 可用命令

```bash
# 开发模式（仅前端）
npm run dev

# 启动代理服务器
npm run dev:proxy

# 同时启动前端和代理服务器
npm run dev:all

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 🎮 游戏模式

### 双人对战
- 本地双人轮流落子
- 适合面对面对战

### AI 对战
- **简单**：适合新手练习
- **中等**：有一定挑战性
- **困难**：需要策略思考
- **大师**：混合 AI 系统，结合本地算法和 Kimi API

## 🔧 技术栈

- **前端框架**：React 19 + TypeScript
- **状态管理**：Zustand
- **构建工具**：Vite
- **样式**：CSS Modules
- **动画**：Framer Motion
- **音效**：Howler.js
- **本地存储**：Dexie (IndexedDB)
- **AI 服务**：Kimi API (可选)

## 📝 项目结构

```
skillgo/
├── src/
│   ├── ai/              # AI 相关模块
│   ├── components/      # React 组件
│   ├── core/            # 游戏核心逻辑
│   ├── services/        # 服务层（存储、音效）
│   ├── store/           # 状态管理
│   └── types/           # TypeScript 类型定义
├── server/              # 代理服务器
├── public/              # 静态资源
└── gameRecord/          # 游戏记录（本地）
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Kimi API 文档](https://api.kimi.com/docs)
- [React 文档](https://react.dev)
- [Vite 文档](https://vitejs.dev)
