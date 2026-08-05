---
name: xreal-ppt-skill
description: 生成、改版和校验 XREAL 品牌风格的横向翻页网页演示文稿（离线单文件 HTML）。使用 23 个锁定版式、XREAL 黑白灰与克制红色语义、XREAL Diatype 或 IBM Plex Sans SC、官方产品媒体资产、Motion One 动效以及受控 ECharts 复杂图表。用户要求制作或审查 XREAL 发布会、产品介绍、数据汇报、方法论、路线或地图类网页 PPT，或提到「XREAL Style」「XREAL PPT」「XREAL deck」「横向翻页 HTML PPT」时使用。
---

## 这个 Skill 做什么

生成一份**单文件 HTML**的横向翻页 PPT，唯一视觉系统是 **XREAL Style**：

- 封面与封底以静态纯黑为基底；语义匹配到合适的官方媒体时，优先使用受控全屏媒体背景，正文使用纯白、浅灰或纯黑结构；
- 按整套 PPT 的语言语境选择品牌字体：纯英文使用 XREAL Diatype，中文或中英混排使用 IBM Plex Sans SC
- 12/16 列网格、非对称留白、统一 8px 小圆角色块和 1px hairline
- 每份 deck 固定使用 XREAL 黑白灰品牌体系；红色只作为关键语义强调，不提供任意自定义颜色
- 正文页使用 23 个锁定版式（`S01-S08`、`S10-S24`）；`S09` 已移除，首页/尾页使用明确登记的 XREAL 黑色基底变体
- 支持键盘、滚轮、触屏、ESC 索引、Google Material Symbols Outlined 图标和 Motion One 入场动效
- 复杂散点、热力、瀑布、箱线、桑基、关系和层级图可使用受控的 XREAL ECharts Component；它扩展现有版式，不增加正文版式编号

## 何时使用

适合：

- AI / 科技产品发布、demo day、产品分析
- 数据汇报、年度总结、benchmark、流程和系统关系
- 设计、工程、方法论、城市/历史路线等结构化分享
- 需要离线打开、横向翻页、无需演示软件的网页版 slides

不适合：

- 大段表格数据、同页堆叠多个复杂图表或 dashboard 式筛选器，优先拆页或改用数据分析工具
- 培训课件或多人在线协作编辑

## 工作流

### Step 0 · 检查 Skill 更新

每次在一个新任务中触发本 Skill，**第一项可执行动作**必须是检查当前 Skill 仓库是否有远端更新；同一任务内只检查一次，避免重复询问。

按以下顺序执行：

1. 确认 `<SKILL_ROOT>` 位于 Git 仓库中，并读取当前分支、upstream 和工作区状态：

```bash
git -C "<SKILL_ROOT>" branch --show-current
git -C "<SKILL_ROOT>" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
git -C "<SKILL_ROOT>" status --short
```

2. 获取远端状态并比较当前 `HEAD` 与 upstream：

```bash
git -C "<SKILL_ROOT>" fetch --quiet
git -C "<SKILL_ROOT>" rev-list --left-right --count 'HEAD...@{upstream}'
git -C "<SKILL_ROOT>" log --oneline --no-decorate 'HEAD..@{upstream}'
```

3. 根据结果处理：
   - **没有落后提交**：不打断用户，直接进入 Step 1。
   - `rev-list` 输出依次为“本地领先数、远端领先数”；第二个数字大于 `0` 即表示检测到远端更新。先告诉用户更新数量和简短提交摘要，明确询问“是否先更新 Skill？”，并暂停 PPT 生成，等待用户选择。
   - **用户选择暂不更新**：继续使用当前安装版本，并进入 Step 1。
   - **无法联网、不是 Git 仓库、没有 remote/upstream**：简短说明无法检查更新，继续使用当前安装版本，不阻塞任务。

4. 用户确认更新后：
   - 工作区干净且本地没有分叉提交时运行 `git -C "<SKILL_ROOT>" pull --ff-only`。
   - 本地与远端均有新增提交时属于分叉状态；不得自动 merge 或 rebase，应说明状态并等待用户决定。
   - 工作区存在未提交修改时，**不得自动 stash、覆盖或 reset**；说明本地修改会阻止安全更新，并等待用户决定如何处理。
   - 更新完成后重新读取最新 `SKILL.md`，从 Step 1 继续；同一任务不再对同一版本重复询问。

### Step 1 · 需求澄清

使用 XREAL Style。需求不完整时，按顺序确认最关键的信息：

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

### Step 2 · 拷贝模板

```bash
mkdir -p "项目/XXX/ppt/images"
mkdir -p "项目/XXX/ppt/assets/fonts" "项目/XXX/ppt/assets/brand"
cp "<SKILL_ROOT>/assets/template-xreal.html" "项目/XXX/ppt/index.html"
cp "<SKILL_ROOT>/assets/fonts/"*.otf "项目/XXX/ppt/assets/fonts/"
cp "<SKILL_ROOT>/assets/brand/xreal-logo-black.svg" "项目/XXX/ppt/assets/brand/"
```

`template-xreal.html` 是完整可运行的单文件模板，包含 CSS、翻页 JS、XREAL 本地字体、Google Material Symbols 图标和 `<!-- SLIDES_HERE -->` 占位符。模板固定使用 `canvas-mode`，不得移除；该模式关闭遗留背景 canvas，确保所有页面使用静态纯色背景。

拷贝后立刻：

- 修改 `<title>`，不得保留 `[必填]`
- 只在 `:root{}` 中替换主题变量，不要散落修改 accent
- 保留 `B` 键低功耗模式、翻页导航和 ESC 索引逻辑
- 页面声明 `data-chart-engine="echarts"` 时，再复制 `assets/echarts.min.js` 到项目 `assets/`；最终交付前使用 `scripts/inline-echarts.mjs` 嵌入单文件

### Step 2.1 · 固定品牌色彩

当前只使用 **XREAL 黑白灰品牌体系**，不询问用户选择其他主题，也不接受任意自定义颜色：

| 角色 | 色值 | 使用规则 |
|---|---|---|
| 结构锚点 | `#0A0A0A` | 主文字、结构块、网格和导航 |
| 语义强调 | `#D71920` | 关键数据、警示、关键操作 |
| 技术质感 | `#A7ADB4` | 少量技术标记 |
| 品牌价值 | `#B08D57` | 少量价值标记 |

`assets/template-xreal.html` 的 `:root{}` 是完整且唯一的主题变量源；结合 `references/brand-xreal.md` 使用其品牌语义，不要替换颜色或混搭语义角色。

### Step 2.2 · 应用 XREAL 品牌层

读取 `references/brand-xreal.md`，并遵守：

- 先在整套 PPT 层级判断语言语境：纯英文 deck 统一使用 XREAL Diatype；中文或中英混排 deck 统一使用 IBM Plex Sans SC，包括其中的英文、数字、元数据与图表标签
- 禁止按单个字符、文本框或页面的中英文内容拆分字体；一套 deck 只使用一套主字体
- 纯英文 deck 将 `<html lang>` 设为 `en`；中文或中英混排 deck 设为 `zh-CN`
- 每页 `chrome-min` 的品牌位置使用 `assets/brand/xreal-logo-black.svg`
- 封面与封底使用 `#000000` 黑色基底；媒体审计命中时允许一张官方照片、KV、产品 beauty 或透明产品图作为全屏背景，不添加 ASCII、点阵、纹理、CSS 图形或动态装饰背景
- 封底固定为品牌收束页：大号 `Thanks` 作为画面中心主视觉，小号反白 XREAL Logo 放在底部中央；匹配到安静的产品图时可作为低干扰背景，但不重复结论、takeaway、作者日期、页码或其他说明文字
- Logo 默认独立出现，不在右侧附加说明文字；确需相邻文字时，文字视觉字高与 Logo 高度一致、使用标准字距，并与 Logo 保持至少 `1.6vw` 的明确间距
- 正文页 `chrome-min` 使用紧凑导航级品牌尺寸；相邻文字字号由 Logo 宽度按字体度量分别计算，并与 Logo 垂直居中：IBM Plex Sans SC 使用 `.26`，XREAL Diatype 使用 `.313`。封面/封底才使用较大的品牌级尺寸
- `chrome-min` 到首个正文块统一使用 `--chrome-content-gap:24px`，紧凑变体使用 `--chrome-content-gap-tight:16px`。不要在正文首块再叠加空白 margin 来补偿页眉；标题后的版式内部间距单独控制，避免整页内容被双重下推
- 删除无信息价值的装饰角标、小标题和分割线；正文 bullet 使用实心圆点，不使用短横线
- 所有可见文字默认使用自然大小写与标准字距；英文眉题、导航、标签、图注和页脚禁止整词组全大写，也不要依赖 CSS `text-transform: uppercase`
- 全大写只保留给 XREAL 官方字标、行业通用缩写（如 AI、AR、KPI、PPT）和短型号代码；不得把普通英文单词全大写作为装饰
- 描述性小标题使用标准字距，辅助文字 tracking 不超过 `0.05em`；时间线节点名称使用 600 字重
- Logo 在 `dark` / `accent` 背景上使用 `filter:invert(1)`，保持原比例和网格对齐
- 产品图标使用 Google Material Symbols Outlined，统一 `FILL 0`，不要使用 emoji、Lucide 或手绘 SVG 图标
- 禁止 AI 或页面代码把人物、设备、场景、抽象科技图形绘制成 SVG、Canvas 或 CSS 插画配图；SVG 仅用于已有品牌资产和承担信息表达的图表、地图、流程、数据几何，并标记 `data-svg-role`
- 黑、白、灰承担结构与信息层级；XREAL 红色仅用于关键数据/警示/关键操作语义，银色/金色仅作为极少量技术或价值标记
- 卡片型实体块、图片框和控件统一使用 `--radius-sm:8px`；S04 Six Cells、S05 Three Layers、S06 KPI Tower、S07 Horizontal Bar、S13 Three Forces、S16 Multi-card Brief 必须应用该 token。S06/S23 等接触 x 轴的垂直柱体只保留顶部 8px 圆角，底角为直角并贴齐共同基线；独立 KPI cap 仍为四角小圆角。S19 Bento 只圆整体外框，内部区块保持直角。页面画布、分割线和坐标轴保持直线；禁止装饰性渐变、阴影、发光、大圆角、胶囊形、玻璃拟态或多色高亮。唯一例外是 full-bleed 照片/技术媒体为保护压图文字而使用的中性黑透明蒙版，可按文字位置由浅到深，但不得形成彩色或可感知的装饰渐变
- S16 Multi-card Brief 默认六卡等权、全部使用中性白底卡；不得为了制造视觉焦点而强行强调。只有内容本身存在明确的首选、推荐、关键或风险优先级时，才允许最多一张 `.is-accent`，并必须添加 `data-emphasis="primary|recommended|critical|risk"` 说明语义
- S04 `.sub-card` 与 S16 `.brief-card` 分别使用 `--sub-card-pad:2.2vh`、`--brief-card-pad:2.2vh`，四边内边距保持一致；禁止重新写成不同的 `vh / vw` 横纵 padding。S04 右上编号的 `top / right` 也必须使用同一个 `--sub-card-pad`
- KPI / 图表展示级大数字的单位（如 `°`、`%`、`ms`、`Hz`、`in`）统一挂在数字右上肩位，使用 `vertical-align:text-top`、`--unit-mark-opacity:.62` 且不得与数字拆行；文字单位统一间距 `--unit-mark-gap:.18em`，角度使用更紧的 `--unit-degree-gap:.03em`。正文句子中的单位作为普通文本随正文基线。角度使用 Unicode `°` 或 `<sup class="unit-degree">°</sup>`，绝不使用下标；只有科学指数与数学/化学语义允许真正的上标或下标
- 中文与中英混排标题保持正体，禁止在 `h1` / `h2` / `h3` 或标题类中使用斜体；纯英文标题如确有必要，只允许一次克制的斜体强调
- 保留方向键翻页、`B` 静态模式和 `ESC` 索引功能，但不在页面右下角显示操作提示
- 页面不显示 `01 / 09`、`06 / 07` 等页码；顺序通过底部导航和演讲结构表达
- 底部导航只作为弱提示：亮底普通点透明度 `.08`、当前点 `.18`；暗底普通点 `.10`、当前点 `.22`。不要用不透明黑色、白色或 `var(--accent)` 显示当前点

### Step 3 · 填充内容

#### 3.0 · 类名预检

写任何 slide 之前，先读完整的 `assets/template-xreal.html` `<style>` 块，再读：

1. `references/swiss-layout-lock.md`
2. `references/layouts-swiss.md`
3. `references/brand-xreal.md`
4. 使用复杂图表时再读 `references/xreal-echarts.md`

模板是唯一的类名来源，不要凭空发明类名。常用 XREAL Style 类包括：

- 排版：`xreal-cover-title`、`xreal-section-title`、`xreal-page-title`、`xreal-support-copy`、`h-statement`、`h-md`、`t-cat`、`t-meta`、`lead`、`num-mega`
- 网格：`grid-12`、`grid-2-9`、`grid-2-9-5`、`span-N`
- 卡片：`card-ink`、`card-accent`、`card-fill`、`card-outlined`
- 图表：`kpi-tower-row`、`bar-tower`、`h-bar-chart`、`timeline-v`、`timeline-h`、`xreal-pie-layout`、`xreal-pie-legend`；复杂图表扩展使用 `xreal-echart-stage`、`xreal-echart`
- S02 纵向时间线必须显式标出列含义，并让每个节点形成“时间 + 同口径指标 + 阶段名称 + 体验影响”四层语义。使用 `.tl-head`、`.tl-axis > .dot`、`.yr`、`.multi`、`.tl-copy > .tl-stage + .tl-impact`；节点圆点必须真实可见并与贯穿轴居中，不能退化成没有方向关系的三列表格。
- S17 系统关系图必须先声明 `data-system-grammar="flow|hierarchy|network|containment"`。默认优先使用可复用的 HTML 节点和连接语义；只有内容确实表达 core/middle/outer 的包含关系时才使用同心圆。因果传递使用 flow，组织分层使用 hierarchy，多对多依赖使用 network；不得为了“像系统图”而放三个没有信息增量的圆。
- S17 左侧只保留 `.system-kicker + .system-thesis + .system-summary`，用于一句结论和一段解释；右侧 `[data-system-grammar]` 承载唯一关系结构，两列顶部误差不得超过 16px。flow 语法使用 `.system-flow`，禁止在左侧再复制 Process / Orchestrate / Deliver 等阶段列表，也禁止出现“这里表达的是”“不是套圈”“图的目的是”等制作说明式文案。
- S23 分组柱图使用 `--chart-safe-inline` 为首末柱预留左右安全区，使用 `--chart-value-headroom` 为最高柱的数值标签预留顶部空间。`.chart-value` 必须以 `left:0;right:0;text-align:center` 覆盖整根柱宽，不使用 `translateX(-50%)` 居中，避免 `chart-rise` 的纵向 transform 覆盖后标签偏移；`.chart-x-labels` 使用相同左右 padding 保持类别中心对齐。
- 信息组：`xreal-bento`；整体外框使用 `--radius-sm:8px`、内部区块直角、无阴影，一个红色语义点
- 装饰：`hr-hairline`
- 图片：`frame-img`、`fit-contain`、`r-21x9`、`r-16x9`、`r-16x10`、`h-22`、`h-26`、`swiss-lined`；卡片媒体使用 `card-media-slot`、`stack-card-media`、`bento-hero-media`

#### 3.1 · 选择媒体资产

生成前运行 `rg --files "<SKILL_ROOT>/assets/media"`，先锁定产品线，再从对应目录或用户明确提供的文件中选图。产品线目录使用稳定的 lowercase slug：

| 产品线 | 目录 |
|---|---|
| AURA | `aura/` |
| One Pro | `one-pro/` |
| 1S | `1s/` |
| XBX A01+ | `xbx-a01+/` |

每个产品线目录使用相同的资产类型结构：

| 目录 | 用途 |
|---|---|
| `<product-line>/00-product-marks/` | 官方产品字标、产品 Logo、横版/竖版及黑白反色版本 |
| `<product-line>/01-white-background/` | 白底或透明底产品图、产品单体与标准角度 |
| `<product-line>/02-product-beauty/` | 产品美图、材质特写、结构细节、不同角度和配件组合 |
| `<product-line>/03-hero-key-visuals/` | Campaign Hero、发布会主视觉、品牌 KV 与章节 Hero |
| `<product-line>/04-feature-visuals/` | 功能演示、交互效果和技术能力展示 |
| `<product-line>/05-lifestyle/` | 佩戴场景、人物使用、工作与生活环境 |
| `<product-line>/06-conceptual/` | 概念视觉、氛围图、未来感和叙事性视觉 |

企业 XREAL Logo 继续使用 `assets/brand/xreal-logo-black.svg`；产品标志只能从当前产品线的 `00-product-marks/` 选择，用于封面、章节页、S12 宣言横幅或其他明确产品识别位，不替代每页 `chrome-min` 中的企业 Logo。不得重绘、改字距、变形、拼接或自行改色；优先使用资产库中与背景匹配的官方黑版/白版。缺少产品标志时使用产品名称文字，不要仿制 Logo。

S12 manifesto 中的产品标志只承担身份落款，不是第二主标题。放在 `.ink-banner-full` 时，其渲染宽度控制在横幅宽度的 18%-26%，标准值为 `min(23vw,320px)`，并保持官方比例；不得通过放大产品标志与 manifesto 主标题争抢层级。

在图片媒体编排前先做一次产品身份审计：若整套内容明确围绕单一产品，给 `<body>` 添加 `data-product-line="<slug>"`，检查该产品线 `00-product-marks/`。存在官方标志时，至少在一个高价值产品识别位使用 `.xreal-product-mark[data-image-slot="product-mark"][data-media-role="product-identity"]`，并将选中的 SVG 复制到 `images/`；不得继续用手打产品名代替已有官方标志。不要每页重复产品标志，也不要把它塞进 `chrome-min`。

同一产品 deck 默认只使用对应产品线资产；只有产品对比页才可跨产品线取图，并保持相同资产类型、比例与视觉尺度。先选版式和图片槽位，再按内容角色、画幅比例和主体安全区选择素材。只把选中的素材复制到项目 `images/`，不要修改资产库原文件。没有合适素材时，改用无图版式或向用户说明缺少哪类图片；不要生成图片、调用外部图库或临时绘制替代。

先制作内部媒体编排表：`文件 → 内容语义 → 画幅/透明通道 → 主体安全区 → 候选页面 → 最终槽位`。不得只复制素材而不分配页面；最终 `images/` 中未被 HTML 引用的文件必须清理或明确保留原因。

封面与封底必须分别声明 `data-media-match="matched|none"`：

- 封面先评估 `03-hero-key-visuals`、`05-lifestyle`、`06-conceptual` 与横版 `02-product-beauty`。能直接支撑 deck 主张、具有约 30% quiet zone 且标题保持高对比时，使用 `.xreal-cover-media`、`data-image-slot="cover-background"` 和 `data-media-role="cover-background"`；否则写 `none` 并保持纯黑。
- 封底先评估与封面不同的低干扰 lifestyle、conceptual 或品牌 KV，概念图有合适 quiet zone 时优先于标准产品图。能在不削弱 `Thanks` 与底部 Logo 的前提下形成氛围收束时，使用 `.xreal-closing-media`、`data-image-slot="closing-background"`、`data-media-role="closing-background"`、`data-media-kind="lifestyle|conceptual|brand-kv"`、`data-media-fit="full-bleed"` 和 `data-media-contrast="darken"`；只有所有候选都未通过语境、裁切和对比度检查时才写 `none`。封底禁止直接使用透明产品 cutout、白底产品图、标准产品角度或 packshot。
- 封面与封底默认使用不同素材；仅当素材池只有一张合适图片且“首尾呼应”是明确叙事意图时才允许复用。媒体背景不计为新正文版式。
- 不设机械的“每页一图”配额；优先覆盖封面、封底、章节 Hero 和需要视觉证据的正文页。素材数量多时提高有效覆盖率，仍以语义匹配和可读性优先。
- 技术卡片可以配图，但先判断媒体是否能解释该技术点，而不是只填空白。S04 最多为 1-2 张 `.sub-card.has-media` 增加 `.card-media-slot[data-media-role="technical-evidence"]`；紧边透明 cutout 使用 `data-media-fit="inset"` + contain，主体在画布内偏小或卡片留白明显时使用 `data-media-fit="inset-prominent"` + cover，高度约占父卡 28%-45%、宽度至少占父卡 80%，与文字分区且不加蒙版。
- S05 最多为一个核心 `.stack-block.has-media` 增加 `.stack-card-media[data-media-role="technical-evidence"]`。短文案与低干扰横版媒体可使用 `.media-full-bleed`、`data-media-fit="full-bleed" data-media-contrast="darken"` 全幅铺底；通过渐变深色蒙版保护底部文字，同时保留 `.layer-icon` 作为语义标记。只有媒体主体与图标明显冲突时才调整图标位置，不因配图自动删除图标。若素材不适合压字，回退到 inset/contain，高度约占父卡 18%-45%。
- S19 Bento 的大面积 `.hero` 主卡在存在合适 lifestyle / contextual 媒体且文字较少时，可以使用 `.hero.has-media + .bento-hero-media[data-media-role="context-evidence"]` 全幅铺底，并声明 `data-media-fit="full-bleed" data-media-contrast="darken"`。媒体应在宽高两个方向覆盖父卡至少 95%；文字直接反白，不叠白色或半透明面板。统一通过 `--media-scrim-alpha:.38` 加深色蒙版，可在 `.28-.48` 内按素材亮度微调，同时保留图片细节；S19 仍只圆整体外框，媒体和内部 article 不增加独立圆角。
- 只有文字直接叠在照片或场景媒体上时才使用深色蒙版；图片与文字互不重叠的 inset / contain 证据图不加蒙版。若 `.48` 仍无法保证可读性，应更换图片、调整 `object-position` 或改为无图版式，而不是继续压暗。
- 不给信息已经密集、没有清晰媒体对应关系或需要保真阅读的卡片硬塞图片；此时保留留白是正确选择。

媒体文件名使用 `场景-人物-行为-构图-比例.ext` 顺序；人物或行为不适用时可以省略，但必须保留可检索语义。构图统一使用 `横版`、`竖版`、`方图`，常用比例使用 `21x9`、`16x9`、`4x3`、`3x2`、`2x3`、`3x4` 或 `1x1`；不属于常用比例时按实际像素比写成简化值，例如 `2.47x1`，不要沿用原文件名中的误标比例。产品线和资产类型由父级目录表达，不在文件名中重复；同语义不同版本追加 `-v2`、`-detail` 等后缀。

#### 3.2 · 规划主题节奏

先列出 `内部页序（不渲染）→ class → data-layout → 选用理由 → 图片槽位`，再写 HTML。每个 section 必须明确写 `light`、`dark`、`hero light` 或 `hero dark`。

- 连续 3 页以上同主题不允许
- 8 页以上至少包含 1 个 `hero dark`、1 个 `hero light` 和 1 个 `dark` 正文页
- 每 3-4 页插入一个 hero / statement / closing 页
- 需要章节标题页时使用 `S01 + data-variant="section-hero"`;它是单标题 Hero 停顿页,视觉层级不得高于 Index Cover
- 交付前运行 `grep 'class="slide' index.html` 检查节奏

#### 3.3 · 选择锁定版式

正文页只能使用 23 个已登记版式（`S01-S08`、`S10-S24`）；`S09` 已移除。首页/尾页只能使用 `XREAL-COVER-BLACK` / `XREAL-CLOSING-BLACK`。每个 section 必须写 `data-layout="Sxx"`。

封底 `XREAL-CLOSING-BLACK` 必须是整套 deck 的最后一个 section，并使用 `.slide.accent + .xreal-closing-lockup + .xreal-closing-thanks + .xreal-closing-mark + .xreal-closing-logo` 骨架与 `data-animate="closing-thanks"`。大号 `Thanks` 居中，小号企业 Logo 固定在底部中央；可按 `data-media-match` 使用安静的官方媒体背景。进入该页时隐藏底部分页导航。所有结论与行动建议应在封底前一页完成。

| 版式 | 用途 |
|---|---|
| S01 / S10 | Index Cover / 收束；章节标题 Hero 使用 `S01 + section-hero` 登记变体 |
| S02 / S11 | 垂直 / 横向时间线 |
| S03 | 核心论点 / statement |
| S04 / S05 / S13 / S17 | 定义、分层、三力、系统关系 |
| S06 / S07 / S15 / S20 / S21 | KPI、排名、矩阵、账单、规格 |
| S08 | Duo Compare；地点/路线页扩展为 XREAL Map Component |
| S12 / S14 / S18 / S19 | Manifesto、闭环；S18 可挂载 XREAL Pie，S19 可挂载 XREAL Bento |
| S16 / S22 | 多卡简报 / 21:9 Image Hero |
| S23 / S24 | 分组数据比较图 / 时间或连续变量折线趋势图 |

默认 XREAL Style locked mode：不要临时启用历史实验 `P23/P24`、Evidence Grid、自由 SVG 页面或未登记正文结构；它们与正式 `S23/S24` 图表版式无关。只有用户明确要求实验版式时才可例外，并在验证时显式允许。

章节标题 Hero 变体必须使用 `.xreal-section-title` 和正文级 `chrome-min`,只放小型章节标识、单一主标题和一句引导语。可使用 `hero light`、浅灰或 `hero dark`,但禁止 `.xreal-cover-title`、`slide accent` 满屏纯黑、巨大章节编号、目录列表或三行 `cover-row`,以确保层级低于 S01 Index Cover。

图表选版先判断数据形状：3-8 个无连续顺序类别 × 2-4 个同量纲系列使用 `S23 Data Chart`;时间或连续变量上的 1-3 个系列、每系列 4-12 个点使用 `S24 Line Chart`。简单柱图/折线优先使用原生组件；复杂分布、矩阵、流向、网络或层级数据才添加 `data-chart-engine="echarts"`，并按 `references/xreal-echarts.md` 映射到 S23/S24/S17/S08。所有图表必须提供单位、HTML 图例、数据来源和结论标题；不同量纲默认拆图，禁止无说明双轴。手写 SVG 只用于 S24 的折线与点且不写 `<text>`；ECharts 运行时生成的 SVG/Canvas 仅限合法图表几何。

硬规则：7-8 页至少使用 6 个不同 `S` 编号，10 页以上至少使用 8 个；数据专用版式必须有真实数据，结构专用版式必须有对应的闭环、矩阵或层级关系。

#### 3.4 · 图片与截图

- S22 主图优先从当前产品线的 `03-hero-key-visuals/`、`02-product-beauty/` 或 `05-lifestyle/` 选择接近 `21:9` 且主体位于中央安全区的素材
- S22 图片上的标题直接叠加为高对比文本，不套白底卡片、色块或半透明面板；如果无法找到稳定的高对比落点，调整裁切或更换图片
- S15/S16 多图组统一比例、统一高度和统一 caption 密度
- 证据截图、UI、代码和 dashboard 保真优先，默认使用 `fit-contain`，不要为统一比例重画内容
- 资产比例匹配槽位时铺满目标 frame；比例不匹配时使用 `fit-contain` 或更换版式，不要强行裁掉产品主体
- 图片容器统一使用 `--radius-sm:8px`、无阴影；默认不加外框，只在必要时使用 `.swiss-lined`
- 配图只使用 `assets/media/` 或用户提供的 PNG/JPG/JPEG/WebP 文件；禁止用内联 SVG、Canvas 或 CSS 图形临时绘制插画配图
- 如果素材自带与当前页面冲突的标题、页脚、页码、logo、角标或署名，换用其他资产或无图版式，不要重绘素材
- 所有图片、caption、timeline label、footnote 都必须避开底部分页区，必要时使用 `.nav-safe-bottom`

#### 3.5 · 投屏字号与字重

最低字号：正文/主要说明 `18px`，卡片描述/列表/时间线/caption `16px`，meta/kicker/图表标签 `14px`。内容放不下时删减、拆页或换版式，不要压到 10-13px。

字重由信息角色固定，同一角色在整套 PPT 中保持一致：

| 信息角色 | 推荐字重 |
|---|---|
| Hero / 封面 / 章节主标题 | 纯英文 XREAL Diatype 500；中文或中英混排 IBM Plex Sans SC 600 |
| 页面标题 / 模块标题 | 纯英文 500；中文或中英混排 600 |
| 关键 KPI / 数据 | 纯英文 500；中文或中英混排 600；每页最重要的单个数据可使用 700 |
| 副标题 / lead | 400 |
| 正文 / 描述 | 400 |
| caption / 辅助元数据 | 纯英文 400；中文或中英混排 450 |
| kicker / 导航标签 / 图表标签 | 500 |

中文标题使用双约束 `font-size:min(Xvw,Yvh)`；2 行或更长时先改写标题，再降字号。内容文字禁止使用 100/200/300。

### Step 4 · 校验与视觉检查

生成后先运行：

```bash
node <SKILL_ROOT>/scripts/validate-swiss-deck.mjs path/to/index.html
```

校验器会检查版式登记、`data-image-slot`、SVG 文本、标题对齐，以及可用时的真实渲染溢出、底部空白、nav 安全线和标题间距。修正后重复运行。

再打开 HTML 逐页查看：

1. 标题是否左上对齐，并使用与语言语境一致的 500/600 稳定字重
2. 图片、正文、caption 是否吸附到同一网格轴
3. 是否出现装饰性渐变、阴影、发光、霓虹、大圆角、胶囊形、多个 accent、自绘 SVG 插画或不必要的装饰；full-bleed 媒体仅允许为文字可读性使用中性黑透明蒙版
4. 最低内容是否进入分页安全区
5. 动效稳定后再判断版式；需要时按 `B` 验证静态模式仍可读

### Step 5 · 本地预览与迭代

```bash
open "项目/XXX/ppt/index.html"
```

不需要本地服务器，图片使用相对路径 `images/xxx.png`。迭代时优先调整现有模板类和 inline 的字号/高度/间距，不要绕过 XREAL Style 版式锁重新发明页面。

使用 ECharts 时，保留可编辑源文件并生成单独的最终文件：

```bash
node "<SKILL_ROOT>/scripts/prepare-echarts.mjs"
node "<SKILL_ROOT>/scripts/inline-echarts.mjs" "项目/XXX/ppt/index.source.html" "项目/XXX/ppt/index.html"
node "<SKILL_ROOT>/scripts/validate-swiss-deck.mjs" "项目/XXX/ppt/index.html"
```

## XREAL Style 核心原则

1. **黑白灰结构 + 红色语义**：黑色承担结构，红色只在关键位置出现。
2. **语境化无衬线排版**：纯英文 deck 使用 XREAL Diatype，中文或中英混排 deck 使用 IBM Plex Sans SC；任何衬线字体或按字符混用品牌字体都是错的。
3. **卡片小圆角**：卡片型实体块统一使用 `--radius-sm:8px`，尤其是 S04/S05/S06/S07/S13/S16；S06/S23 等基线柱体只圆顶部两角，底角为 0 并贴齐 x 轴；S19 Bento 只圆整体外框、内部区块直角；页面画布、分割线和坐标轴保持直线；禁止装饰性渐变、阴影、发光、霓虹、大圆角和胶囊形。full-bleed 媒体为保护文字使用的中性黑透明蒙版不属于装饰性渐变。
4. **网格至上**：元素吸附到 12/16 列 grid，左对齐，用留白制造非对称。
5. **角色化字体层级**：主标题与正文保持明显层级；纯英文主标题默认 500，中文或中英混排主标题默认 600，正文 400，标签 500。
6. **图片是证据**：先匹配槽位和比例，再生成或适配图片。
7. **动效可降级**：每页使用语义化 recipe；`B` 键必须能切换到静态可读状态。
8. **版式必须登记**：正文只从 `S01-S08`、`S10-S24` 选择；`S09` 已移除，实验结构必须显式标记。
9. **复杂图表受控**：ECharts 只负责复杂数据几何、布局与交互，必须使用 XREAL 主题、类型白名单和离线单文件流程，不得带入默认 dashboard 视觉。
10. **开场/收束媒体**：封面与封底使用 `#000000` 基底并声明 `data-media-match`；命中合适官方媒体时使用登记的背景类，不使用 ASCII、纹理、CSS 图形或动态背景。
11. **减法优先**：移除无信息价值的角标、眉题和分割线；bullet 统一使用实心圆点。
12. **自然大小写**：英文短语使用 sentence case / natural case 与标准字距；全大写仅用于品牌字标、通用缩写和短型号代码。

## 资源文件导览

```
xreal-ppt-skill/
├── SKILL.md
├── assets/
│   ├── template-xreal.html
│   ├── brand/xreal-logo-black.svg
│   ├── fonts/ (XREAL Diatype + IBM Plex Sans SC)
│   ├── media/
│   │   ├── aura/
│   │   ├── one-pro/
│   │   ├── 1s/
│   │   └── xbx-a01+/
│   │       └── 每条产品线均包含 00-product-marks 至 06-conceptual 七类目录
│   ├── motion.min.js
│   └── echarts.min.js (仅复杂图表使用，Apache ECharts 6.1.0)
├── scripts/
│   ├── prepare-echarts.mjs
│   ├── inline-echarts.mjs
│   └── validate-swiss-deck.mjs
└── references/
    ├── swiss-layout-lock.md
    ├── layouts-swiss.md
    ├── xreal-echarts.md
    ├── swiss-map-component.md
    ├── brand-xreal.md
    └── checklist.md
```

## 推荐加载顺序

1. 读取本文件
2. 执行 Step 0 更新检查；有更新时先询问用户
3. 读取 `assets/template-xreal.html` 的 `<style>` 块
4. 读取 `swiss-layout-lock.md` 和 `layouts-swiss.md`
5. 读取 `brand-xreal.md`
6. 需要地图时读取 `swiss-map-component.md`
7. 需要复杂图表时读取 `xreal-echarts.md`
8. 生成后运行 validator，再读取 `checklist.md` 做最终自检

## 视觉锚点

- Massimo Vignelli 的 NYC Subway / Unimark 系统
- *Helvetica Forever* 的字体设计语言
- Josef Müller-Brockmann 的网格系统
- Acne Studios、Off-White、IKEA、Beck Design 的当代 XREAL Style 视觉

把它们当作版式和克制程度的参考，不要把品牌 logo 或具体页面复制到生成结果中。
