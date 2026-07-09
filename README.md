# 快乐消消乐 - 积木游戏

一款类似俄罗斯方块但规则不同的网页小游戏，采用莫兰迪配色，清新淡雅风格。

## 游戏特性

- 🎮 9x9 网格游戏空间
- 🧱 4 种积木类型（1x1, 1x2, 1x3, 1x4）
- 🎨 7 种不同颜色
- ⚡ 4 种道具系统
- 🏆 连击奖励机制
- 📱 响应式设计，支持移动端

## 游戏规则

### 回合制玩法

1. **回合开始**：当前所有积木向上平移一行，最底行随机出现 1-4 块新积木
2. **玩家操作**：点击选中一块积木，然后点击目标位置进行横向移动
3. **重力下落**：移动后积木按重力原则下落
4. **行消除**：填满一行的积木消除，其余积木按重力下落
5. **游戏结束**：当无法安全上移积木时游戏结束

### 操作方式

- **点击移动**：点击选中积木 → 点击同行目标位置移动
- **拖拽移动**：按住积木拖动到目标位置

### 积分规则

| 项目 | 分数 |
|------|------|
| 消除一行 | 1000 分 |
| 连续 2 回合消除 | 额外 +2000 分 |
| 连续 3 回合消除 | 额外 +3000 分 |
| 连续 N 回合消除 | 额外 +N×1000 分 |

> 注意：若当前回合未消除行，连击数重归 0

### 道具系统

| 道具 | 图标 | 效果 |
|------|------|------|
| 消除单个积木 | 🗑️ | 点击消除任意一块积木 |
| 消除一行积木 | ➡️ | 点击消除整行积木 |
| 消除同色积木 | 🌈 | 点击消除所有同色积木 |
| 任意移动 | ✈️ | 将积木移动到任意有空间的位置 |

道具随机附着在新增积木上，消除该积木后自动获取。

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)

## 快速开始

直接在浏览器中打开 `index.html` 文件即可开始游戏，无需任何依赖或构建步骤。

```bash
# 克隆仓库
git clone https://github.com/chillygs1102/blocks_miao.git

# 打开游戏
cd blocks_miao
open index.html
```

## 文件结构

```
blocks_miao/
├── index.html    # 游戏界面
├── style.css     # 样式文件
├── game.js       # 游戏逻辑
└── README.md     # 说明文档
```

## 开发说明

游戏使用原生 JavaScript 开发，无需安装任何依赖。直接修改代码即可进行开发和测试。

### 自定义配置

#### 修改道具出现概率

在 [game.js](game.js) 文件第 4 行修改：

```javascript
const POWER_UP_CHANCE = 0.05; // 当前为 5%，数值范围 0-1
```

#### 修改方块配色

在 [style.css](style.css) 文件第 406-412 行修改莫兰迪配色：

```css
.color-1 { background: linear-gradient(135deg, #EEC1C1 0%, #DC9E9E 100%); }  /* 柔雾粉 */
.color-2 { background: linear-gradient(135deg, #B2D4CB 0%, #92BDB1 100%); }  /* 清冷薄荷 */
.color-3 { background: linear-gradient(135deg, #F2DFC0 0%, #E6CDA5 100%); }  /* 燕麦杏色 */
.color-4 { background: linear-gradient(135deg, #CFC6E3 0%, #BBAED4 100%); }  /* 香芋淡紫 */
.color-5 { background: linear-gradient(135deg, #C2CEBB 0%, #ACBAA3 100%); }  /* 鼠尾草绿 */
.color-6 { background: linear-gradient(135deg, #E3DBB0 0%, #D3C99A 100%); }  /* 嫩鹅黄 */
.color-7 { background: linear-gradient(135deg, #B3C4D6 0%, #99AEC4 100%); }  /* 烟灰蓝 */
```

共 7 种莫兰迪色系，可根据喜好自定义颜色值。

## 许可证

MIT License
