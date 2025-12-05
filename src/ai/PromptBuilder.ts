// AI Prompt构建器
import type { Board, Move, Player } from '../types';
import type { AIDifficulty } from './types';

// 五子棋知识库
const GOMOKU_KNOWLEDGE_BASE = `
# 五子棋专家系统

## 角色定义
你是一位五子棋AI对手，具备完整的五子棋知识和对局经验。你的任务是分析当前棋局，并给出最佳落子位置。

## 五子棋核心知识

### 基础规则
- 棋盘：15×15格线交叉点
- 获胜条件：横、竖、斜任一方向连成五子
- 先手优势：执黑方有一定优势

### 棋型价值评估
1. **活四（9000分）**：两端都没有对方棋子阻挡的四连，必胜棋型
2. **冲四（1000分）**：一端被堵的四连，必须防守
3. **活三（1000分）**：可以形成活四的三连
4. **眠三（100分）**：只能形成冲四的三连
5. **活二（100分）**：可以形成活三的二连
6. **眠二（10分）**：价值较低的二连

### 战术要点
- **先手攻击**：优先创造活三、活四
- **防守反击**：阻止对手的活三、冲四
- **中心控制**：开局占据中心位置
- **连接发展**：保持己方棋子的连续性

### 开局定式
- **天元开局**：首子落在中心（7,7），稳健保守
- **星位开局**：距离中心2-3格，灵活多变

## 分析要求
1. 评估当前局势（优势方、关键区域）
2. 识别双方的威胁（活三、冲四等）
3. 考虑攻防平衡
4. 给出最佳落子位置及原因
5. 列出2-3个备选方案

## 输出格式（JSON）
{
  "move": {"x": 7, "y": 7},
  "confidence": 0.85,
  "reasoning": "分析过程",
  "threats": ["敌方威胁列表"],
  "alternatives": [{"x": 6, "y": 8}, {"x": 8, "y": 6}]
}
`;

export class PromptBuilder {
  // 获取系统提示词
  static getSystemPrompt(difficulty: AIDifficulty): string {
    const difficultyPrompts = {
      elementary: `
${GOMOKU_KNOWLEDGE_BASE}

## 当前难度：小学生水平

### 能力限制
- 只能看到1-2步的局面变化
- 主要依靠基础棋型识别
- 防守时可能遗漏威胁
- 偶尔下出随机位置

### 决策原则
1. **优先级1**：如果对手有冲四，必须防守
2. **优先级2**：如果自己能形成活三，尝试进攻
3. **优先级3**：在对手棋子附近落子（距离2-3格内）
4. **优先级4**：偏向中心区域
5. **允许失误**：约20%概率选择次优或随机位置

### 思考深度
- 局面评估：仅考虑当前步和下一步
- 不进行复杂的连续手顺计算
- 不考虑全局战略布局
`,
      college: `
${GOMOKU_KNOWLEDGE_BASE}

## 当前难度：大学生水平

### 能力特征
- 能看到3-5步的局面变化
- 具备良好的攻防平衡意识
- 能识别大部分常见棋型
- 偶尔在复杂局面下判断失误

### 决策原则
1. **威胁评估**：全面识别双方的活三、冲四、活四
2. **攻防权衡**：
   - 对手冲四必防
   - 对手活三优先防守，除非自己有更强进攻
   - 自己有活四直接进攻
3. **连接发展**：保持己方棋子的连续性和形状
4. **中心控制**：开局重视中心区域
5. **双重威胁**：尝试制造双杀局面

### 思考深度
- 局面评估：考虑当前步后的3-5步变化
- 能进行简单的手顺推演
- 识别明显的双杀机会
- 失误率：约10%
`,
      master: `
${GOMOKU_KNOWLEDGE_BASE}

## 当前难度：大师水平

### 能力特征
- 能看到7-10步的局面变化
- 具备深度的全局战略思维
- 精确的棋型价值评估
- 擅长制造复杂的组合战术
- 几乎不犯低级失误

### 决策原则
1. **深度计算**：
   - 完整推演所有强制手顺
   - 精确计算攻防手数
   - 识别所有隐藏的双杀机会

2. **战略布局**：
   - 开局建立灵活的棋形
   - 中局制造多个进攻方向
   - 收官精确计算胜率

3. **高级战术**：
   - 制造"VCF"（连续冲四取胜）
   - 制造"VCT"（连续活三取胜）
   - 利用双三、双四组合
   - 设置连环陷阱

### 思考深度
- 局面评估：深度搜索7-10步
- 完整的博弈树分析
- 失误率：<2%
`,
    };

    return difficultyPrompts[difficulty];
  }

  // 构建用户提示词（局面输入）
  static buildUserPrompt(board: Board, history: Move[], _difficulty: AIDifficulty): string {
    const lastMove = history[history.length - 1];
    const currentPlayer: Player = lastMove ? (lastMove.player === 'black' ? 'white' : 'black') : 'black';

    // 棋盘状态序列化
    const boardState = this.serializeBoardForAI(board);

    // 历史步骤（最近10步）
    const recentMoves =
      history.length > 0
        ? history
            .slice(-10)
            .map((m) => `(${m.x},${m.y})-${m.player === 'black' ? '●' : '○'}`)
            .join(', ')
        : '无';

    return `
# 当前局面分析

## 基本信息
- 当前回合：第${history.length + 1}手
- 轮到：${currentPlayer === 'black' ? '黑方(●)' : '白方(○)'}落子
- 最近步骤：${recentMoves}
- 上一手：${lastMove ? `(${lastMove.x},${lastMove.y})` : '无'}

## 棋盘状态
${boardState}

## 任务要求
请作为${currentPlayer === 'black' ? '黑方(●)' : '白方(○)'}，分析当前局面并给出最佳落子位置。

### 分析步骤
1. 识别双方的威胁棋型（活四、冲四、活三等）
2. 评估当前局势（谁占优、关键区域在哪）
3. 判断应该进攻还是防守
4. 给出最佳落子位置和原因
5. 提供2-3个备选方案

### 输出要求
严格按照JSON格式输出，不要包含任何多余文字：
{
  "move": {"x": 数字, "y": 数字},
  "confidence": 0到1的小数,
  "reasoning": "你的分析过程",
  "threats": ["识别到的威胁"],
  "alternatives": [{"x": 数字, "y": 数字}]
}
`;
  }

  // 棋盘序列化（ASCII表示）
  private static serializeBoardForAI(board: Board): string {
    let result = '   ';
    // 列号
    for (let i = 0; i < 15; i++) {
      result += String.fromCharCode(65 + i) + ' ';
    }
    result += '\n';

    // 棋盘内容
    for (let y = 0; y < 15; y++) {
      result += (y + 1).toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < 15; x++) {
        const stone = board[y][x];
        result += (stone === 'black' ? '●' : stone === 'white' ? '○' : '+') + ' ';
      }
      result += '\n';
    }

    return result;
  }
}
