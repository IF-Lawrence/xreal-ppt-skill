---
name: guizang-ppt-skill
description: 生成横向翻页网页 PPT（单 HTML 文件），采用唯一的 XREAL Style 视觉系统：品牌无衬线排版、严格网格、黑白灰结构、克制的红色语义强调、静态纯色背景、直角、发丝线和锁定版式。适用于分享、演讲、产品发布、数据汇报、方法论和分析类网页 PPT；用户提到「XREAL Style」「瑞士风 PPT」「Swiss Style」「Helvetica」「网格」「信息图」或「horizontal swipe deck」时使用。
---


## 这个 Skill 做什么

生成一份**单文件 HTML**的横向翻页 PPT，唯一视觉系统是 **XREAL Style**：

- 封面与封底使用静态纯黑背景，正文使用纯白、浅灰或纯黑结构；不显示 WebGL、ASCII、点阵、纹理或动态装饰背景
- 按整套 PPT 的语言语境选择品牌字体：纯英文使用 XREAL Diatype，中文或中英混排使用 IBM Plex Sans SC
- 12/16 列网格、非对称留白、直角纯色块和 1px hairline
- 每份 deck 固定使用 XREAL 黑白灰品牌体系；红色只作为关键语义强调，不提供任意自定义颜色
- 正文页使用锁定的 `S01-S22` 版式；首页/尾页使用明确登记的 XREAL 纯黑变体
- 支持键盘、滚轮、触屏、ESC 索引、Google Material Symbols Outlined 图标和 Motion One 入场动效

## 何时使用

适合：

- AI / 科技产品发布、demo day、产品分析
- 数据汇报、年度总结、benchmark、流程和系统关系
- 设计、工程、方法论、城市/历史路线等结构化分享
- 需要离线打开、横向翻页、无需演示软件的网页版 slides

不适合：

- 大段表格数据或复杂图表叠加，优先使用常规 PPT
- 培训课件或多人在线协作编辑

## 工作流

### Step 0 · 需求澄清

不再询问风格选择，直接使用 XREAL Style。需求不完整时，按顺序确认最关键的信息：

1. 受众、分享场景和时长
2. 原始素材：文章、Markdown、数据、旧 PPT 或链接
3. 图片/截图位置，以及保真展示、截图美化还是截图再设计
4. 固定使用 XREAL 黑白灰品牌体系；红色只在关键数据、警示和操作状态中少量使用
5. 页数、必须包含的内容和不能出现的内容

如果没有大纲，使用下面的叙事弧，再映射到 XREAL Style 版式：

```text
钩子(Hook)    → 1 页：反差、问题或硬数据
定调(Context)  → 1-2 页：背景、对象、为什么重要
主体(Core)     → 3-5 页：结构、数据、流程、对比或案例
转折(Shift)    → 1 页：打破预期或提出新判断
收束(Takeaway) → 1-2 页：结论、行动建议或 manifesto
```

图片统一放在 `项目/XXX/ppt/images/`，命名为 `{页号}-{语义}.{ext}`，例如 `03-dashboard.png`。单张图片建议宽度至少 1600px；JPG 用于照片/截图，PNG 用于透明 UI/图表。

### Step 1 · 拷贝模板

```bash
mkdir -p "项目/XXX/ppt/images"
mkdir -p "项目/XXX/ppt/assets/fonts" "项目/XXX/ppt/assets/brand"
cp "<SKILL_ROOT>/assets/template-swiss.html" "项目/XXX/ppt/index.html"
cp "<SKILL_ROOT>/assets/fonts/"*.otf "项目/XXX/ppt/assets/fonts/"
cp "<SKILL_ROOT>/assets/brand/xreal-logo-black.svg" "项目/XXX/ppt/assets/brand/"
```

`template-swiss.html` 是完整可运行的单文件模板，包含 CSS、翻页 JS、XREAL 本地字体、Google Material Symbols 图标和 `<!-- SLIDES_HERE -->` 占位符。模板固定使用 `canvas-mode`，不得移除；该模式关闭遗留背景 canvas，确保所有页面使用静态纯色背景。

拷贝后立刻：

- 修改 `<title>`，不得保留 `[必填]`
- 只在 `:root{}` 中替换主题变量，不要散落修改 accent
- 保留 `B` 键低功耗模式、翻页导航和 ESC 索引逻辑

### Step 1.1 · 固定品牌色彩

当前只使用 **XREAL 黑白灰品牌体系**，不询问用户选择其他主题，也不接受任意自定义颜色：

| 角色 | 色值 | 使用规则 |
|---|---|---|
| 结构锚点 | `#0A0A0A` | 主文字、结构块、网格和导航 |
| 语义强调 | `#D71920` | 关键数据、警示、关键操作 |
| 技术质感 | `#A7ADB4` | 少量技术标记 |
| 品牌价值 | `#B08D57` | 少量价值标记 |

`assets/template-swiss.html` 已固定为 XREAL 黑白灰体系。读取 `references/themes-swiss.md` 确认完整变量组；不要替换为其他颜色，也不要混搭语义角色。

### Step 1.2 · 应用 XREAL 品牌层

读取 `references/brand-xreal.md`，并遵守：

- 先在整套 PPT 层级判断语言语境：纯英文 deck 统一使用 XREAL Diatype；中文或中英混排 deck 统一使用 IBM Plex Sans SC，包括其中的英文、数字、元数据与图表标签
- 禁止按单个字符、文本框或页面的中英文内容拆分字体；一套 deck 只使用一套主字体
- 纯英文 deck 将 `<html lang>` 设为 `en`；中文或中英混排 deck 设为 `zh-CN`
- 每页 `chrome-min` 的品牌位置使用 `assets/brand/xreal-logo-black.svg`
- 封面与封底的黑色区域使用 `#000000` 纯黑底，不添加 ASCII、点阵、纹理或动态装饰背景
- Logo 默认独立出现，不在右侧附加说明文字；确需相邻文字时，文字视觉字高与 Logo 高度一致，并使用标准字距
- 正文页 `chrome-min` 使用紧凑导航级品牌尺寸；相邻文字字号由 Logo 宽度按字体度量分别计算，并与 Logo 垂直居中：IBM Plex Sans SC 使用 `.26`，XREAL Diatype 使用 `.313`。封面/封底才使用较大的品牌级尺寸
- 删除无信息价值的装饰角标、小标题和分割线；正文 bullet 使用实心圆点，不使用短横线
- 所有可见文字默认使用自然大小写与标准字距；英文眉题、导航、标签、图注和页脚禁止整词组全大写，也不要依赖 CSS `text-transform: uppercase`
- 全大写只保留给 XREAL 官方字标、行业通用缩写（如 AI、AR、KPI、PPT）和短型号代码；不得把普通英文单词全大写作为装饰
- 描述性小标题使用标准字距，辅助文字 tracking 不超过 `0.05em`；时间线节点名称使用 600 字重
- Logo 在 `dark` / `accent` 背景上使用 `filter:invert(1)`，保持原比例和网格对齐
- 产品图标使用 Google Material Symbols Outlined，统一 `FILL 0`，不要使用 emoji、Lucide 或手绘 SVG 图标
- 黑、白、灰承担结构与信息层级；XREAL 红色仅用于关键数据/警示/关键操作语义，银色/金色仅作为极少量技术或价值标记
- 不因品牌化引入渐变、阴影、圆角、玻璃拟态或多色高亮
- 保留方向键翻页、`B` 静态模式和 `ESC` 索引功能，但不在页面右下角显示操作提示
- 页面不显示 `01 / 09`、`06 / 07` 等页码；顺序通过底部导航和演讲结构表达
- 底部导航只作为弱提示：亮底普通点透明度 `.08`、当前点 `.18`；暗底普通点 `.10`、当前点 `.22`。不要用不透明黑色、白色或 `var(--accent)` 显示当前点

### Step 2 · 填充内容

#### 2.0 · 类名预检

写任何 slide 之前，先读完整的 `assets/template-swiss.html` `<style>` 块，再读：

1. `references/swiss-layout-lock.md`
2. `references/layouts-swiss.md`
3. `references/brand-xreal.md`
4. 需要截图时读 `references/screenshot-framing.md`
5. 需要生成配图时读 `references/image-prompts.md`

模板是唯一的类名来源，不要凭空发明类名。常用 XREAL Style 类包括：

- 排版：`xreal-cover-title`、`xreal-page-title`、`xreal-support-copy`、`h-statement`、`h-md`、`t-cat`、`t-meta`、`lead`、`num-mega`
- 网格：`grid-12`、`grid-2-9`、`grid-2-9-5`、`span-N`
- 卡片：`card-ink`、`card-accent`、`card-fill`、`card-outlined`
- 图表：`kpi-tower-row`、`bar-tower`、`h-bar-chart`、`timeline-v`、`timeline-h`、`xreal-pie-layout`、`xreal-pie-legend`
- 信息组：`xreal-bento`；保持直角、无阴影、无圆角，一个红色语义点
- 装饰：`dot-mat`、`ring-mat`、`cross-mat`、`hr-hairline`
- 图片：`frame-img`、`fit-contain`、`r-21x9`、`r-16x9`、`r-16x10`、`h-22`、`h-26`、`swiss-lined`

#### 2.1 · 规划主题节奏

先列出 `内部页序（不渲染）→ class → data-layout → 选用理由 → 图片槽位`，再写 HTML。每个 section 必须明确写 `light`、`dark`、`hero light` 或 `hero dark`。

- 连续 3 页以上同主题不允许
- 8 页以上至少包含 1 个 `hero dark`、1 个 `hero light` 和 1 个 `dark` 正文页
- 每 3-4 页插入一个 hero / statement / closing 页
- 交付前运行 `grep 'class="slide' index.html` 检查节奏

#### 2.2 · 选择锁定版式

正文页只能使用 `S01-S22`；首页/尾页只能使用 `XREAL-COVER-BLACK` / `XREAL-CLOSING-BLACK`。每个 section 必须写 `data-layout="Sxx"`。

| 版式 | 用途 |
|---|---|
| S01 / S10 | 封面 / 收束 |
| S02 / S11 | 垂直 / 横向时间线 |
| S03 / S09 | 核心论点 / statement |
| S04 / S05 / S13 / S17 | 定义、分层、三力、系统关系 |
| S06 / S07 / S15 / S20 / S21 | KPI、排名、矩阵、账单、规格 |
| S08 | Duo Compare；地点/路线页扩展为 XREAL Map Component |
| S12 / S14 / S18 / S19 | Manifesto、闭环；S18 可挂载 XREAL Pie，S19 可挂载 XREAL Bento |
| S16 / S22 | 多卡简报 / 21:9 Image Hero |

默认 XREAL Style locked mode：不要临时发明 P23/P24、Evidence Grid、自由 SVG 页面或未登记正文结构。只有用户明确要求实验版式时才可例外，并在验证时显式允许。

硬规则：7-8 页至少使用 6 个不同 `S` 编号，10 页以上至少使用 8 个；数据专用版式必须有真实数据，结构专用版式必须有对应的闭环、矩阵或层级关系。

#### 2.3 · 图片与截图

- S22 主图优先 `21:9`，生成提示词包含 `subject centered in the safe middle area`
- S15/S16 多图组统一比例、统一高度和统一 caption 密度
- 证据截图、UI、代码和 dashboard 保真优先，先读 `screenshot-framing.md`，默认 `fit-contain`
- 按槽位重生成的信息图/插图必须铺满目标 frame，不要缩成漂浮小贴片
- 图片容器直角、无阴影、无圆角；默认不加外框，只在必要时使用 `.swiss-lined`
- 图片内部不得生成标题、页脚、页码、logo、角标、署名或 PPT 外壳
- 所有图片、caption、timeline label、footnote 都必须避开底部分页区，必要时使用 `.nav-safe-bottom`

#### 2.4 · 投屏字号与字重

最低字号：正文/主要说明 `18px`，卡片描述/列表/时间线/caption `16px`，meta/kicker/图表标签 `14px`。内容放不下时删减、拆页或换版式，不要压到 10-13px。

字重按信息角色分配，不与字号做反比：

| 信息角色 | 推荐字重 |
|---|---|
| Hero / 封面 / 章节主标题 | 纯英文 XREAL Diatype 500；中文或中英混排 IBM Plex Sans SC 600 |
| 页面标题 / 模块标题 | 500-600 |
| 关键 KPI / 数据 | 600-700；只允许一个最关键数字使用 700/800 |
| 副标题 / lead | 400-500 |
| 正文 / 描述 / caption | 400 |
| meta / kicker / 图表标签 | 500 |

中文标题使用双约束 `font-size:min(Xvw,Yvh)`；2 行或更长时先改写标题，再降字号。内容文字禁止使用 100/200/300。

### Step 3 · 校验与视觉检查

生成后先运行：

```bash
node <SKILL_ROOT>/scripts/validate-swiss-deck.mjs path/to/index.html
```

校验器会检查版式登记、`data-image-slot`、SVG 文本、标题对齐，以及可用时的真实渲染溢出、底部空白、nav 安全线和标题间距。修正后重复运行。

再打开 HTML 逐页查看：

1. 标题是否左上对齐，并使用与语言语境一致的 500/600 稳定字重
2. 图片、正文、caption 是否吸附到同一网格轴
3. 是否出现渐变、阴影、圆角、多个 accent 或不必要的装饰
4. 最低内容是否进入分页安全区
5. 动效稳定后再判断版式；需要时按 `B` 验证静态模式仍可读

### Step 4 · 本地预览与迭代

```bash
open "项目/XXX/ppt/index.html"
```

不需要本地服务器，图片使用相对路径 `images/xxx.png`。迭代时优先调整现有模板类和 inline 的字号/高度/间距，不要绕过 XREAL Style 版式锁重新发明页面。

## XREAL Style 核心原则

1. **黑白灰结构 + 红色语义**：黑色承担结构，红色只在关键位置出现。
2. **语境化无衬线排版**：纯英文 deck 使用 XREAL Diatype，中文或中英混排 deck 使用 IBM Plex Sans SC；任何衬线字体或按字符混用品牌字体都是错的。
3. **直角纯色**：禁止渐变、阴影和圆角，装饰使用 hairline、方块、点阵。
4. **网格至上**：元素吸附到 12/16 列 grid，左对齐，用留白制造非对称。
5. **角色化字体层级**：主标题与正文保持明显层级；纯英文主标题默认 500，中文或中英混排主标题默认 600，正文 400，标签 500。
6. **图片是证据**：先匹配槽位和比例，再生成或适配图片。
7. **动效可降级**：每页使用语义化 recipe；`B` 键必须能切换到静态可读状态。
8. **版式必须登记**：正文只从 `S01-S22` 选择，实验结构必须显式标记。
9. **封面纯黑**：封面与封底黑色区域使用 `#000000`，不使用 ASCII、纹理或动态背景。
10. **减法优先**：移除无信息价值的角标、眉题和分割线；bullet 统一使用实心圆点。
11. **自然大小写**：英文短语使用 sentence case / natural case 与标准字距；全大写仅用于品牌字标、通用缩写和短型号代码。

## 资源文件导览

```
guizang-ppt-skill/
├── SKILL.md
├── assets/
│   ├── template-swiss.html
│   ├── brand/xreal-logo-black.svg
│   ├── fonts/ (XREAL Diatype + IBM Plex Sans SC)
│   ├── screenshot-backgrounds/xreal-style/ (monochrome)
│   └── motion.min.js
├── scripts/
│   └── validate-swiss-deck.mjs
└── references/
    ├── swiss-layout-lock.md
    ├── layouts-swiss.md
    ├── swiss-map-component.md
    ├── themes-swiss.md
    ├── brand-xreal.md
    ├── image-prompts.md
    ├── screenshot-framing.md
    └── checklist.md
```

## 推荐加载顺序

1. 读取本文件
2. 读取 `assets/template-swiss.html` 的 `<style>` 块
3. 读取 `swiss-layout-lock.md` 和 `layouts-swiss.md`
4. 读取 `themes-swiss.md` 和 `brand-xreal.md`
5. 按需读取 `swiss-map-component.md`、`image-prompts.md` 或 `screenshot-framing.md`
6. 生成后运行 validator，再读取 `checklist.md` 做最终自检

## 视觉锚点

- Massimo Vignelli 的 NYC Subway / Unimark 系统
- *Helvetica Forever* 的字体设计语言
- Josef Müller-Brockmann 的网格系统
- Acne Studios、Off-White、IKEA、Beck Design 的当代 XREAL Style 视觉

把它们当作版式和克制程度的参考，不要把品牌 logo 或具体页面复制到生成结果中。
