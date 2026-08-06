# XREAL Style Layout Lock

本文件是 XREAL Style 的硬约束。它的目的不是增加灵感,而是防止生成时“看起来像 XREAL Style,但已经脱离原始模板”。

## Golden Source

版式基准是仓库内的 `assets/template-xreal.html`(由作者原始参考 PPT 派生;原始文件不随仓库分发)。当前正式登记 24 个版式：`S01-S08`、`S11-S26`；原 `S09 Dot Matrix Statement` 与 `S10 Split Closing` 已移除。

XREAL Style 生成时,除用户明确要求实验版式外,只能从下面登记的 24 个版式中选择。新增首页/尾页可以使用 Skill 里的黑色基底版本 `XREAL-COVER-BLACK` / `XREAL-CLOSING-BLACK`，并按媒体匹配结果选择纯黑或官方媒体背景；正文页必须来自这 24 个版式。

## 生成前硬规则

1. 每个正文页都必须先选一个登记版式,并在 `<section>` 上写 `data-layout="Sxx"`。
2. 不允许临时发明未登记正文结构。历史实验 ID `P23/P24` 继续禁用，与正式登记的 `S23/S24` 无关。需要图片时,优先使用 `S22 Image Hero`;多图时使用 `S15/S16` 的原始网格骨架做图片格改造,不要发明新的证据墙。唯一登记的交互扩展是 `S08 + XREAL Map Component`,详见 `references/swiss-map-component.md`。
3. 顶部中文标题默认左对齐并贴近左上内容轴。除 `S03` statement 版式以及只含 Logo + Thanks 的 `XREAL-CLOSING-BLACK` 封底外,不要把大标题放到页面水平中心。
4. SVG 仅用于图表、地图、流程和数据几何，并在 `<svg>` 上标记 `data-svg-role="chart|map|flow|data-geometry"`；禁止把人物、设备、场景或抽象科技图形画成 SVG 插画配图。SVG 不写可见文字，所有文字标签用 HTML 放在网格、卡片或 caption 里。
5. 图片槽位和媒体资产比例必须匹配。先确定版式和槽位,再从 `assets/media/` 或用户素材中选图。
6. 首页/尾页必须以纯黑为基底并声明 `data-media-match="matched|none"`；匹配到合适官方媒体时可使用受控背景图，但不得加入 ASCII、点阵、纹理、CSS 图形或动态背景。
7. Logo 默认独立;如确有导航文字与 Logo 相邻,文字使用标准字距且视觉字高与 Logo 一致。
8. 无信息价值的眉题、角标和分割线应删除;列表使用实心圆点,时间线节点名称使用 600 字重。
9. 可见文字默认使用自然大小写和标准字距;禁止普通英文词组全大写,禁止 `text-transform:uppercase`;仅 XREAL 字标、通用缩写和短型号代码例外。
10. 保留方向键、`B` 静态模式和 `ESC` 索引功能,但页面不得显示右下角操作提示。
11. 正文页 `chrome-min` 使用紧凑导航级品牌尺寸;封面/封底使用品牌级尺寸。两级都保持 Logo 与相邻文字视觉字高一致。
11.1 `chrome-min` 到首个正文块固定使用 `--chrome-content-gap:24px`，紧凑变体使用 `16px`；不得恢复 48px 页眉下间距，也不得在首块叠加补偿性上边距把整页内容再次下推。
12. 页面不显示页码;页眉、Logo 后和角标中均不得出现 `01 / NN` 一类计数。
13. Logo 邻接文字必须按字体单独光学校准:IBM Plex Sans SC 使用 `.26 × Logo 宽度`,XREAL Diatype 使用 `.313 × Logo 宽度`。
14. 底部导航为极低对比度弱提示:亮底普通/当前 `.08/.18`,暗底普通/当前 `.10/.22`;当前点禁止实色 accent。
15. 页面画布、分割线和坐标轴保持直线；卡片型实体块统一使用 `--radius-sm:8px`。该规则明确覆盖 S04 Six Cells、S05 Three Layers、S06 KPI Tower、S07 Horizontal Bar、S13 Three Forces、S16 Multi-card Brief；不得使用不同圆角值、大圆角或胶囊形。接触共同基线的垂直柱体是语义例外：只保留 8px 顶部圆角，底角必须为直角并贴齐 x 轴。S19 Bento 只圆整体外框，内部区块保持直角。
16. 禁止任何霓虹、发光边缘、`text-shadow`、`drop-shadow` 或非 `none` 的 `box-shadow`。
17. `XREAL-CLOSING-BLACK` 必须是最后一个 section，使用黑色基底 `.slide.accent`；大号 `.xreal-closing-thanks` 居中，小号 `.xreal-closing-logo` 通过 `.xreal-closing-mark` 固定在底部中央。可使用低干扰 lifestyle、conceptual 或品牌 KV 背景，但禁止直接产品 cutout / packshot、split、takeaway、作者日期、页码、CTA 或额外说明。

## 登记版式

| ID | 原始页 | 名称 | 必须保留的骨架 | 图片规则 |
|---|---:|---|---|---|
| S01 | 01 | Index Cover | 基础版保留三行 `cover-row`,左大编号,右大标题；章节标题页只使用下方登记的 `section-hero` 次级变体 | 无 |
| S02 | 02 | Vertical Timeline + KPI | 顶部左对齐标题；中部 `.timeline-v` 占正文宽度 72%-82%，必须含统一 `.tl-head` 与按行连续绘制的贯穿轴/节点，以及“年份 + 同口径指标 + 阶段名 + 体验影响”；行横线必须从 axis 列右侧开始，不与竖轴叠线；底部 `.kpi-row-4` | 无 |
| S03 | 03 | Split Statement | `.slide.split` 双半屏,左巨字,右灰底解释 | 无 |
| S04 | 04 | Six Cells | 顶部左对齐标题,下方 `.sub-grid-3-2` 六张独立小圆角卡 | 最多 1-2 张稀疏技术卡可配图；源画布留白大时用 `inset-prominent`，高度 28%-45%、宽度至少 80%，不加蒙版 |
| S05 | 05 | Three Layers | 顶部左对齐标题,下方 `.stack-row` 三个小圆角色块 | 最多一个核心层可配图；横版低干扰媒体可全幅铺底并加深色渐变蒙版，否则 inset；图标默认保留 |
| S06 | 06 | KPI Tower | 左标题+右说明,下方不等高 KPI 塔；cap 四角小圆角，body 仅顶部小圆角且底部直角贴共同基线 | 无 |
| S07 | 07 | Horizontal Bar | 左对齐标题,横向条形图；标签列使用内容宽度，标签到 track 保持 16-32px 紧凑间距；track 与 fill 使用小圆角但不得做成胶囊；fill 以 `--value` 持久保存真实宽度，动效只做 `scaleX`；普通条统一单一系列色，最多一个语义关键项使用红色 | 无 |
| S08 | 08 | Duo Compare | `.duo-compare` 两列 + 中线 | 无;地点/路线内容可使用 `S08 + XREAL Map Component` 替换右侧插槽 |
| S11 | 11 | Horizontal Timeline | 原始 `grid-template-columns:auto 1fr` 头部 + `.timeline-h` | 无 |
| S12 | 12 | Manifesto + Ink Banner | 大字 statement + 底部通栏 ink 条；产品标志仅作身份落款，占横幅 18%-26% | 可按语境使用横版 lifestyle、conceptual 或品牌 KV 全幅背景并加深色蒙版；禁止透明产品 cutout / packshot；无合适媒体时保持纯黑 |
| S13 | 13 | Three Forces | 左 ink hero 小圆角色块 + 右 3 张小圆角卡 | 无 |
| S14 | 14 | Loop Form | 左 3-5 步列表 + 右单一细线闭环；灰色底环、方向段、HTML 节点与中心结论；最多一个返回段使用红色 | SVG 禁止文字,标签改 HTML；禁止粗圆环、浮动外标签与重复装饰点 |
| S15 | 15 | Matrix + Hero Stat | 顶部左对齐标题,中段 6×2 矩阵,底部巨数 | 多图可改造矩阵格,同组统一 `21:9` |
| S16 | 16 | Multi-card Brief | 顶部左对齐标题,下方 3×2 小圆角微卡；默认六卡等权。仅有明确优先级语义时，允许一张高对比卡并声明 `data-emphasis` | 多图可改造卡片内容,同组统一 `21:9` |
| S17 | 17 | System Diagram | 先声明 `flow|hierarchy|network|containment`；左侧只放结论与解释，右侧为唯一关系图且至少占画布 42%；两列顶部误差 ≤16px；flow 使用 3-6 节点和明确连接，并纵向消费关系图区至少 85% 高度 | 禁止左侧复制阶段列表；同心圆仅限真实 containment；SVG 如使用则禁止文字，标签改 HTML |
| S18 | 18 | Why Now | 三列递进 + 底部巨数 | 无 |
| S19 | 19 | Four Cards | 顶部黑线 + 四列均分 | Bento 扩展的稀疏 hero 主卡可使用全幅 contextual/lifestyle 媒体；宽高覆盖父卡至少 95%，文字压图时使用 `.28-.48` 深色蒙版；内部仍直角 |
| S20 | 20 | Stacked KPI Ledger | 纵向账单式巨数 | 无 |
| S21 | 21 | Tech Spec Sheet | 大标题 + 三 KPI + 右下竖线矩阵 | 无 |
| S22 | 22 | Image Hero | 顶部全宽图 + 左上白块标题 + 下方三列 KPI；压图标题约从 `top:10.5vh` 开始，保持与绝对定位页眉约 24px 的导航间距 | 主图按 `21:9` 生成,关键主体放中央安全区 |
| S23 | 新增 | Data Chart | 顶部结论标题 + 单位/图例 + 四边完整绘图区 + 主导分组柱图 + HTML 坐标标签 + 来源；首末柱至少 28px 安全边距，顶部为数值留 headroom，数值以整柱宽文本层居中 | 无；只承载真实比较数据 |
| S24 | 新增 | Line Chart | 顶部结论标题 + 单位/图例 + 四边完整绘图区 + 主导折线图 + HTML 坐标标签 + 来源；SVG、端点与终值标签置于左右至少 28px 的 `.line-geometry` | 无；只承载时间或连续变量趋势 |
| S25 | 新增 | Portfolio Roadmap Matrix | 顶部结论标题 + 时间轴 + 2-4 条中性能力泳道 + 3-7 个稀疏媒体节点 + 来源；节点以百分比坐标定位 | 每节点一张语义媒体；8px 小圆角，无阴影；示意路线必须明确声明 |
| S26 | 新增 | Milestone Gallery | 顶部结论标题 + 4-6 个连续阶段列；每列含阶段、媒体、标题、短说明；底部综合结论 + 扁平能力链 + 来源 | 每阶段一张语义媒体；媒体框 8px，阶段列本身无卡片圆角或阴影 |

### XREAL-CLOSING-BLACK · Brand Back Cover

- 使用场景:整套 deck 的唯一封底，必须是最后一页。
- 必须结构:`.slide.accent` + `.xreal-closing-lockup` + `.xreal-closing-thanks` + `.xreal-closing-mark` + `.xreal-closing-logo`。
- 内容边界:除 XREAL Logo 和 `Thanks` 外不显示其他内容，进入该页时底部分页导航隐藏；结论、行动建议、联系方式和署名必须在前一页完成。
- 背景与 Logo:以全屏 `#000000` 为基底；匹配到安静的 lifestyle、conceptual 或品牌 KV 时，可使用 `.xreal-closing-media` 作为背景并声明 `data-media-kind`。禁止直接产品 cutout / packshot。使用官方企业 Logo 并反白，不添加纹理、线条、页码或角标。
- 动效:使用 `data-animate="closing-thanks"`，`Thanks` 先成为主视觉，底部 Logo 随后轻微落定。

### S23 · Data Chart

- 使用场景:3-8 个类别、2-4 个系列的同尺度比较；例如区域 × 产品、季度 × 渠道或方案 × 指标。
- 必须结构:`.xreal-data-chart` + `.chart-legend` + `.chart-stage` + `.chart-y-labels` + `.chart-plot` + `.chart-groups` + `.chart-x-labels` + `.chart-source`。
- 数据约束:每个柱必须对应真实数值并带 `data-value` / 可见值；必须显示单位和来源。不同量纲禁止强行共用一个纵轴。
- 视觉约束:图表占页面主导面积；使用四边同色同粗的单一 1px `--chart-frame`、共同零基线、1px `--chart-grid` 和最多 4 个按 `--chart-series-1/2/3/4` 映射的稳定系列；第一/最后网格线不得与 frame 重叠。柱体只保留顶部 8px 小圆角，底角为直角并贴齐 x 轴；红色不是默认系列色，只允许一个有明确结论依据的关键系列/点使用。首末柱与绘图区边界至少保留 28px，最高数值标签不得越过 plot 顶部；数值标签中心与柱体中心误差不超过 2px。
- 动效:使用 `data-animate="chart-rise"`；柱从共同基线生长，图例与来源随后出现。

### S24 · Line Chart

- 使用场景:时间序列或其他有连续顺序的横轴，1-3 个系列、4-12 个采样点。
- 必须结构:`.xreal-line-chart` + `.chart-legend` + `.line-stage` + `.chart-y-labels` + `.line-plot` + `.line-geometry` + `svg[data-svg-role="chart"]` + `.chart-line` + `.line-x-labels` + `.chart-source`。
- 数据约束:必须显示时间/连续变量标签、单位和来源；类别无连续顺序时不得使用折线图。不同量纲默认拆图，不使用无说明的双轴。
- SVG 约束:SVG 只画折线、点和数据几何，不放 `<text>`；坐标、图例、终点值和注释全部使用 HTML。
- 视觉约束:绘图区四边使用同色同粗的单一 1px `--chart-frame`，第一/最后网格线不得与 frame 重叠；折线按与 S23 相同的 `--chart-series-*` 映射。`.line-geometry` 左右安全区至少 28px，并与 `.line-x-labels` 对齐。首末点、描边和终值标签必须完整落在 frame 内，不得依赖裁切隐藏越界。
- 动效:使用 `data-animate="line-draw"`；坐标结构先出现，再依次绘制折线与关键点。

### S25 · Portfolio Roadmap Matrix

- 使用场景:产品组合沿时间/阶段和能力、定位、成熟度等第二维度共同迁移。
- 必须结构:`.portfolio-roadmap` + `.roadmap-year-axis` + `.roadmap-y-axis` + `.roadmap-plot` + 2-4 个 `.roadmap-lane` + 3-7 个 `.roadmap-item` + `.roadmap-source`。
- 节点约束:每个节点必须包含 `.roadmap-media`、`.roadmap-title`、`.roadmap-meta`，并以百分比声明 `--x/--y/--w/--h`；节点之间不得重叠或越过 plot。
- 视觉约束:只使用白/浅灰泳道和 1px hairline；不得复制参考图的蓝色年份按钮、多彩背景、pill 标签、阴影或 dashboard 控件。最多一个有明确依据的 `.critical` 节点使用红色。
- 数据边界:若位置是推演、示意或规划假设，必须在来源行明确标注 illustrative / scenario，不得伪装成正式发布、价格或路线承诺。
- 动效:使用 `data-animate="portfolio-roadmap"`；轴线与泳道先出现，节点按时间顺序进入。

### S26 · Milestone Gallery

- 使用场景:用 4-6 张语义媒体证明一条技术、产品或组织能力的阶段演进。
- 必须结构:`.milestone-gallery` + 4-6 个 `.milestone-entry`；每项含 `.milestone-year`、`.milestone-media`、`.milestone-title`、`.milestone-copy`；底部包含 `.milestone-synthesis`、`.milestone-chain` 和 `.milestone-source`。
- 视觉约束:阶段列通过连续 1px 竖线组织，列本身保持扁平，不做独立白卡、大圆角或阴影。媒体框使用 8px 小圆角；底部能力链只用 hairline、自然文本与箭头，不做 filled ribbon、按钮或蓝色导航条。
- 媒体约束:每个阶段必须有语义匹配媒体，比例与槽位一致；图片只作为证据，不用无关装饰图补齐数量。
- 动效:使用 `data-animate="milestone-gallery"`；阶段列依次进入，最后呈现综合结论与能力链。

### XREAL ECharts Component

- 版式身份:复杂图表仍保留已登记 `data-layout`，并添加 `data-chart-engine="echarts"` 与登记的 `data-chart-kind`；它不是新的正文版式编号。
- 适用骨架:S23 承载复杂比较/分布/矩阵，S24 承载趋势或柱线混合，S17 承载网络/流向/层级，S08 承载明确的地理数据编码。
- 使用边界:简单分组柱图与简单折线仍优先使用 S23/S24 原生组件。ECharts 只用于 scatter/bubble、heatmap、waterfall、boxplot、candlestick、sankey、graph、tree、treemap 等复杂数据形状。
- 必须结构:`.xreal-echart-stage` + `.xreal-echart[data-echarts-key]` + 容器外 `.chart-unit`、`.chart-legend`、`.chart-source`。
- 视觉约束:只使用 XREAL 受控主题；禁止默认彩色主题、渐变、阴影、3D、发光、面积填充、toolbox 和 dashboard 控件。最多一个系列或数据项使用 `xrealCritical:true`。
- 运行约束:默认 SVG 与无 tooltip；大于约 1,000 个图形元素时才可声明 Canvas 大数据模式。`B` 静态模式必须关闭 ECharts 动画。
- 交付约束:运行 `scripts/inline-echarts.mjs` 生成离线单文件，并通过 validator。完整契约见 `references/xreal-echarts.md`。

## 登记扩展组件

### S01 + Section Hero Variant

- 使用场景:一个 deck 内部的章节标题页、议题切换或叙事阶段切换。
- 版式身份:仍是 `data-layout="S01"`,并额外写 `data-variant="section-hero"`;不是新的正式版式编号。
- 层级约束:视觉层级必须低于 S01 Index Cover。使用 `.xreal-section-title`,禁止使用 `.xreal-cover-title`;标题字号 token 必须满足 `page-title-size < section-hero-title-size < cover-title-size`。
- 结构:正文级 `chrome-min` + 小型章节标识 + 单一章节主标题 + 1 句引导语 + 可选底部范围提示。它是标题 Hero,不是目录或索引。
- 背景:可使用 `hero light`、浅灰纯色或 `hero dark`;不得使用满屏纯黑 `slide accent`,不得复制 S01 的三行 `cover-row` 索引结构。
- 内容边界:不放巨大章节编号、目录列表、作者/日期、全 deck 主副标题组合、KPI、图表或大图。
- 动效:使用 `data-animate="section-hero"`,入场节奏短于封面 hero,不制造新的视觉高潮。

### S08 + XREAL Map Component

- 使用场景:地理、历史、城市路线、门店/校区/事件点位、人物住所关系。
- 版式身份:仍是 `data-layout="S08"`,不是新正文页。
- 页面结构:顶部左对齐标题 + 左侧关系/说明卡片 + 右侧 MapLibre 地图卡片。
- 标记结构:点 + 连线 + HTML 卡片;SVG 只画 fallback 关系线,不写文字。
- 交互控制:右上角必须有 `+` / `-` / `Drag`;默认禁用滚轮缩放和拖动,避免触发 PPT 翻页。
- 详细代码和数据契约见 `references/swiss-map-component.md`。

### S18 + XREAL Pie Component

- 使用场景:2-5 个互斥类别构成一个总量，且总和为 100%。
- 版式身份:仍是 `data-layout="S18"`，不是新正文页。
- 页面结构:顶部标题与说明 + 左侧 SVG 扇形几何 + 右侧 HTML 图例和数值。
- 色彩:仅一个关键扇区使用 XREAL 红，其余使用黑、灰、银；禁止渐变和多色装饰。
- SVG 禁止可见文字；分类名、百分比和说明全部用 HTML。

### S19 + XREAL Bento Component

- 使用场景:将一个主叙事、两项指标和一条行动说明压缩成同页摘要。
- 版式身份:仍是 `data-layout="S19"`，不是新正文页。
- 使用 12 列非对称网格和 1px 间隙；主块 6 列 × 2 行，其余块保持 3/3/6 列关系。
- 整体 `.xreal-bento` 外框使用 `--radius-sm:8px`；直接子区块全部为直角、无阴影，不做大圆角、胶囊按钮或软件 dashboard 质感。
- 黑白灰承担结构，只允许一个红色关键数字或信号。

## 图片槽位规则

### S22 · Hero Strip

- 生成比例: `21:9`
- 图片用途:实拍场景、产品场景、UI 情景图。
- 生成提示词必须包含: `21:9 ultra-wide strip`, `subject centered in the safe middle area`, `no title, no footer, no page chrome, no logo, no border`.
- HTML 容器必须使用原始 S22 的顶部全宽图骨架;不要改成普通居中大图。
- 照片用 `object-fit:cover;object-position:center 35%`。如果是人像/会议场景,不要用 `top center`。
- 信息图/UI 截图如果放 S22,优先选择接近 `21:9` 的现有资产;否则使用 `object-fit:contain` 或改用其他版式。

### S15/S16 · Multi Image Grid

- 资产比例:统一 `21:9` 或统一 `16:10`,不要混用。
- 同一组图片必须同高、同宽、同一容器背景。
- 图片格必须吸附原始卡片网格,不要让图片自己决定宽高。
- 如果现有资产与 `s15-grid-21x9` / `s16-brief-21x9` 槽位比例匹配,容器使用 `.frame-img.r-21x9` 铺满;比例不匹配时使用 `.fit-contain` 或改用其他版式。
- `.fit-contain` 用于必须保留原始比例的产品图、用户截图或文字密集图片。
- 原始截图优先保真并使用 `fit-contain`;长截图可以截取关键区域或拆成多张,不要为统一比例重画截图内容。

## 禁止清单

- 禁止 `text-align:center` 用在顶部中文大标题。
- 禁止将顶部标题写进右侧 7.8fr 栏,造成视觉居中。
- 禁止未登记正文页:例如临时 `XREAL Image Split`、`Evidence Grid`、三圆图自绘页。
- 禁止图片容器灰底包白底信息图。
- 禁止 SVG 中出现 `<text>` 作为可见标签。
- 禁止图片默认 `object-position:top center` 用于照片。
