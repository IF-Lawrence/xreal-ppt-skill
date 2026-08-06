# XREAL Style 品牌规范

本文件定义 XREAL Style 的品牌化约束。它保留国际主义网格、统一小圆角、发丝线、极致字号对比和克制的品牌语义色，并统一品牌表达层。

## 品牌气质

理性、专业、可信、科技、先锋。页面应当冷静、克制、有结构，禁止装饰堆叠、消费级圆角卡片和任何霓虹效果。

## 圆角策略

- 页面画布和分割线保持直线；版式内部的结构容器、主要色块和图像容器统一使用 `--radius-sm: 8px`。
- 信息容器、控件和局部卡片沿用 `--radius-sm`，不单独声明其他圆角值。
- 接触共同基线或 x 轴的垂直柱体只在顶部使用 `--radius-sm`，底部两角必须为直角并与轴线齐平；独立悬浮的 KPI cap 仍使用四角小圆角。
- S19 Bento 仅整体外框使用 `--radius-sm`；直接子区块全部为直角，依靠 1px 间隙建立内部结构。
- 不使用大圆角、胶囊形、全圆角按钮或消费级圆角卡片；圆角不应成为页面的主要识别特征。

## 颜色 Token

主色系统以黑、白、灰为基础：黑色承担页面结构和主文字，灰色与白色承担层级与界面支撑；红色仅作为关键操作、重点数据和警示的少量强调，银色与金色只用于技术质感和品牌价值语义。

```css
--paper: #FFFFFF;          /* 主背景 */
--ink: #0A0A0A;            /* 主文字 / 黑色块 */
--pure-black: #000000;     /* 封面 / 封底黑色区域 */
--grey-1: #F2F3F4;         /* 信息区块 */
--grey-2: #D6DADE;         /* hairline / 边界 */
--grey-3: #667085;         /* 辅助文字 */
--accent: #0A0A0A;         /* 结构锚点：XREAL 黑色 */
--brand-red: #D71920;      /* 关键操作 / 重点数据，仅语义使用 */
--brand-silver: #A7ADB4;   /* 技术质感 / 次级标注，默认不启用 */
--brand-gold: #B08D57;     /* 品牌价值 / 特殊荣誉，默认不启用 */
--radius-sm: 8px;           /* 内容容器 / 色块 / 图片 / 控件 */
```

### 颜色使用规则

- 普通正文、网格、坐标轴和辅助信息只用黑、白、灰。
- 当前基础模板以黑色 `#0A0A0A` 作为结构锚点，不引入额外色相作为主题色。
- 红色只允许用于明确的关键数据、警示或操作状态；同一页默认最多一个红色语义点。
- 黑色反转卡同样属于语义强调，不是装饰手段。S16 等并列卡默认等权；只有存在明确优先级时才允许一张反转卡，并声明 `data-emphasis`。
- 银色和金色只用于技术质感或品牌价值的极少量标记，不作为大面积背景。
- 不使用装饰性渐变、投影、玻璃拟态、发光边缘或多色高亮拼贴。full-bleed 媒体仅可为压图文字的可读性使用中性黑透明蒙版，不得使用彩色渐变。
- 明确单一产品主题时，先检查对应 `00-product-marks/`。企业 XREAL Logo 继续占据页眉品牌位；官方产品标志用于封面、章节、宣言横幅或产品识别位。已有官方标志时不得用手打字仿制，也不得把产品标志替换到 `chrome-min`。

## 字体

- 英文标准字体：XREAL Diatype，文件位于 `assets/fonts/XREALDiatype-*.otf`
- 中文标准字体：IBM Plex Sans SC，文件位于 `assets/fonts/IBMPlexSansSC-*.otf`
- 字体选择以整套 PPT 的语言语境为单位，不按字符语言拆分。
- 纯英文 PPT：整套统一使用 XREAL Diatype。
- 中文或中英混排 PPT：整套统一使用 IBM Plex Sans SC；其中的英文、数字、元数据、代码、日期、数据标签和技术标识也使用 IBM Plex Sans SC。
- 一套 PPT 只使用一套主字体，不在不同页面、文本框或中英文字符之间切换品牌字体。
- 中文与中英混排标题全部使用正体；禁止在 `h1`、`h2`、`h3` 和 `.xreal-*-title` 中使用斜体。纯英文标题可在确有必要时使用一次克制的斜体强调。

字体语境：

| PPT 语言语境 | 全局主字体 | 推荐字重 |
|---|---|---|
| 纯英文 | XREAL Diatype | 主标题 Medium；正文 Regular；标签 Medium；关键数字 Medium / Bold |
| 中文 | IBM Plex Sans SC | 主标题 SemiBold；正文 Regular / Text；标签 Medium；关键数字 SemiBold / Bold |
| 中英混排 | IBM Plex Sans SC | 主标题 SemiBold；正文 Regular / Text；标签 Medium；关键数字 SemiBold / Bold |

模板语言标记：纯英文使用 `<html lang="en">`；中文或中英混排使用 `<html lang="zh-CN">`。模板根据该标记在 deck 层级设置主字体；不要为局部英文或数字覆盖 `font-family`。

字重按内容角色固定：

- 主标题和页面标题：纯英文使用 XREAL Diatype Medium（500）；中文或中英混排使用 IBM Plex Sans SC SemiBold（600）。
- 章节标题、卡片标题、导航文字和标签：统一使用 Medium（500）。
- 正文和说明文字：使用 Regular（400）；中文或中英混排中的小字号辅助文字、图注和元数据可使用 Text（450）。
- 关键数字和结论：纯英文使用 Medium（500），中文或中英混排使用 SemiBold（600）；每页最重要的单个数据可提升为 Bold（700）。
- 同一内容角色在整套 PPT 中保持相同字重，字号变化不改变其字重。默认内容样式使用 Regular / Text、Medium / SemiBold 和 Bold 三个层级。

标题层级固定为：

| 层级 | 类名 | 用途 | 相对字号 |
|---|---|---|---|
| 1 | `.xreal-cover-title` | S01 Index Cover / deck 级封面 | 最大 |
| 2 | `.xreal-section-title` | `S01 + section-hero` 单标题章节 Hero 变体 | 小于 Cover、大于普通页面标题 |
| 3 | `.xreal-page-title` | 正文页面标题 | 最小 |

章节 Hero 不是目录或缩小版封面；不得通过巨大章节编号、内联字号、满屏纯黑或封面级 Logo 放大来追平 `.xreal-cover-title`。模板 token 必须保持 `--page-title-size < --section-hero-title-size < --cover-title-size`。

## 数据图表

- 图表页面先写结论标题，再呈现数据；图表占正文主导面积，不叠加 dashboard 式 KPI 卡片、筛选器或软件控件。
- 坐标轴和网格使用 1px 黑/灰 hairline；不使用渐变、3D、阴影、面积光晕、图标柱或装饰性多色。
- 垂直柱体从共同零基线长出，只保留顶部 7-9px 小圆角（标准 8px）；底角为 0，并与 x 轴齐平。
- KPI / 图表展示级大数字的单位统一使用右上肩位：`°`、`%`、`ms`、`Hz`、`in` 等都采用 `vertical-align:text-top`，以 `--unit-mark-opacity:.62` 形成一致的中性对比，并通过 `white-space:nowrap` 避免与数字拆行。文字单位使用 `--unit-mark-gap:.18em`；角度符号使用更紧的 `--unit-degree-gap:.03em`，保持附着但不粘连。`screen` 等多字符英文词单位使用 `.unit-word` 恢复正常字距与词距，禁止继承 KPI 数字的负 tracking。正文句子中的单位不使用 `.unit`，作为普通文本随正文基线。角度禁止放入 `<sub>`；只有科学指数及数学/化学语义使用真正的上标或下标。
- 原生图表与 XREAL ECharts 共用语义色：`--chart-series-1` 近黑、`--chart-series-2` 中性深灰、`--chart-series-3` 中性浅灰、`--chart-series-4` 最浅灰；轨道、网格和 frame 分别使用 `--chart-track`、`--chart-grid`、`--chart-frame`。不得直接把正文辅助文字的蓝灰色或临时色拿来充当系列色。全页只允许一个有明确结论、风险或警示依据的关键系列/数据点使用 `--chart-critical`（映射 `--brand-red`）。
- 每张图必须显示单位、HTML 坐标标签和来源。SVG 只承载折线、点或必要数据几何，不写 `<text>`。
- 原生 S23/S24 使用四边同色同粗的单一 1px `--chart-frame`；第一条和最后一条网格线不得与 frame 重叠形成双描边。S23 首末柱与边界至少留 28px；S24 的 SVG、端点和终值标签统一放入左右至少 28px 的 `.line-geometry`，横轴标签使用相同安全区，不能靠裁切掩盖越界。
- `S23 Data Chart` 使用共同零基线比较 3-8 个类别 × 2-4 个同量纲系列；`S24 Line Chart` 只用于时间或连续变量,限制 1-3 条线。
- 不同量纲默认拆图；不使用无说明双轴。折线通过线型、点型或终值标签辅助区分，不能只依赖颜色。
- 复杂数据形状可使用登记的 XREAL ECharts Component，但必须由 XREAL 主题覆盖默认样式。ECharts 内部标题、图例、toolbox 默认关闭；单位、图例和来源继续使用版式中的 HTML。
- ECharts 只允许黑/灰/银稳定系列和一个 `xrealCritical` 红色系列或数据项；禁止 `shadowBlur`、`colorStops`、面积填充、3D、发光、连续彩虹 visualMap 和 dashboard 控件。

## Logo

品牌 Logo 资产：`assets/brand/xreal-logo-black.svg`。

```html
<img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL">
```

- Logo 默认放在每页 `chrome-min` 的左侧品牌位置或封面左上角；唯一例外是 `XREAL-CLOSING-BLACK` 封底，小号 Logo 固定在画面底部中央，中心位置留给大号 `Thanks`。
- Logo 默认独立出现，右侧不附加 deck 名、章节名或风格说明。
- 只有栏目名等确有导航价值的信息才可与 Logo 相邻；相邻文字使用品牌主字体、标准字距，视觉字高须与 Logo 图形字高一致，并与 Logo 保持至少 `1.6vw` 的明确间距。
- 正文页页眉属于导航层级，必须低于页面标题：Logo 使用 `max(60px,5.2vw)`；IBM Plex Sans SC 相邻文字使用 `.26 × Logo 宽度`，XREAL Diatype 因 cap-height 约为 `0.70em`，使用 `.313 × Logo 宽度`，两者都与 Logo 垂直居中。
- 页眉只承担导航，不应把正文压到页面中部。`chrome-min` 到下一个直接正文块使用 `--chrome-content-gap:24px`；确需紧凑时使用 `--chrome-content-gap-tight:16px`，不使用 48px 及更大的全局页眉下间距。
- 封面可使用品牌层级尺寸：Logo 使用 `max(72px,6.8vw)`。封底 Logo 降为 `max(96px,7.2vw)` 并固定在底部中央；`Thanks` 使用 `min(10vw,17vh)` 的显示级字号居中，不添加相邻导航文字。
- 只使用黑色 Logo；在 `dark` / `accent` 背景上通过 CSS `filter:invert(1)` 反白显示。
- 不拉伸、不旋转、不加阴影、不放进圆角容器。
- Logo 与页面边距对齐，不要贴屏幕边缘。

### 产品标志

- AURA、One Pro、1S、XBX A01+ 的产品标志存放在各自 `assets/media/<product-line>/00-product-marks/` 中。
- 企业 XREAL Logo 负责页面 chrome 的品牌识别；产品标志只用于封面、章节页和明确的产品识别场景，不替代企业 Logo。
- 只使用资产库中的官方文件及其黑版、白版或锁定组合；不重绘、不改字距、不拉伸、不拼接，也不通过 CSS 自行改色。
- 产品标志的视觉层级服从页面语境。S12 manifesto 横幅中的产品标志只是身份落款，渲染宽度应为横幅的 18%-26%，标准使用 `min(23vw,320px)`；不得放大成第二主标题。
- 产品标志支持 SVG、PNG 和 WebP。缺少合适版本时使用产品名称文字，不仿制产品 Logo。

## 背景与装饰

- 封面与封底使用 `--pure-black: #000000` 作为基底。媒体语义匹配成功时，可叠加一张来自当前产品线或用户提供的官方照片、KV、产品 beauty 或透明产品图；不使用 ASCII、点阵、纹理、噪点、CSS 图形或动态装饰背景。
- 封面和封底必须声明 `data-media-match="matched|none"`。`matched` 时分别使用 `.xreal-cover-media` / `.xreal-closing-media` 及对应 `data-media-role`；`none` 表示已审计但没有合适素材，而不是跳过媒体检查。
- 封底不承载额外信息内容：除背景媒体、反白 XREAL Logo 与自然大小写 `Thanks` 外，不显示其他文字或图形。背景媒体只允许低干扰 lifestyle、conceptual 或品牌 KV，并必须退居品牌落款之后；禁止直接放透明产品 cutout、白底产品图或 packshot。
- 禁止 AI 或页面代码自行绘制 SVG 插画作为配图，包括人物、设备、场景、抽象科技图形和装饰性构图；不得用内联 `<svg>`、Canvas 或大量 CSS 图形替代真实配图。
- SVG 仅用于已有企业/产品品牌资产，以及承担信息表达的图表、地图、流程和数据几何。页面配图只使用 `assets/media/` 或用户明确提供的素材。
- 无信息价值的眉题、角标、风格说明和装饰性标签直接删除；不要用小标题重复主标题已经表达的内容。
- 分割线只用于真实的结构分区、表格边界或数据刻度；标题与说明之间、封面底部等无需分区的位置不添加装饰线。
- 可见文字默认使用自然大小写：普通英文短语使用 sentence case / natural case，不把眉题、导航、标签、图注或页脚整句写成全大写。
- 全大写只用于 XREAL 官方字标、行业通用缩写（如 AI、AR、KPI、PPT）和短型号代码；`TAKEAWAYS`、`CLOSING`、`GENERIC TECH` 等普通词必须写为 `Takeaways`、`Closing`、`Generic tech`。
- 描述性小标题与辅助文字使用标准字距，不通过大幅 tracking 制造“科技感”；默认 `letter-spacing: normal`，技术编号等特殊场景也不得超过 `0.05em`。
- 模板不得使用 `text-transform: uppercase` 强制转换；大小写必须在内容层正确书写。
- 页面不显示“翻页 / 静态 / 索引”等操作提示；交互功能通过键盘保留，不作为视觉元素占用画布。
- 页面不显示页码；不得在页眉、Logo 后或角标中放置 `01 / NN` 一类计数。
- 底部导航保持极低对比度：亮底普通点 `.08`、当前点 `.18`；暗底普通点 `.10`、当前点 `.22`。当前点只通过稍高透明度和加宽表达，不使用实色 `var(--accent)`。
- 列表默认使用实心圆点，不使用短横线模拟 bullet。
- 时间线节点名称使用 600 字重，说明文字保持 400，以角色差建立层级。

## 图标

产品特性、功能模块和数据行图标使用 Google Material Symbols Outlined，遵循 Google Material Icons 的统一线性风格：

```html
<span class="material-symbols-outlined" aria-hidden="true">layers</span>
```

- 不使用 emoji。
- 不手绘 SVG 图标；地图、流程和数据几何图形除外。
- 同一页统一使用 Outlined，不混用 Filled、Rounded、Sharp。
- 默认 `FILL 0`、中等字重、统一尺寸和视觉基线。
