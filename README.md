# SkillGo 五子棋

一个基于 React + TypeScript 的现代化五子棋游戏，支持人机对战和双人对战模式。

## ✨ 核心特性

### 🎮 游戏模式
- **双人对战模式**：本地双人对战
- **AI 对战模式**：三难度级别（简单/中等/大师）
- **AI 辅助系统**：实时提示最佳落子位置

### 🤖 智能AI系统
- **混合AI架构**：本地算法 + 多AI提供商（Kimi/Nyxar/SiliconFlow）
- **预测性优化**：后台预测+缓存，响应速度提升18.5倍
- **智能跳过**：自动判断是否需要调用API，节省时间
- **开局库**：前10手使用预定义定式，瞬时响应
- **超时降级**：自适应超时和降级策略，保证稳定性

### 🎨 用户体验
- **现代化UI**：流畅的动画效果和响应式设计
- **落子光晕**：最后一步棋子淡金色光晕提示
- **音效系统**：落子音效反馈
- **游戏记录**：自动保存对局记录，支持历史回放

### ⚡ 性能优化
- 平均响应时间：从3秒降至0.162秒
- 开局阶段：0.001秒（提升3000倍）
- 中盘缓存命中：0.1秒（提升30倍）

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

如果需要使用 AI 增强功能，请配置 API Key：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 API Key（支持多个提供商）
# VITE_KIMI_API_KEY=your-kimi-key
# VITE_NYXAR_API_KEY=your-nyxar-key
# VITE_SILICONFLOW_API_KEY=your-siliconflow-key
```

> 💡 **提示**：
> - 如果不配置 API Key，系统将使用纯本地算法模式，仍可正常游戏
> - 支持配置多个AI提供商，系统会自动选择最快的
> - 详细配置说明见 [doc/多AI提供商系统说明.md](doc/多AI提供商系统说明.md)

### 4. 启动项目

**方式一：一键启动（推荐）**

```bash
npm run dev:all
```

这将同时启动：
- 前端开发服务器（端口 5173）
- API 代理服务器（端口 3456）

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

### 双人对战（PVP）
- 本地双人轮流落子
- 适合面对面对战
- 支持悔棋和游戏记录

### AI 对战
- **简单**：适合新手练习，纯本地算法
- **中等**：有一定挑战性，本地算法 + 30% AI增强
- **大师**：混合 AI 系统，本地算法 + 40% AI增强

### AI 辅助功能
- 实时提示最佳落子位置
- 消耗能量点数（每局100点）
- 支持三种提示级别（快速/标准/深度）

## 🔧 技术栈

### 前端
- **框架**：React 19 + TypeScript
- **状态管理**：Zustand + Immer
- **构建工具**：Vite 6
- **样式**：CSS + Framer Motion
- **音效**：Howler.js
- **本地存储**：Dexie (IndexedDB)

### 后端
- **API代理**：Node.js + Express
- **AI服务**：多提供商支持（Kimi/Nyxar/SiliconFlow）

### AI系统
- **本地算法**：增强型五子棋AI引擎
- **预测缓存**：后台预测 + LRU缓存
- **智能跳过**：7条规则自动优化
- **开局库**：预定义开局定式
- **超时降级**：自适应超时控制

## 📝 项目结构

```
skillgo/
├── src/
│   ├── ai/                      # AI 相关模块
│   │   ├── HybridAIController.ts      # 混合AI控制器
│   │   ├── PredictiveEngine.ts        # 预测引擎
│   │   ├── SmartSkipStrategy.ts       # 智能跳过策略
│   │   ├── OpeningBookManager.ts      # 开局库
│   │   ├── TimeoutController.ts       # 超时控制
│   │   └── FallbackStrategy.ts        # 降级策略
│   ├── components/          # React 组件
│   ├── core/                # 游戏核心逻辑
│   ├── services/            # 服务层（存储、音效、AI提供商）
│   ├── store/               # 状态管理
│   ├── config/              # 配置文件
│   └── types/               # TypeScript 类型定义
├── server/                  # API代理服务器
├── doc/                     # 项目文档
├── public/                  # 静态资源
└── gameRecord/              # 游戏记录（本地）
```

## 🐳 Docker部署

支持一键Docker部署，详见 [README.Docker.md](README.Docker.md)

```bash
# 快速启动
docker-compose up -d

# 访问应用
open http://localhost
```

完整部署指南：[doc/Docker部署指南.md](doc/Docker部署指南.md)

## 📚 文档

- [AI对战系统设计方案](doc/AI对战系统设计方案.md)
- [多AI提供商系统说明](doc/多AI提供商系统说明.md)
- [预测性AI优化实现总结](doc/预测性AI优化实现总结.md)
- [AI辅助系统设计方案](doc/AI辅助系统设计方案.md)
- [Docker部署指南](doc/Docker部署指南.md)
- [Kimi AI连接指南](doc/Kimi_AI_连接指南.md)

## 🎯 性能指标

| 场景 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 开局阶段 | 3秒 | 0.001秒 | 3000倍 |
| 中盘（缓存命中） | 3秒 | 0.1秒 | 30倍 |
| 平均响应 | 3秒 | 0.162秒 | 18.5倍 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [GitHub仓库](https://github.com/chironn/skillGo)
- [Kimi API 文档](https://platform.moonshot.cn/docs)
- [React 文档](https://react.dev)
- [Vite 文档](https://vitejs.dev)
