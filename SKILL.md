---
name: xreal-ppt-skill
description: 生成、改版和校验 XREAL 品牌风格的横向翻页网页演示文稿（离线单文件 HTML），作为 XREAL 公司内部 PPT 制作规范的网页化补充层。使用 26 个锁定版式、内容保真与来源覆盖审计、XREAL 黑白灰与克制红色语义、XREAL Diatype、IBM Plex Sans SC 或 IBM Plex Sans JP，支持英文、中文、日语及对应混排语境，并使用官方产品媒体资产、Motion One 动效和受控 ECharts 复杂图表。用户要求制作或审查 XREAL 发布会、产品介绍、数据汇报、方法论、路线、地图、高密度一页综合或重点卖点 Bento 类网页 PPT，或提到「XREAL Style」「XREAL PPT」「XREAL deck」「横向翻页 HTML PPT」时使用。
---

## 这个 Skill 做什么

生成一份**单文件 HTML**的横向翻页 PPT，唯一视觉系统是 **XREAL Style**：

- 封面与封底以静态纯黑为基底；语义匹配到合适的官方媒体时，优先使用受控全屏媒体背景，正文使用纯白、浅灰或纯黑结构；
- 按整套 PPT 的语言语境选择品牌字体：纯英文使用 XREAL Diatype，中文或中英混排使用 IBM Plex Sans SC，日语或日英混排使用 IBM Plex Sans JP
- 12/16 列网格、非对称留白、统一 8px 小圆角色块和 1px hairline
- 每份 deck 固定使用 XREAL 黑白灰品牌体系；红色只作为关键语义强调，不提供任意自定义颜色
- 正文页使用 26 个锁定版式（`S01-S08`、`S11-S28`）；`S09 Dot Matrix Statement` 与 `S10 Split Closing` 已移除，首页/尾页使用明确登记的 XREAL 黑色基底变体
- 支持键盘、滚轮、触屏、ESC 索引、Google Material Symbols Outlined 图标和 Motion One 入场动效
- 复杂散点、热力、瀑布、箱线、桑基、关系和层级图可使用受控的 XREAL ECharts Component；它扩展现有版式，不增加正文版式编号

## 何时使用

适合：

- XREAL 公司内部的产品发布、产品介绍、功能或卖点讲解、业务复盘、管理层汇报和年度总结
- XREAL 内部的 benchmark、竞品或市场分析、产品路线、流程与系统关系、地图/路线和一页高密度信息总览
- 已有 XREAL 品牌或公司内部 PPT 制作规范之外，需要补充网页化模板、官方媒体编排、ECharts 复杂图表和自动校验
- 需要离线打开、横向翻页、无需 PowerPoint 或在线协作工具即可评审和演示的单文件 HTML slides

**定位**：本 Skill 是 XREAL 公司内部 PPT 制作规范的网页化补充层，负责将内部规范落地为单文件 HTML、锁定版式、媒体编排和可校验的演示文稿，不替代公司主规范。如与公司主规范、最新品牌资产或项目负责人要求冲突，以其为准。

不适合：

- 需要脱离 XREAL 公司内部规范重新定义品牌视觉、主题、配色或版式的任务，以及非 XREAL 品牌的通用 PPT
- 以实时筛选、持续计算或大量原始表格为主要需求的 dashboard 或数据分析工具；若大量信息必须同时可见且彼此依赖，使用 S27 先合并真正重复且无信息增量的表述并重组，来源模式中保留全部覆盖 ID，不要自动拆页
- 培训课件、多人在线协作编辑、需要幻灯片逐页可编辑，或必须交付 PPTX 源文件的任务

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

用户提供成体系原始材料时，必须先执行下方 Step 1.1；“做成 PPT”“更简洁”或固定页数不构成大幅摘要授权。

如果没有大纲且没有成体系原始材料，使用下面的叙事弧，再映射到 XREAL Style 版式：

```text
钩子(Hook)    → 1 页：反差、问题或硬数据
定调(Context)  → 1-2 页：背景、对象、为什么重要
主体(Core)     → 3-5 页：结构、数据、流程、对比或案例
转折(Shift)    → 1 页：打破预期或提出新判断
收束(Takeaway) → 1-2 页：结论、行动建议或 manifesto
```

叙事弧用于组织内容，不是删除原始材料的理由。若原始材料不能完整落入建议页数，优先增加正文页或附录页，再与用户确认是否需要摘要。

图片统一放在 `项目/XXX/ppt/images/`，命名为 `{页号}-{语义}.{ext}`，例如 `03-dashboard.png`。单张图片建议宽度至少 1600px；JPG 用于照片/截图，PNG 用于透明 UI/图表。

### Step 1.1 · 内容保真与覆盖审计

用户提供文章、Markdown、会议纪要、旧 PPT、文档、表格说明或其他成体系材料时，读取 `references/content-fidelity.md` 并执行：

- 默认使用 `source-faithful`，在 `<body>` 声明 `data-content-mode="source-faithful"`；只有用户明确要求摘要/精简或批准删减方案时，才可使用 `editorial-summary`
- 写 slide 前将原始材料拆成稳定的 `SRC-001...` 语义单元，在项目根目录建立 `content-coverage.json`
- 每个承载原始内容的正文 section 使用稳定 `id` 与 `data-source-refs`，将成稿页回指到覆盖清单
- 未经用户明确同意，不得删除事实、数据、统计口径、限定条件、反例、风险、案例、引用、决策或行动项；逐字引用、法务措辞、数字、公式、专有名词、责任人与截止时间默认不得改写
- `source-faithful` 只约束语义内容，不继承原材料的配色、背景、字体、装饰、版式或页面截图；成稿页面仍必须完整遵循 XREAL Style 的颜色 token、版式锁定和视觉规范。只有用户明确要求视觉保真，或原始视觉本身是必须保真的证据时，才可保留局部视觉元素，并不得因此改变全局主题
- 内容放不下时依次调整版式、增加页数/附录、忠实合并真正重复的表述；固定页数与完整保留冲突时先报告冲突，不得静默摘要
- 交付时报告内容模式、覆盖项总数、包含项数和经批准遗漏项；自动校验通过后仍需人工核对转述是否改变语气、因果、范围、时间或数字

用户只有主题或短 brief、没有可逐项覆盖的原始材料时，使用 `data-content-mode="brief-generated"`，无需覆盖清单。模型新增的分析或建议必须明确其性质，不得伪装成用户事实。

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

- 先在整套 PPT 层级判断语言语境：纯英文 deck 统一使用 XREAL Diatype；中文或中英混排 deck 统一使用 IBM Plex Sans SC；日语或日英混排 deck 统一使用 IBM Plex Sans JP。混排中的英文、数字、元数据与图表标签均跟随整套 deck 主字体
- 禁止按单个字符、文本框或页面的中英文内容拆分字体；一套 deck 只使用一套主字体
- 纯英文 deck 将 `<html lang>` 设为 `en`；中文或中英混排 deck 设为 `zh-CN`；日语或日英混排 deck 设为 `ja`
- 每页 `chrome-min` 的品牌位置使用 `assets/brand/xreal-logo-black.svg`
- 封面与封底使用 `#000000` 黑色基底；媒体审计命中时允许一张官方照片或 KV 作为全屏背景，封面还可使用匹配的 product beauty；封底只使用低干扰 lifestyle、conceptual 或品牌 KV，禁止透明产品图与 packshot。两者都不添加 ASCII、点阵、纹理、CSS 图形或动态装饰背景
- 封底固定为品牌收束页：大号 `Thanks` 作为画面中心主视觉，小号反白 XREAL Logo 放在底部中央；匹配到安静的 lifestyle、conceptual 或品牌 KV 时可作为低干扰背景，但不直接使用产品 cutout / packshot，也不重复结论、takeaway、作者日期、页码或其他说明文字
- Logo 默认独立出现，不在右侧附加说明文字；确需相邻文字时，文字视觉字高与 Logo 高度一致、使用标准字距，并与 Logo 保持至少 `1.6vw` 的明确间距
- 正文页 `chrome-min` 使用紧凑导航级品牌尺寸；相邻文字字号由 Logo 宽度按字体度量分别计算，并与 Logo 垂直居中：IBM Plex Sans SC / JP 使用 `.26`，XREAL Diatype 使用 `.313`。封面/封底才使用较大的品牌级尺寸
- `chrome-min` 到首个正文块统一使用 `--chrome-content-gap:24px`，紧凑变体使用 `--chrome-content-gap-tight:16px`。不要在正文首块再叠加空白 margin 来补偿页眉；标题后的版式内部间距单独控制，避免整页内容被双重下推
- 删除无信息价值的装饰角标、小标题和分割线；正文 bullet 使用实心圆点，不使用短横线
- 不默认生成底栏、页脚说明或底部分割线。只有必要来源、方法/样本口径、法务或风险免责声明，以及对当前结论确有信息增量的解释可以保留为统一小注脚；若“虚构/示意”等状态已在标题区明确，禁止在底部重复。不得用产品名、口号、芯片名、功能列表或制作说明填充底部空白
- 所有可见文字默认使用自然大小写与标准字距；英文眉题、导航、标签、图注和页脚禁止整词组全大写，也不要依赖 CSS `text-transform: uppercase`
- 全大写只保留给 XREAL 官方字标、行业通用缩写（如 AI、AR、KPI、PPT）和短型号代码；不得把普通英文单词全大写作为装饰
- 描述性小标题使用标准字距，辅助文字 tracking 不超过 `0.05em`；时间线节点名称使用 600 字重
- Logo 在 `dark` / `accent` 背景上使用 `filter:invert(1)`，保持原比例和网格对齐
- 产品图标使用 Google Material Symbols Outlined，统一 `FILL 0`，不要使用 emoji、Lucide 或手绘 SVG 图标
- 禁止 AI 或页面代码把人物、设备、场景、抽象科技图形绘制成 SVG、Canvas 或 CSS 插画配图；SVG 仅用于已有品牌资产和承担信息表达的图表、地图、流程、数据几何，并标记 `data-svg-role`
- 黑、白、灰承担结构与信息层级；XREAL 红色仅用于关键数据/警示/关键操作语义，银色/金色仅作为极少量技术或价值标记
- 卡片型实体块、图片框和控件统一使用 `--radius-sm:8px`；S04 Six Cells、S05 Three Layers、S06 KPI Tower、S07 Horizontal Bar、S13 Three Forces、S16 Multi-card Brief、S26 Milestone Gallery、S27 Dense Synthesis 主面板与 S28 Priority Bento 单卡必须应用该 token。S06/S23 等接触 x 轴的垂直柱体只保留顶部 8px 圆角，底角为直角并贴齐共同基线；独立 KPI cap 仍为四角小圆角。S19 Bento 只圆整体外框，内部区块保持直角。页面画布、分割线和坐标轴保持直线；禁止装饰性渐变、阴影、发光、大圆角、胶囊形、玻璃拟态或多色高亮。唯一例外是 full-bleed 照片/技术媒体为保护压图文字而使用的中性黑透明蒙版，可按文字位置由浅到深，但不得形成彩色或可感知的装饰渐变
- 所有可见文字必须按浏览器最终计算样式满足 WCAG AA：普通文字 `>=4.5:1`，大字（≥24px，或 ≥18.66px 且字重 ≥600）`>=3:1`。检查对象包括继承色、alpha / opacity、透明子卡、祖先背景和压图表面；深色表面显式反白，浅色表面显式使用 `--text-primary / secondary / helper`，禁止依赖偶然继承。对比不足时改文字角色、表面色、媒体蒙版/亮度、裁切或素材，不加白色/半透明文字面板。
- S16 Multi-card Brief 默认六卡等权、全部使用中性白底卡；不得为了制造视觉焦点而强行强调。只有内容本身存在明确的首选、推荐、关键或风险优先级时，才允许最多一张 `.is-accent`，并必须添加 `data-emphasis="primary|recommended|critical|risk"` 说明语义
- S04 `.sub-card` 与 S16 `.brief-card` 分别使用 `--sub-card-pad:2.2vh`、`--brief-card-pad:2.2vh`，四边内边距保持一致；禁止重新写成不同的 `vh / vw` 横纵 padding。S04 右上编号的 `top / right` 也必须使用同一个 `--sub-card-pad`
- KPI / 图表展示级大数字的单位（如 `°`、`%`、`ms`、`Hz`、`in`）统一挂在数字右上肩位，使用 `vertical-align:text-top`、`--unit-mark-opacity:.62` 且不得与数字拆行；文字单位统一间距 `--unit-mark-gap:.18em`，角度使用更紧的 `--unit-degree-gap:.03em`。`screen` 等多字符英文词单位必须额外使用 `.unit-word`，恢复正常字距与词距，不得继承 KPI 数字的负 tracking。正文句子中的单位作为普通文本随正文基线。角度使用 Unicode `°` 或 `<sup class="unit-degree">°</sup>`，绝不使用下标；只有科学指数与数学/化学语义允许真正的上标或下标
- 中文、日语及对应混排标题保持正体，禁止在 `h1` / `h2` / `h3` 或标题类中使用斜体；纯英文标题如确有必要，只允许一次克制的斜体强调
- 保留方向键翻页、`B` 静态模式和 `ESC` 索引功能，但不在页面右下角显示操作提示
- 页面不显示 `01 / 09`、`06 / 07` 等页码；顺序通过底部导航和演讲结构表达
- 底部导航只作为弱提示：亮底普通点透明度 `.08`、当前点 `.18`；暗底普通点 `.10`、当前点 `.22`。不要用不透明黑色、白色或 `var(--accent)` 显示当前点

### Step 3 · 填充内容

来源模式下，先完成 `content-coverage.json` 和内部“来源项 → 目标页 → 表达方式”映射，再规划页序和写 HTML；不得先写摘要页、再倒推覆盖清单。

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
- S02 纵向时间线必须显式标出列含义，并让每个节点形成“时间 + 同口径指标 + 阶段名称 + 体验影响”四层语义。使用 `.tl-head`、`.tl-axis > .dot`、`.yr`、`.multi`、`.tl-copy > .tl-stage + .tl-impact`；节点圆点必须真实可见并与贯穿轴居中，不能退化成没有方向关系的三列表格。`.timeline-v` 只占正文宽度的 72%-82%，贯穿轴由每个 `.tl-node::before` 连续绘制并与 dot 对齐；横向分隔线由 `::after` 从 axis 列右侧开始，禁止穿过竖轴或延伸到整页边缘；列头与对应正文列必须左对齐。
- S07 横向条形图把真实宽度持久写入 `.row-fill` 的 `--value`，CSS 使用 `width:var(--value)`；动效只能从左侧执行 `scaleX(0→1)`，禁止把 inline `width` 改成 `0%` 或在动画结束后丢失数据宽度。标签列使用 `max-content` 并限制最大宽度，标签到 track 保持 16-32px 紧凑间距。静态模式和动效结束后 fill 都必须可见并与 `--value` 一致。排名属于单系列：所有普通 bar 使用同一个 `--chart-series-1`，不得交替黑/灰制造假系列；只有标题结论明确指向某一项时，才允许一个 `.critical` 使用 `--chart-critical`。
- S12 manifesto 可在语境明确匹配时使用 `.manifesto-media[data-image-slot="s12-manifesto-background"][data-media-role="context-background"]` 全幅背景；只选择 lifestyle、conceptual 或品牌 KV，声明 `data-media-fit="full-bleed" data-media-contrast="darken"`，覆盖页面至少 95% 并以中性黑蒙版保护白字。禁止透明产品 cutout、白底产品图或 packshot；无合适媒体时保持纯黑。
- S14 闭环图使用左侧 3-5 步 + 右侧单一细线闭环，并在 `.loop-visual` 写入与节点数一致的 `data-loop-count="3|4|5"`。SVG 只画低对比 `.loop-track` 与至少 4 个 `.loop-segment`，HTML `.loop-node` 提供步骤标签，`.loop-core` 提供中心状态；最多一个 `.return` 返回段使用红色。禁止粗圆环、浮动外标签、重复装饰点和 SVG 文字。
- S17 系统关系图必须先声明 `data-system-grammar="flow|hierarchy|network|containment"`。默认优先使用可复用的 HTML 节点和连接语义；只有内容确实表达 core/middle/outer 的包含关系时才使用同心圆。因果传递使用 flow，组织分层使用 hierarchy，多对多依赖使用 network；不得为了“像系统图”而放三个没有信息增量的圆。
- S17 左侧只保留 `.system-kicker + .system-thesis + .system-summary`，用于一句结论和一段解释；右侧 `[data-system-grammar]` 承载唯一关系结构，两列顶部误差不得超过 16px。flow 语法使用纵向弹性的 `.system-flow`，关系容器必须占 `.system-diagram` 至少 85% 高度并让 3-6 个节点均衡消费可用空间，禁止把节点全部堆在顶部；也禁止在左侧再复制 Process / Orchestrate / Deliver 等阶段列表或出现“这里表达的是”“不是套圈”“图的目的是”等制作说明式文案。
- S17 flow 的 `.system-link` 必须独占上下节点之间的连接区；向下箭头放在左侧阶段栏并显示至少 24px，推荐 26-28px，关系标签左对齐到右侧节点正文列。箭头应与上下节点的 `.system-level` 共享阶段轴，禁止贴住卡片外缘、漂到正文中央，或用贯穿节点的装饰线替代明确连接器。
- S23 分组柱图使用完整 1px hairline 绘图区边框，`--chart-safe-inline` 必须为首末柱预留至少 28px 左右安全区，`--chart-value-headroom` 为最高柱的数值标签预留顶部空间。`.chart-value` 必须以 `left:0;right:0;text-align:center` 覆盖整根柱宽，不使用 `translateX(-50%)` 居中，避免 `chart-rise` 的纵向 transform 覆盖后标签偏移；`.chart-x-labels` 使用相同左右 padding 保持类别中心对齐。
- S24 折线图使用完整 1px hairline 绘图区边框，并在 `.line-plot` 内以 `.line-geometry` 包住 SVG、点和终值标签；该层左右安全区至少 28px，`.line-x-labels` 使用相同 padding。首末采样点、描边和终值标签都必须落在绘图区内部，不得依赖父容器裁切隐藏越界。`.line-end-label` 必须以透明底停在对应末端点的左上肩位，与点位横纵方向至少保持 4px 间距；禁止加白底/色块或压在线、点上。
- 所有原生图表与 XREAL ECharts 共用 `--chart-series-1/2/3/4`、`--chart-critical`、`--chart-track`、`--chart-grid`、`--chart-frame`。稳定系列只按近黑→中性深灰→中性浅灰→最浅灰分配；不得混入蓝灰或临时色。红色不是默认第三系列色，只用于一个有明确结论、风险或警示依据的关键系列/数据点。S23/S24 的四边 frame 必须同色同粗，第一/最后网格线不得与 frame 重叠形成双描边。
- 信息组：`xreal-bento`；整体外框使用 `--radius-sm:8px`、内部区块直角、无阴影，一个红色语义点。需要按真实优先级改变卡片面积时使用 S28 的 `priority-bento` / `priority-tile`，不要改写 S19
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

S12 manifesto 中的产品标志只承担身份落款，不是第二主标题。放在透明的 `.ink-banner-full` 身份行时，其渲染宽度控制在页面内容宽度的 10%-16%，标准值为 `min(14vw,220px)`，并保持官方比例；不得通过放大产品标志与 manifesto 主标题争抢层级，也不得在底部增加整块黑色通栏。

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
- S12 宣言页存在清晰语境匹配时，可使用横版 lifestyle、conceptual 或品牌 KV 作为 `.manifesto-media` 全幅背景；媒体不得是透明产品 cutout / packshot，必须以中性黑蒙版保护白字与页眉。底部仅保留透明身份行，产品标志与少量支持信息直接叠在背景上，不增加整块黑色通栏。无合适媒体时保持纯黑，不为填空白强行用图。
- S19 Bento 的大面积 `.hero` 主卡在存在合适 lifestyle / contextual 媒体且文字较少时，可以使用 `.hero.has-media + .bento-hero-media[data-media-role="context-evidence"]` 全幅铺底，并声明 `data-media-fit="full-bleed" data-media-contrast="darken"`。媒体应在宽高两个方向覆盖父卡至少 95%；文字直接反白，不叠白色或半透明面板。默认使用 `--media-scrim-alpha:.56`，并保证 `image brightness × (1 - 最浅蒙版 alpha) <= .44`；每个小字号眉题、正文与单位仍须分别通过 `4.5:1`，不能只检查标题。S19 仍只圆整体外框，媒体和内部 article 不增加独立圆角。
- 只有文字直接叠在照片或场景媒体上时才使用深色蒙版；图片与文字互不重叠的 inset / contain 证据图不加蒙版。媒体细节与可读性通过图片亮度、最浅蒙版、`object-position` 和反白透明度共同平衡；若安全阈值下主体细节仍不可接受，应换图、改裁切或回退无图版式，而不是继续压暗。
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

正文页只能使用 26 个已登记版式（`S01-S08`、`S11-S28`）；`S09 Dot Matrix Statement` 与 `S10 Split Closing` 已移除。首页/尾页只能使用 `XREAL-COVER-BLACK` / `XREAL-CLOSING-BLACK`。每个 section 必须写 `data-layout="Sxx"`。

封底 `XREAL-CLOSING-BLACK` 必须是整套 deck 的最后一个 section，并使用 `.slide.accent + .xreal-closing-lockup + .xreal-closing-thanks + .xreal-closing-mark + .xreal-closing-logo` 骨架与 `data-animate="closing-thanks"`。大号 `Thanks` 居中，小号企业 Logo 固定在底部中央；可按 `data-media-match` 使用安静的官方媒体背景。进入该页时隐藏底部分页导航。所有结论与行动建议应在封底前一页完成。

| 版式 | 用途 |
|---|---|
| S01 | Index Cover；章节标题 Hero 使用 `S01 + section-hero` 登记变体 |
| S02 / S11 | 垂直 / 横向时间线 |
| S03 | 核心论点 / statement |
| S04 / S05 / S13 / S17 | 定义、分层、三力、系统关系 |
| S06 / S07 / S15 / S20 / S21 | KPI、排名、矩阵、账单、规格 |
| S08 | Duo Compare；地点/路线页扩展为 XREAL Map Component |
| S12 / S14 / S18 / S19 | Manifesto、闭环；S18 可挂载 XREAL Pie，S19 可挂载 XREAL Bento |
| S16 / S22 | 多卡简报 / 21:9 Image Hero |
| S23 / S24 | 分组数据比较图 / 时间或连续变量折线趋势图 |
| S25 / S26 | 时间 × 层级的产品路线矩阵 / 媒体证据支持的里程碑画廊 |
| S27 | 必须同页保留的大量相互依赖信息：总述 + 三组并行综合 |
| S28 | Priority Bento：在 4 种内容驱动剪影中选择，用一个主卡、1-4 个中卡与支持卡按面积表达卖点优先级 |

默认 XREAL Style locked mode：不要临时启用历史实验 `P23/P24`、Evidence Grid、自由 SVG 页面或未登记正文结构；它们与正式 `S23/S24` 图表版式无关。只有用户明确要求实验版式时才可例外，并在验证时显式允许。

章节标题 Hero 变体必须使用 `.xreal-section-title` 和正文级 `chrome-min`,只放小型章节标识、单一主标题和一句引导语。可使用 `hero light`、浅灰或 `hero dark`,但禁止 `.xreal-cover-title`、`slide accent` 满屏纯黑、巨大章节编号、目录列表或三行 `cover-row`,以确保层级低于 S01 Index Cover。

图表选版先判断数据形状：3-8 个无连续顺序类别 × 2-4 个同量纲系列使用 `S23 Data Chart`;时间或连续变量上的 1-3 个系列、每系列 4-12 个点使用 `S24 Line Chart`。简单柱图/折线优先使用原生组件；复杂分布、矩阵、流向、网络或层级数据才添加 `data-chart-engine="echarts"`，并按 `references/xreal-echarts.md` 映射到 S23/S24/S17/S08。所有图表必须提供单位、HTML 图例、数据来源和结论标题；不同量纲默认拆图，禁止无说明双轴。手写 SVG 只用于 S24 的折线与点且不写 `<text>`；ECharts 运行时生成的 SVG/Canvas 仅限合法图表几何。

#### 3.3.1 · 锁定语法，弹性容量

“锁定版式”锁定的是信息语法、视觉 token、层级关系和必须结构，不是把列宽、行高、卡片面积、媒体占比或强调位置写死。填内容前必须先做一次 **content-to-container fit**：逐块标记其语义优先级、正文量、数据量、媒体需求与阅读顺序，再分配容器；禁止先复制示例坐标或卡片顺序、再把文本硬塞进去。

- 同级、同类且信息量接近时才使用等权等面积卡片；差异明显时，优先调整登记范围内的列宽、行高、卡数、跨度或切换更合适的正式版式
- 短内容可以进入小型支持卡；只有它是主结论、关键数据、风险、转折，或有语义媒体承担主要面积时，才可占据大卡。大面积留白必须是明确层级选择，不能只是模板剩余空间
- 长内容不得进入窄列或小卡。先扩大容器、收窄相邻低优先级区域、调整组内行比例或改用 S27；不得通过缩小正文、压紧行距、隐藏溢出或静默删减来适配
- 媒体面积由证据价值与构图决定；短文案 + 合适媒体可以形成大卡，长文案则优先使用稳定文本区，不让图片挤占必要阅读空间
- 示例 HTML 中的卡片顺序、强调位置和网格坐标都只是结构样例，不是默认答案；生成新页面时必须重新判断
- 纯英文/数字编号列表使用固定 `ch` 编号列、tabular numerals 和一致的文本起始轴；不得让 `01/02/10` 的宽度变化推动后方标题

S23 原生柱图默认使用 `data-scale-mode="auto"`：`.chart-bar[data-value]` 保存原始数值，运行时从当前数据域生成可读的 5 级 nice scale，零基线保持不变，最高柱通常占绘图区约 72%-96%。只有跨页或跨图需要严格共享量纲时，才使用 `data-scale-mode="fixed" data-axis-min="..." data-axis-max="..."`；不得为了复用示例纵轴而让所有柱子异常矮小。

产品组合同时包含时间/阶段和第二层级维度时，使用 `S25 Portfolio Roadmap Matrix`，而不是把媒体卡塞进 S23 柱图。S25 只允许 2-4 个 period、2-4 条中性泳道和 3-7 个媒体节点；纵轴标签列按内容收紧并左对齐，不为短标签预留大块空白；节点必须声明百分比 `--x/--y/--w/--h`，示意路线必须明确标注为 illustrative。需要用连续媒体证据讲述 4-6 个阶段时使用 `S26 Milestone Gallery`；每个 `.milestone-entry` 使用统一浅灰底、1px 边界、等距 padding 和 8px 小圆角，并包含媒体、标题和短说明。`.milestone-year` 只在真实年份、明确阶段名或版本号提供了标题之外的信息时使用；使用时每卡都出现，不使用时整组删除，禁止用 `01 · Optics` / `04 · Everyday` 这类重复翻译标题制造层级。底部综合链保持扁平 hairline，不做按钮或 ribbon。

S15 Matrix + Hero Stat 用于 8-12 个同类短项和一个汇总指标。`.matrix-fill` 必须以弹性行高主动消费正文剩余高度，至少约占页面高度 32%，矩阵到 `.hero-stat-bottom` 保持 8-40px 紧凑间距；不得让矩阵悬在上半页并在下方留下大块无意义空白。

S06 KPI Tower 的各 `.body-block` 必须落在同一共同基线上，与 `.bar-towers` 的底部轴线零间距；允许在塔容器上使用 `margin-bottom:-1px` 抵消 1px 边界的渲染缝隙。柱体底角保持直角，不得做成悬浮在横线上的圆角矩形。

当用户明确要求“一页总览”“不要拆分”，或内容只有同时可见才能完成比较、推演或共同判断时，使用 `S27 Dense Synthesis`。它固定为 1 个总述带 + 恰好 3 个主面板 + 7-12 个条目，但三个面板的列宽与组内行高必须根据内容量调整；`.dense-progression` 可使用 `data-row-profile="lead-heavy|middle-heavy|closing-heavy"`，不能把长项和短项强制分成等高三格。三个面板可分别使用阶段比较、能力递进和特征解释，但必须共享同一结论。总述标签与结论共享同一左轴，三个主面板通过统一中性底色、等高外框和留白建立结构；内部条目默认不重复添加分割线。三项横向比较若仅靠空白难以区分，可使用三个等宽、无边框、无阴影的浅中性子区域，并把 kicker、阶段名、能力名和说明紧凑聚合在各自顶部；不得把信息拉散到容器四角。先合并真正重复且无信息增量的措辞、调整列宽和内部网格，再处理溢出；所有被合并来源项仍须保留独立覆盖 ID。不得删除关键内容或自动拆页。最多 1 个黑色焦点区和 1 张语义媒体；`.is-focus` 只能落在当前内容中真正的主结论、风险或关键转折项，并用 `data-focus-reason` 写明依据，不能固定强调第 1/2/3 项。媒体只可作为该焦点区的 `cover + darken` 背景，不缩成装饰缩略图。禁止 tab、badge、button、彩色面板、阴影和 dashboard 控件。

当同一主题中存在一个明确核心卖点、1-4 个次级技术点和若干支持信息，且面积差异能比颜色更准确地表达优先级时，使用 `S28 Priority Bento`。它固定使用 12 列 × 6 行网格，但不固定成一套卡片坐标；`.priority-bento` 必须用 `data-bento-variant` 显式选择 `left-focus`、`right-focus`、`panorama` 或 `center-focus`。先依据内容关系与媒体构图选择剪影：左起主叙事用 `left-focus`，左侧证据导向右侧核心或媒体主体偏右用 `right-focus`，宽场景/长主张/横向系统能力用 `panorama`，核心能力被多项证据环绕用 `center-focus`。不得为了制造变化随机轮换、无语义镜像或先套坐标再硬塞内容。

S28 使用 5-9 张 `.priority-tile`、恰好 1 张 `.is-primary`、1-4 张 `.is-secondary` 与至少 2 张 `.is-support`，并至少包含 3 种不同卡片面积。每张卡必须通过 `--col/--span/--row/--rows` 明确占位；主卡两边均不少于 3 个网格单元，占内容网格约 25%-50%，实际位置必须符合所声明变体。大小只能由内容优先级决定。全页使用白、浅灰和近黑结构，所有卡片独立使用 8px 小圆角、1px 中性边界、等距 padding、无阴影；最多 1 个红色语义点。使用 1-4 张语义匹配媒体：压图文字必须 `cover + darken` 并直接反白，非压字媒体使用 `contain + none`，不得叠白色文字面板。禁止渐变、多彩卡片、pill、badge、button、tab、ribbon 与软件控件感。

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
- 所有来源与说明注脚统一使用 `--footnote-size:max(11px,.62vw)` 和 `--footnote-bottom-offset`：左端与 `.canvas-card` 内容轴对齐，底部基线统一停在导航安全区上方。`.section-hero-foot`、`.chart-foot`、`.roadmap-source`、`.milestone-source`、`.dense-source`、`.priority-source` 均不得使用 border、分割线、底色或额外 padding。

#### 3.5 · 投屏字号与字重

最低字号：正文/主要说明 `18px`，卡片描述/列表/时间线/caption `16px`，meta/kicker/图表标签 `14px`。唯一明确例外是来源与说明注脚，统一使用 `max(11px,.62vw)`；它不是正文、图表标签或卡片说明。内容放不下时先删除视觉填充、调整间距和列宽、换高容量版式，再增加正文页或附录页。只有确认表述完全重复时才可忠实合并，并保留全部来源 ID；若固定页数仍冲突，先请求用户选择增加页数或进入 `editorial-summary`，不得自行删减。

字重由信息角色固定，同一角色在整套 PPT 中保持一致：

| 信息角色 | 推荐字重 |
|---|---|
| Hero / 封面 / 章节主标题 | 纯英文 XREAL Diatype 500；中文/日语及对应混排 IBM Plex Sans SC / JP 600 |
| 页面标题 / 模块标题 | 纯英文 500；中文/日语及对应混排 600 |
| 关键 KPI / 数据 | 纯英文 500；中文/日语及对应混排 600；每页最重要的单个数据可使用 700 |
| 副标题 / lead | 400 |
| 正文 / 描述 | 400 |
| caption / 辅助元数据 | 纯英文 400；中文/日语及对应混排 450 |
| kicker / 导航标签 / 图表标签 | 500 |

中文标题使用双约束 `font-size:min(Xvw,Yvh)`；2 行或更长时可在不改变事实、范围和语气的前提下缩短标题，再降字号。标题下被省略的限定信息必须在正文保留。内容文字禁止使用 100/200/300。

### Step 4 · 校验与视觉检查

生成后先运行：

```bash
node <SKILL_ROOT>/scripts/validate-swiss-deck.mjs path/to/index.html
```

校验器会检查版式登记、`data-image-slot`、SVG 文本、标题对齐，以及可用时的真实渲染溢出、底部空白、nav 安全线和标题间距。修正后重复运行。

`source-faithful` 与 `editorial-summary` 模式还会自动读取 HTML 同目录的 `content-coverage.json`，检查来源 ID、slide 引用与遗漏审批。自动检查不能判断转述是否忠实；必须再按 `references/content-fidelity.md` 做语义核对。

随后执行交付前渲染审阅：

1. 在真实浏览器中以统一的 16:9 演示视口渲染每个 section；等待字体和图片加载完成、入场动效稳定后再截图，不得截取转场中间态或只审阅索引缩略图
2. 如果当前模型支持图像输入，必须实际查看全部页面的最终截图，不得抽样或仅凭 HTML/CSS 推断视觉结果；检查文字、图片、图表和 Logo 是否完整可见，是否存在裁切、重叠、缺图、异常空白、对比度不足、主体误裁、层级或网格错位，以及内容进入分页安全区
3. DOM/Playwright 测量用于判断溢出、尺寸、间距和安全线；多模态审阅用于判断构图、可读性、视觉层级和媒体是否正确。两者必须结合，不能用肉眼估算替代测量，也不能以 validator 通过替代视觉检查
4. 按 `slide id → 问题 → 修复` 记录审阅结果；修复后重新运行 validator，并重新渲染、复审所有改动页。若修改了全局 CSS、模板 token、字体或共用组件，必须重新渲染并复审全部页面
5. 支持图像输入时，仍有未审阅页面或阻断性视觉问题不得交付。若环境不支持图像输入，仍须完成真实渲染测量，并在交付说明中明确披露“未执行多模态视觉审阅”，不得宣称已完成视觉 QA

逐页审阅至少检查：

1. 标题是否左上对齐，并使用与语言语境一致的 500/600 稳定字重
2. 图片、正文、caption 是否吸附到同一网格轴
3. 是否出现装饰性渐变、阴影、发光、霓虹、大圆角、胶囊形、多个 accent、自绘 SVG 插画或不必要的装饰；full-bleed 媒体仅允许为文字可读性使用中性黑透明蒙版
4. 最低内容是否进入分页安全区
5. 动效稳定后再判断版式；需要时按 `B` 验证静态模式仍可读

### Step 5 · 本地预览、交付与使用说明

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

完成验证后，必须把“如何使用、如何保存、如何分享”作为交付的一部分主动告诉用户，不得只回复“已完成”或只给文件名。

交付前先解析并确认项目输出目录与最终 `index.html` 的**绝对路径**。最终回复必须包含：

1. **输出文件夹**：直接给出项目交付目录的绝对路径；在支持本地文件链接的客户端中使用可点击的 Markdown 文件夹链接
2. **演示文件**：直接给出最终 `index.html` 的绝对路径和可点击链接
3. **如何打开**：说明双击 `index.html`，或在浏览器中打开；若收到 ZIP，必须先完整解压再打开
4. **如何保存**：说明需要保留整个输出文件夹及其内部目录结构，不要只移动或另存 `index.html`，也不要改动 `assets/`、`images/` 的相对位置
5. **如何分享**：说明将整个输出文件夹压缩为 ZIP 后发送；`file:///...` 是本机地址，不能作为他人可访问的分享链接
6. **网页链接**：用户需要点击即看的链接时，说明必须把整个输出目录部署到静态网站或公司批准的内部服务器；涉及内部或未发布信息时，不得擅自公开部署
7. **验证结果**：简要报告 validator、离线打开、内容覆盖与视觉 QA 状态；未执行的检查必须如实说明

用户明确要求可分享文件、交付包或压缩包时，完成验证后生成包含整个输出目录的 ZIP，并同时给出 ZIP 的绝对路径。用户未要求生成 ZIP 时，至少说明“压缩整个输出文件夹再分享”，不得暗示只发送 `index.html` 一定可用。

最终回复使用下面的最小交付结构，并将占位路径替换为真实绝对路径：

```text
已完成。

输出文件夹：/absolute/path/to/project/
演示文件：/absolute/path/to/project/index.html

使用：完整保留当前文件夹，双击 index.html 即可离线演示。
保存：不要单独移动 index.html；assets、images 等目录需要与它一起保留。
分享：压缩整个输出文件夹后发送。不要分享 file:/// 本地地址。
验证：validator 已通过；已完成离线打开、内容覆盖和逐页视觉检查。
```

## XREAL Style 核心原则

1. **黑白灰结构 + 红色语义**：黑色承担结构，红色只在关键位置出现。
2. **语境化无衬线排版**：纯英文 deck 使用 XREAL Diatype，中文或中英混排 deck 使用 IBM Plex Sans SC，日语或日英混排 deck 使用 IBM Plex Sans JP；任何衬线字体或按字符混用品牌字体都是错的。
3. **卡片小圆角**：卡片型实体块统一使用 `--radius-sm:8px`，尤其是 S04/S05/S06/S07/S13/S16/S26/S27/S28；S06/S23 等基线柱体只圆顶部两角，底角为 0 并贴齐 x 轴；S19 Bento 只圆整体外框、内部区块直角；页面画布、分割线和坐标轴保持直线；禁止装饰性渐变、阴影、发光、霓虹、大圆角和胶囊形。full-bleed 媒体为保护文字使用的中性黑透明蒙版不属于装饰性渐变。
4. **网格至上**：元素吸附到 12/16 列 grid，左对齐，用留白制造非对称。
5. **角色化字体层级**：主标题与正文保持明显层级；纯英文主标题默认 500，中文/日语及对应混排主标题默认 600，正文 400，标签 500。
6. **图片是证据**：先匹配槽位和比例，再生成或适配图片。
7. **动效可降级**：每页使用语义化 recipe；`B` 键必须能切换到静态可读状态。
8. **版式必须登记**：正文只从 `S01-S08`、`S11-S28` 选择；`S09` 与 `S10` 已移除，实验结构必须显式标记。
9. **复杂图表受控**：ECharts 只负责复杂数据几何、布局与交互，必须使用 XREAL 主题、类型白名单和离线单文件流程，不得带入默认 dashboard 视觉。
10. **开场/收束媒体**：封面与封底使用 `#000000` 基底并声明 `data-media-match`；命中合适官方媒体时使用登记的背景类，不使用 ASCII、纹理、CSS 图形或动态背景。
11. **减法优先**：移除无信息价值的角标、眉题和分割线；bullet 统一使用实心圆点。
12. **自然大小写**：英文短语使用 sentence case / natural case 与标准字距；全大写仅用于品牌字标、通用缩写和短型号代码。
13. **内容保真优先**：用户提供成体系材料时默认逐项覆盖；版式、页数和视觉留白不得成为静默摘要或删除原文信息的理由。

## 资源文件导览

```
xreal-ppt-skill/
├── SKILL.md
├── assets/
│   ├── template-xreal.html
│   ├── brand/xreal-logo-black.svg
│   ├── fonts/ (XREAL Diatype + IBM Plex Sans SC + IBM Plex Sans JP)
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
    ├── content-fidelity.md
    ├── brand-xreal.md
    └── checklist.md
```

## 推荐加载顺序

1. 读取本文件
2. 执行 Step 0 更新检查；有更新时先询问用户
3. 读取 `assets/template-xreal.html` 的 `<style>` 块
4. 用户提供成体系原始材料时读取 `content-fidelity.md` 并先建立覆盖清单
5. 读取 `swiss-layout-lock.md` 和 `layouts-swiss.md`
6. 读取 `brand-xreal.md`
7. 需要地图时读取 `swiss-map-component.md`
8. 需要复杂图表时读取 `xreal-echarts.md`
9. 生成后运行 validator，再读取 `checklist.md` 做最终自检

## 视觉锚点

- Massimo Vignelli 的 NYC Subway / Unimark 系统
- *Helvetica Forever* 的字体设计语言
- Josef Müller-Brockmann 的网格系统
- Acne Studios、Off-White、IKEA、Beck Design 的当代 XREAL Style 视觉

把它们当作版式和克制程度的参考，不要把品牌 logo 或具体页面复制到生成结果中。
