# 质量检查清单（Checklist）

每一条都是踩过坑之后总结的，按重要性排序。

生成 PPT 前，先通读一遍；生成后，逐项自检。

---

## 内容保真预检

- 用户提供成体系原始材料时，已读取 `content-fidelity.md`，并使用 `data-content-mode="source-faithful"`；只有用户明确要求或批准摘要时才使用 `editorial-summary`
- 写 slide 前已经建立 `content-coverage.json`，每个事实、数据、限定条件、案例、引用、决策和行动项都有稳定 `SRC-xxx` ID
- 承载原始内容的正文 section 有稳定 `id` 与 `data-source-refs`；不是生成后为了过校验才倒填来源 ID
- 固定页数与完整保留冲突时已向用户说明；没有因为版式、最小字号、叙事弧或留白而静默删除内容
- 数字、统计口径、适用范围、风险、反例、不确定性、逐字引用、法务措辞、责任人与截止时间没有在转述中丢失或被强化
- 交付报告包含内容模式、覆盖项总数、包含项数、经批准遗漏项数和遗漏清单

---

## 🔴 P0 · 一定不能犯的错

- 没有做 content-to-container fit：少量普通内容占据大卡，而高信息量内容被塞入小卡/窄列；或机械复制示例的列宽、行高、卡片顺序与强调位置

### 0-S. XREAL Style locked mode:正文页必须来自 26 个正式登记版式

**现象**:颜色、字体看起来像 XREAL Style,但标题跑到中间、图片不在网格上、页面结构和正式登记版式完全不是一套东西。

**根因**:生成时把 XREAL Style 当成风格包,自由组合了未登记结构或 SVG 插画页面,没有从 26 个正式登记版式里选。历史实验 `P23/P24` 与正式 `S23/S24` 不是同一组 ID。

**做法**:
- 先读 `references/swiss-layout-lock.md`
- 正文页只能使用 `S01-S08`、`S11-S28`;`S09/S10` 已移除;新增首页/尾页只能使用 `XREAL-COVER-BLACK` / `XREAL-CLOSING-BLACK`
- 每个 `<section class="slide">` 必须写 `data-layout="Sxx"`
- 生成后必须运行:

```bash
node <SKILL_ROOT>/scripts/validate-swiss-deck.mjs path/to/index.html
```

**校验会拦截**:
- 未登记版式 / 缺少 `data-layout`
- P23/P24 实验结构
- SVG 里写可见文字
- 未声明信息角色的内联 SVG 插画
- 页面出现页码
- S22 图片未绑定 `s22-hero-21x9`
- S22 照片使用 `object-position:top center`
- S23 缺少单位、图例、3-8 个类别、2-4 个系列、可见值或来源
- S24 缺少连续横轴、1-3 条折线、每系列至少 4 个点、HTML 坐标标签、单位或来源
- S25 缺少时间轴、能力轴、中性泳道、3-7 个百分比定位媒体节点或示意来源声明
- S26 缺少 4-6 个完整里程碑、媒体证据、底部综合链或来源
- S27 缺少总述带、恰好 3 个完整主面板、7-12 个条目或来源；出现多个焦点区、多个媒体或 dashboard 控件；焦点项缺少 `data-focus-reason`，或长短明显不同的递进项仍被强制等高
- S28 缺少合法 `data-bento-variant`、5-9 卡、恰好 1 个主卡、1-4 个中卡、至少 2 个支持卡、至少 3 种面积或来源；变体与主卡位置不一致、卡片越界、重叠、媒体契约错误或面积与优先级无关

### 0-S-2. XREAL Style 顶部标题默认左上,不是居中

**现象**:最顶上的中文标题在页面中间,像一页自制海报,不再像原始 PPT。

**做法**:
- 除 `S03` statement 版式外,顶部标题必须贴原始模板的左上内容轴。
- 不要把小标题放左列、大标题放右侧大列,这会导致标题视觉居中。
- 如果需要标题 + 说明两列,必须复制原始 `S11` 或 `S17` 的骨架,不要自写 `4fr 8fr`。

### 0-S-3. XREAL Style 地图页必须用 S08 Map Component

**现象**:地点/历史内容只画了简易 SVG 地图,没有真实点位、关系卡片、缩放/拖动控制,或滚轮触发了 PPT 翻页。

**做法**:
- 使用 `data-layout="S08"`。
- 先读 `references/swiss-map-component.md`。
- 右侧地图组件必须包含 marker 点、连接线、地点卡片、`+` / `-` / `Drag` 控制。
- 默认禁用 scroll zoom 和 drag pan;用户点击 `Drag` 后才允许拖动。
- 必须保留静态 fallback,地图 CDN 或瓦片失败时仍可读。

**检查**:
- `grep -n "data-map-ctrl" index.html`
- `grep -n "maplibregl.Map" index.html`
- 浏览器实测 `+` 可放大,`Drag` 可切换为 `Drag on`

### 0-S-4. XREAL Style 演示字号下限 + 固定角色字重层级

**现象**:页面整体结构没问题,但主标题为了追求“高级感”被设成 200/300,投屏后轮廓发虚;或者标题、正文和标签只按字号机械调整字重,缺少稳定的信息层级。

**做法(字号下限)**:
- 正文段落 / 主要说明 ≥ `18px`
- 卡片描述 / 列表 / 时间线说明 / caption / 图注 ≥ `16px`
- meta / kicker / mono label / 图表标签 ≥ `14px`
- 来源 / 说明注脚统一为 `max(11px,.62vw)`；这是唯一 11px 级例外
- 底部注脚/底栏默认为无；只保留必要来源、方法/样本口径、法务/风险免责声明或有信息增量的解释。标题区已说明“虚构/示意”时不重复，不用产品名、口号、芯片名、功能列表或制作说明填空
- 内容超出时,先清理视觉填充、合并真正重复且无信息增量的表述或换 Sxx 版式，再增加正文页/附录；来源模式中保留全部覆盖 ID。不要把正文、卡片说明或图表标签压到 10/11/12/13px；固定页数冲突时先询问用户，不自动删减。

**做法（角色字重层级 ⭐）**:
字重由内容角色固定，同一角色在整套 PPT 中保持一致：

- Hero / 封面 / 章节主标题 → `var(--weight-display)`：XREAL Diatype **500**，IBM Plex Sans SC / JP **600**
- 页面标题 / 模块标题 → `var(--weight-title)`：XREAL Diatype **500**，IBM Plex Sans SC / JP **600**
- 关键 KPI / 数据 → 纯英文 **500**，中文/日语及对应混排 **600**；每页最重要的单个数据可使用 **700**
- 副标题 / lead → **400**
- 正文 / 描述 → **400**
- caption / 辅助元数据 → 纯英文 **400**，中文/日语及对应混排 **450**
- kicker / 导航标签 / 图表标签 → **500**
- 强调字使用同字重斜体、600/700 或品牌红色语义建立层级。
- 默认内容样式使用 Regular / Text、Medium / SemiBold 和 Bold 三个层级。

**检查**:
- `rg -n "font-size:(10px|11px|12px|13px)|max\\((9|10|11|12|13)px" index.html`
- `rg -n "font-weight:(100|200|300)" index.html | rg -v "@font-face"` —— 内容样式中不应出现 Thin / ExtraLight / Light
- 浏览器以 100% 缩放查看,底部 note、caption、timeline label、卡片描述仍能一眼读清。

### 0-A. XREAL Style 画布对齐法则(每一页必查 · 最常踩)

**现象**:页眉 chrome-min 和底部 footer 都靠在 5vw 的边线上,但中间区域往内缩了一截,左右对不齐。

**根因**:`.canvas-card` 已经自带 `padding:5.6vh 5vw 4.4vh`。如果在主体区再写 `padding:5vh 5vw 4vh`,水平方向就变成 `5vw + 5vw = 10vw`,主体比 chrome-min 多内缩 5vw。

**做法**:
- 主体那层 `padding:0`,只用 grid `gap` 控垂直间距
- chrome-min 与主体之间的间距由 `.chrome-min{margin-bottom:48px}` 提供,**不要**在主体顶部叠 `margin-top` / `padding-top`
- split 模式例外:`.slide.split .canvas-card{padding:0}`,两个 `.half` 自己定 `padding:5.6vh 3.6vw 4.4vh`

```html
<!-- ❌ 错:主体多缩了 5vw,左右对不齐 -->
<div class="canvas-card">
  <div class="chrome-min">...</div>
  <div style="flex:1;padding:5vh 5vw 4vh;...">主体</div>
</div>
<!-- ✅ 对 -->
<div class="canvas-card">
  <div class="chrome-min">...</div>
  <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr auto;gap:3vh">主体</div>
</div>
```

**自检命令**:`grep "padding:.*5vw" index.html`,如果命中 `padding:Xvh 5vw Yvh` 在 canvas-card 直系子元素里,就是错的(.half / 装饰层除外)。

### 0-B. XREAL Style head 区:kicker 必须在大标题"上方"(不要左右排)

**现象**:小标题(`.t-meta` / `.t-cat`)和大标题被挤在同一行,左侧一坨小字、右侧一坨大字,头部失去层级。

**根因**:`grid-template-columns:auto 1fr` 把两个本该上下叠的元素压成左右两列。

**做法**:
```html
<!-- ❌ 错 -->
<div data-anim="head" style="display:grid;grid-template-columns:auto 1fr;gap:3vw;align-items:end">
  <div class="t-meta">METHODOLOGY · 03</div>
  <h2 class="h-xl-zh">为什么是 N+1</h2>
</div>
<!-- ✅ 对 -->
<div data-anim="head" style="display:flex;flex-direction:column;gap:1.4vh">
  <div class="t-meta">METHODOLOGY · 03</div>
  <h2 class="h-xl-zh">为什么是 N+1</h2>
</div>
```

例外:head 一行同时承载"左:kicker+大标题(自己上下叠)"和"右:小注脚",外层可以用 `display:grid;grid-template-columns:1fr auto`,但**内层**仍要保持 flex column。

### 0-B-2. XREAL Style 封面 / 封底:黑色基底 + 语义匹配媒体 + 极简品牌收束

**现象**:封面用 `slide light` 白底 + 黑字 + 一个大大的"01"，或页眉出现 `01 / 07` 等计数；数字与内容无关，形成多余角标。

**根因**:封面和封底承担不同职责。封面需要建立主题，封底只需要品牌落款；把 takeaway、作者日期和宣言继续堆在封底会削弱结束感。

**做法**(XREAL Style 必守):
- **封面强制 `<section class="slide accent">`**并以纯黑为基底,不要 `slide.light`,也不要 `slide.dark`;先审计当前产品线的 KV、lifestyle、conceptual 与横版 beauty。命中合适素材时使用 `.xreal-cover-media`,没有合适素材才保持纯黑；禁止 ASCII、点阵、纹理、噪点、CSS 图形和动态装饰背景
- 封面与封底都必须声明 `data-media-match="matched|none"`。`matched` 时图片必须来自 `images/`、带 `data-image-slot` 与正确 `data-media-role`;`none` 表示已完成媒体审计但没有适配素材
- **页面不显示页码**：删除页眉、Logo 后、角标和封面大字中的 `01 / N`、`NN / NN` 等计数
- **强调字可用斜体**,但保持与主标题相同字重或升至强调字重,不要降成 Light；黑底页面默认不额外上色
- **封底强制 `<section class="slide accent">`** 使用黑色基底，大号 `.xreal-closing-thanks` 作为居中主视觉，小号 `.xreal-closing-logo` 通过 `.xreal-closing-mark` 固定在底部中央；存在匹配的低干扰 lifestyle、conceptual 或品牌 KV 时可使用 `.xreal-closing-media` 背景。禁止直接放透明产品 cutout、白底产品图或 packshot
- 封底必须是最后一个 section，进入该页时隐藏底部分页导航；不放 takeaway、宣言、作者日期、页码、联系方式、CTA、眉题或装饰线，所有结论在前一页完成
- Logo 默认独立,右侧不接 deck 名、章节名或风格说明;确有导航文字时,文字标准字距且视觉字高与 Logo 一致
- 正文页 chrome 品牌区使用紧凑导航级尺寸；IBM Plex Sans SC / JP 相邻文字按 Logo 宽度的 `.26` 计算，XREAL Diatype 按 `.313` 计算，并与 Logo 垂直居中；封面/封底才使用较大品牌级尺寸
- 页眉到首个正文块使用 `--chrome-content-gap:24px`，紧凑变体使用 `16px`；不要使用 48px 全局下间距，也不要让首块额外 margin 与页眉间距叠加
- 普通英文眉题、导航、标签、图注和页脚使用自然大小写;禁止整词组全大写,也禁止 CSS `text-transform:uppercase`
- 全大写只允许 XREAL 字标、行业通用缩写和短型号代码;辅助文字 `letter-spacing` 默认 normal,最大不超过 `0.05em`
- 删除无信息价值的角标、`MANIFESTO` 式重复小标题和封面底部分割线
- 封面主标题使用 `.xreal-cover-title`；正文页面标题使用 `.xreal-page-title`。纯英文语境自动使用更克制的字号 token，不在页面内联放大

**自检命令**:
- `rg -n "ascii-bg" index.html`——应无结果
- `grep -E '"slide accent"' index.html | head -1`——封面应是 `slide accent` 而非 `slide light`
- `rg -n 'data-layout="XREAL-(COVER|CLOSING)-BLACK"' index.html`——封面和封底应各命中一次
- `rg -n 'data-layout="XREAL-(COVER|CLOSING)-BLACK"[^>]*data-media-match="(matched|none)"' index.html`——封面和封底都应声明媒体匹配结果
- `rg -n 'xreal-(cover|closing)-media[^>]*data-media-role="(cover|closing)-background"' index.html`——声明 `matched` 的页面应命中对应媒体角色
- `rg -n 'data-layout="XREAL-CLOSING-BLACK"[^>]*data-animate="closing-thanks"' index.html`——封底应命中极简品牌封底 recipe
- `rg -n 'xreal-closing-lockup|xreal-closing-thanks|xreal-closing-mark|xreal-closing-logo' index.html`——四个封底骨架类都应存在
- `grep "color:var(--accent)" index.html`——若命中行同时含 `font-style:italic` 即危险信号,改为只 italic 不上色;关键数据或警示才使用 `var(--brand-red)`
- `rg -n '>\s*[0-9]{1,2}\s*/\s*(?:[0-9]{1,2}|NN)\s*<' index.html`——应无结果
- 目视:打开页面看封面和页眉有没有页码——有就删

### 0-B-3. 单标题章节 Hero 必须低于 S01 Index Cover

**现象**:章节页被做成目录，或使用满屏纯黑、巨大章节编号、封面级巨字和品牌级 Logo,导致章节 Hero 与整套封面争夺最高层级。

**做法**:
- 使用 `data-layout="S01" data-variant="section-hero" data-animate="section-hero"`，并在 section 上添加 `.section-hero`。
- 使用 `.xreal-section-title`,禁止 `.xreal-cover-title`。
- 可使用 `hero light`、浅灰纯色或 `hero dark`,禁止 `slide accent` 满屏纯黑。
- 使用正文级 `chrome-min`;结构只保留 `.section-hero-kicker`、一个主标题、`.section-hero-summary` 和可选范围提示。
- 不复制三行 `.cover-row`,不做目录/列表，不放巨大章节编号、deck 级作者/日期、KPI、图表或大图。
- 小型章节标识可写 `Part 02 · Architecture`；不得把 `02` 单独放大成主视觉，也不得写成页码 `02 / 12`。

**自检命令**:
- `rg -n 'data-variant="section-hero"[^>]*data-animate="section-hero"' index.html`——每个章节 Hero 都应命中。
- `rg -n 'section-hero[^>]*(xreal-cover-title|cover-row|chapter-(index|number|num))|data-variant="section-hero"[^>]*slide accent' index.html`——应无结果。

### 0-B-4. S23/S24 图表必须先证明数据形状匹配

**现象**:为了“看起来像数据页”把无顺序类别连成折线、把不同量纲放进同一纵轴，或只画图形却不写单位和来源。

**做法**:
- `S23 Data Chart` 只用于 3-8 个类别 × 2-4 个同量纲系列；必须使用共同零基线、`.chart-unit`、`.chart-legend`、HTML 横纵轴标签、可见值和 `.chart-source`。
- `S24 Line Chart` 只用于时间或连续变量；限制 1-3 个系列、每系列 4-12 个采样点。SVG 只画 `.chart-line` / `.chart-point`,禁止 `<text>`。
- S24 `.line-end-label` 使用透明底，停在对应终点左上肩位；标签与端点横纵方向至少相隔 4px，不得压住线或点。
- 不同单位默认拆图或拆页；不使用无说明双轴。类别无连续顺序时使用 S23/P7,不要连线。
- 红色只能标记一个关键系列或关键拐点；其余系列使用黑、灰、银，并通过图例、线型或终值标签辅助识别。
- 标题必须写成数据结论；图表占主导面积，不在上方再堆 KPI 卡片或 dashboard 控件。

**自检命令**:
- `rg -n 'data-layout="S23"[^>]*data-animate="chart-rise"|data-layout="S24"[^>]*data-animate="line-draw"' index.html`——每张新增图表页都应命中正确 recipe。
- `rg -n 'data-layout="S2[34]"' index.html` 后逐页确认 `.chart-unit`、`.chart-source` 和 HTML 坐标标签齐全。
- `rg -n '<svg[^>]*class="[^"]*line-chart-svg[\s\S]*?<text' index.html`——应无结果。

### 0-B-5. S25/S26/S27/S28 必须保留结构语义，不复制参考图视觉

**现象**:产品路线被做成蓝色 dashboard，纵轴短标签占用过宽空列；或里程碑卡片使用大圆角、阴影、强调色和 filled ribbon，破坏 XREAL 设计规范。

**做法**:
- `S25 Portfolio Roadmap Matrix` 只用于时间/阶段 × 第二层级维度；限制 2-4 个 period、2-4 条中性 lane、3-7 个媒体节点。
- S25 每个节点都包含媒体、标题、meta 和百分比 `--x/--y/--w/--h`；节点不得重叠或越界。纵轴短标签列必须收紧并左对齐，标签到 plot 保持 12-24px。示意/推演位置必须在来源行声明 illustrative。
- `S26 Milestone Gallery` 只用于 4-6 个有媒体证据的阶段；每项必须有阶段、媒体、标题和短说明。
- S26 每个阶段使用统一浅灰底、1px 边界、等距 padding 和 8px 小圆角卡片；卡片等高、间距一致，不使用阴影或单独强调色。底部综合链保持 hairline + 文本 + 箭头，不做按钮、ribbon 或蓝色导航条。
- `S27 Dense Synthesis` 只用于三组相互依赖信息必须同页的情况；固定为总述带 + 3 个等高主面板 + 7-12 个条目。总述标签与结论共享同一左轴，主面板依靠统一中性底色、等高外框和留白建立层级，内部条目不重复堆叠分割线。面板列宽和组内行高依据内容量调整；递进项长短不等时使用登记的 `data-row-profile`。正文 ≥16px，meta ≥14px，最多 1 个黑色焦点区和 1 张语义媒体；焦点项必须有非空 `data-focus-reason`，由当前内容的主结论、风险或关键转折决定，不得复制样例中的固定位置。媒体只能作为焦点区的 `cover + darken` 背景，不做小缩略图。编号列固定为 `ch` 宽度并使用 tabular numerals。
- `S28 Priority Bento` 只用于一个明确主卖点、1-4 个次级技术点和若干支持信息；固定为 12×6 网格，但必须按语境声明 `left-focus`、`right-focus`、`panorama` 或 `center-focus`，不能固定复用一套坐标。使用 5-9 卡、恰好 1 个主卡、1-4 个中卡、至少 2 个支持卡且至少 3 种面积。每卡必须声明 `--col/--span/--row/--rows`，面积必须对应真实优先级；不得随机轮换、无语义镜像或先套剪影再硬塞内容。
- 四者只使用黑白灰结构；媒体框、S25 节点、S26 卡片、S27 主面板和 S28 单卡使用 8px 小圆角、无阴影。红色最多标记一个有语义依据的关键节点。S28 媒体限 1-4 张，压图文字使用 `cover + darken`，非压字媒体使用 `contain + none`。

**自检命令**:
- `rg -n 'data-layout="S25"[^>]*data-animate="portfolio-roadmap"|data-layout="S26"[^>]*data-animate="milestone-gallery"|data-layout="S27"[^>]*data-animate="dense-synthesis"|data-layout="S28"[^>]*data-animate="priority-bento"' index.html`
- `rg -n 'roadmap-(item|media|source)|milestone-(entry|media|synthesis|chain|source)|dense-(thesis|panel|item|source)|priority-(bento|tile|media|source)' index.html` 后逐页确认数量与必填结构。

### 0-B-6. XREAL ECharts 只处理复杂数据形状

**现象**:为了“更专业”把所有柱图和折线都换成 ECharts，或直接复制官网示例，带入默认彩色主题、tooltip、toolbox、渐变、阴影和 dashboard 质感。

**做法**:
- 简单柱图和折线仍用 S23/S24 原生组件；scatter/bubble、heatmap、waterfall、boxplot、candlestick、sankey、graph、tree、treemap 才评估 ECharts。
- 保留正式 `data-layout`，并声明 `data-chart-engine="echarts"`、登记的 `data-chart-kind` 和 `.xreal-echart[data-echarts-key]`。
- 单位、HTML 图例、来源和结论标题必须位于 ECharts 容器外；不使用 ECharts 内部 title/legend/toolbox 代替版式层。
- 默认 `data-renderer="svg" data-interactive="false"`。只有图形元素超过约 1,000 或交互密集时才使用 `canvas`，并写 `data-large-data="true"`。
- 最多一个 series 或 data item 使用 `xrealCritical:true`；禁止 `shadowBlur`、`colorStops`、非空 `areaStyle`、3D、发光和连续彩虹 visualMap。
- 最终运行 `inline-echarts.mjs`，交付单文件，不依赖 CDN。

**自检命令**:
- `rg -n 'data-chart-engine="echarts"' index.html`——逐页确认只落在 S23/S24/S17/S08。
- `rg -n 'shadowBlur|shadowColor|colorStops|areaStyle|bar3D|line3D|pictorialBar|effectScatter|liquidFill' index.html`——ECharts options 中应无结果。
- `rg -n 'data-xreal-echarts-bundle' index.html`——使用 ECharts 的最终文件必须命中一次。
- `rg -n "https?://[^\" ]*echarts" index.html`——最终文件应无 ECharts CDN。

### 0-C. XREAL Style 大字号双约束:`min(Xvw, Yvh)` 中 Y ≥ X × 1.6

**现象**:在 16:9 标准屏(MacBook 13/14/16,常见显示器)打开,标题字号比预期小一截,整页内容显得空旷或缩水。

**根因**:1vw : 1vh ≈ 1.78,如果写 `min(7vw, 10vh)`,在 16:9 屏 7vw = 12.46vh,会被 10vh 上限截断到 10vh,字号缩水 20%。

**做法**:推荐数值速查
| 用途 | 推荐 |
|---|---|
| h-hero 巨字宣言 | `min(11.6vw, 19vh)` |
| h-xl 章节标题 | `min(7vw, 12vh)` ~ `min(7.4vw, 13vh)` |
| 大数字 KPI | `min(8.4vw, 14vh)` |
| 中数字 / 编号 | `min(4.6vw, 8.5vh)` ~ `min(5.6vw, 10vh)` |
| 副标 | `min(7.6vw, 13vh)` |

**自检命令**:`grep -E "font-size:min\([0-9.]+vw,\s*[0-9.]+vh\)" index.html`,把所有命中的 X/Y 看一眼,任何 Y/X < 1.6 都改大。

### 0-D. XREAL Style 图片混排：统一小圆角、同高、只做证据

**现象**:图片像普通 PPT 插图,圆角大小混乱、阴影、比例混乱;多张图片高度不一,或素材自带标题/页脚,和页面 chrome 重复。

**根因**:XREAL Style 的图片不是装饰,而是 grid 里的证据块。没有先选原始版式和图片槽位,就会把任意图片硬塞进页面。

**先判断图像角色**:
- 证据截图、UI、代码、dashboard:保真优先,关键文字和数据不能裁;需要统一比例时先做截图背景画布和 `.fit-contain`。
- 与槽位比例匹配的媒体资产:按 S22/S15/S16 的目标比例铺满,不要再缩成短小图片。
- 照片/产品图/人物图:必须写清 `object-position`,主体不能被裁切、标题块或 caption 压住。
- 文字压图:必须先判断是否有足够 quiet zone;没有低细节留白就不要把标题压在图上。
- 多图组:统一比例、高度、容器样式和 caption 密度;视觉角色不同的图不要硬放同一组。
- 开场/收束媒体:封面优先叙事性 KV、lifestyle、conceptual 与横版 beauty；封底只选低干扰 lifestyle、conceptual 或品牌 KV，不直接使用产品 cutout / packshot。两者都必须先判断 quiet zone 和品牌文字对比。
- 产品身份审计:单一产品 deck 在 `<body>` 声明 `data-product-line`，先检查对应 `00-product-marks/`。存在官方产品标志时至少使用一次 `.xreal-product-mark` 产品识别位；企业 XREAL Logo 仍独占 `chrome-min`。
- 稀疏卡片媒体:S04 最多 1-2 张技术卡、S05 最多一个核心层、S19 仅 Bento hero 主卡可按语境配图。媒体必须解释内容并使用登记槽位；不能只因为有空白就填图。
- S04 卡内证据图:紧边 cutout 使用 `inset` + contain；源画布留白大时使用 `inset-prominent` + cover，高度占父卡 28%-45%、宽度至少 80%。与文字不重叠，不加蒙版。
- S05 大卡媒体:有低干扰文字区的横版技术图可使用 `.media-full-bleed` + `full-bleed/darken`，宽高覆盖父卡至少 95%，通过渐变蒙版保护文字；否则使用 inset/contain。默认保留 `.layer-icon`，不因配图自动删除。
- 全幅背景媒体:S19 hero 使用 `data-media-fit="full-bleed" data-media-contrast="darken"` + `object-fit:cover`，宽高覆盖父卡至少 95%；默认 `--media-scrim-alpha:.56`，并保证 `image brightness × (1 - 最浅蒙版 alpha) <= .44`。逐项检查标题、眉题、正文与单位的最终反白对比，不叠白底/半透明文字面板；若仍不可读，换图、改裁切或回退无图版式。
- 全局文字对比:普通文字最终对比度 `>=4.5:1`，大字 `>=3:1`。验证基于最终计算色与实际祖先表面，不只检查 token；透明文字、继承色、灰底 helper、红色单位和压图文字都必须覆盖。

**做法**:
- 先选版式:单张大图 + KPI 用 `S22`;多图用 `S15/S16` 的原始网格骨架改造
- S22 资产优先选择接近 `21:9` 的 KV、产品图或场景图,并在 `<img>` 上写 `data-image-slot="s22-hero-21x9"`
- 照片默认 `object-position:center 35%` 或 `center center`,不要用 `top center` 截人脸
- 图片容器只用 `.frame-img`，由模板统一应用 `border-radius:var(--radius-sm)`；不要内联覆盖圆角，也不要使用 `box-shadow`
- UI / 信息图 / 流程图若是用户原始截图或文字密集图,使用 `.fit-contain`;现有资产与槽位比例匹配时使用对应比例类铺满容器,例如 `.frame-img.r-21x9`
- 多图同组必须统一槽位、比例、高度,不要混用
- 用户原始截图优先保真并使用 `fit-contain`;不要为了比例统一就重画截图内容
- 配图必须来自 `assets/media/` 或用户明确提供的素材;禁止调用外部图库、图片生成流程，或用内联 SVG、Canvas、CSS 图形绘制插画配图
- 只将已分配槽位的素材复制到 `images/`;最终目录中的未引用媒体必须清理或记录保留原因。不要为了消耗素材机械地一页一图，但素材充足且匹配时，不应只在全 deck 使用一张

- 文字压图 / 全屏主视觉必须先做 quiet-zone 判断:至少约 30% 低细节区域可承载标题;不通过就换图、换裁切或改成图文分栏,不要整页套黑色/白色遮罩

**自检命令**:
- `rg -n "frame-img[^>]*style=.[^>]*border-radius" index.html`——命中图片容器的内联圆角就改回全局 `--radius-sm`
- `rg -n "box-shadow" index.html | rg -v "box-shadow\s*:\s*none"`——命中非空阴影就删除
- `rg -n "<svg\\b" index.html`——每个内联 SVG 都必须是图表、地图、流程或数据几何，并声明合法 `data-svg-role`
- `grep -n "data-image-slot" index.html`——每张本地图片都应有槽位声明
- `find images -maxdepth 1 -type f` 与 HTML 中 `src="images/` 的去重清单应核对；Validator 会提示已复制但未引用的媒体
- 目视:图片内部如果自带冲突的大标题、页码、页脚或角标,换用其他资产或无图版式,不要在页面里裁切硬救
- 目视:截图外侧背景应该安静托底,不能比截图本身更抢眼;XREAL Style 截图统一 8px 小圆角且不使用投影

### 0-D-2. XREAL Style 底部分页安全区:最低处不要碰 nav

**现象**:图片 caption、脚注、timeline 下方 label、底部 KPI 被分页小方块挡住,或者视觉上贴得太近。

**根因**:`#nav` 固定在 `bottom:2vh`,如果主体内容用 `align-self:end` / `align-items:end` / `margin-top:auto` 贴到底,最低处会进入分页区域。

**做法**:
- 主内容最低边缘与分页组件之间至少留 `3vh` 呼吸空间
- 图文页需要底部对齐时,先控制图片高度,再给主体容器加 `.nav-safe-bottom` / `.nav-safe-bottom-tight`
- 其他页面需要贴底时,给主体容器加 `.nav-safe-bottom` 或 `.nav-safe-bottom-tight`
- 不要手写 `bottom:2vh` / `bottom:0` 放说明文字;这会和 nav 抢位置

**自检**:
- 视觉:翻到该页,看最后一行 caption/label 是否明显高于分页组件
- 代码:`grep -E "align-items:end|align-self:end|bottom:0|bottom:2vh|margin-top:auto" index.html`,命中后逐个确认是否有 nav safe zone

### 0-D-3. 后验测量:先量超出和空白,再改版式

**现象**:一页只超出 20-30px,但修的时候删掉大块内容,结果下方多出一大片空白;或者标题与正文贴在一起,肉眼检查时容易漏。

**做法**:
- 生成后运行 `node <SKILL_ROOT>/scripts/validate-swiss-deck.mjs path/to/index.html`
- 如果环境里能解析到 Playwright,校验器会额外执行真实渲染测量:
  - `M1 DOM/visual overflow`:量出超出多少 px,并指出最低/最高的问题元素
  - `M1 bottom whitespace`:量出底部空白和 active content height,防止从"超出"修成"巨空"
  - `M1 nav-safe`:量出最低内容是否进入底部分页安全线
  - `M2 title gap`:量出标题到下一块内容的距离,防止标题和正文贴住

**Overflow 修正阶梯**:
- `1-40px` over:只做微调,上移内容组或收紧一个 gap/padding;不要删内容。
- `40-90px` over:局部压缩 gap/padding 或降低一个模块高度;仍然优先保留内容。
- `90-160px` over:轻微压标题或压缩一段正文,再考虑拆页。
- `160px+` over:才考虑换更高容量版式、合并模块或删内容。

**修完反查**:
- 如果 `M1 bottom whitespace` 变大,说明修过头了;恢复部分间距、放大最后一块或把内容组向下回调。
- 每轮只做一个档位的调整,重渲染后再跑 validator。
- 不要靠多模态肉眼先猜;超出、底部空白和标题间距先看测量值。

---

### 0-E. XREAL Style 模板还原度守卫:原始 PPT 是 golden source

**现象**:生成页看起来像 XREAL Style,但和原始参考 PPT 的实际字重、间距、时间线、卡片密度不一致;越迭代越偏离参考。

**根因**:把新增图片版式或实验结构写成了全局样式修改,或无意改动了原始基座类,例如 `.h-hero` / `.h-xl` 字重、`.tl-node` 列宽、`.duo-compare` 间距。

**做法**:
- 仓库内的 `assets/template-xreal.html` 是 XREAL Style 的 golden source 快照,但要以**实际页面用法**为准,不要只看未使用的 CSS helper
- 标题字重按固定角色表执行：`.h-hero` / `.h-xl` / `.h-hero-zh` / `.h-xl-zh` 使用 `var(--weight-display)`；纯英文为 500，中文/日语及对应混排为 600
- 除品牌层、封面/封底黑色基底与媒体匹配机制、S22 图片槽位修复、横向时间线 label 居中修复、角色化字重层级和已登记组件规则外,不要改动原始基座 CSS/JS recipe
- 新增图片能力必须绑定到 S22/S15/S16 原始槽位,不要发明新正文结构
- 如果要修改 `assets/template-xreal.html`,先做原始参考对比;可接受差异只应是品牌层、封面/封底黑色基底与媒体匹配、S22 图片定位类、角色化字重 token、标准字距、实心圆点和已知动效修复

**自检命令**:
- 运行本次测试目录里的 `compare-swiss-base.mjs`,确认输出里 `missing in template: 0`
- 目视对比原始 PPT 的同类页面:大标题字重、chrome-min 位置、timeline dot/label、卡片密度必须一致

### 0-F. 视觉 + 代码双核对:不要只看 HTML

**现象**:代码看起来类名正确,但实际页面拥挤、图文关系不对、可选组件堆太多,或者用了不适合内容的版式。

**做法**:
- 同时打开原始参考 PPT、当前模板或生成页、测试 PPT,先做视觉并排判断
- 等入场动效稳定后再截图或下判断,不要把动画中间态当成内容缺失
- 先打开网页逐页看视觉:标题字重、头部间距、正文密度、图片对齐、nav 安全区
- 再回代码看结构:该页是否用了正确版式,必选组件是否齐,可选组件是否过度
- 对照原始 PPT 时以实际画面为准;raw CSS helper 只能辅助,不能替代视觉判断
- 判断问题来源:版式选错 / 必选组件缺失 / 可选组件滥用 / 间距和安全区问题
- 通用版式(S03/S08/S11/S19)可多用;数据专用(S06/S07/S20/S21/S22/S23/S24)必须有真实数据或案例,S24 还必须有连续横轴;结构专用(S14/S15/S17/S25/S26/S27/S28)必须有闭环、矩阵、层级关系、二维路线、媒体化阶段证据、必须同页的三组综合或真实卖点优先级
---

### 0. 生成前必须通过的类名校验(最重要)

**现象**：直接把 `layouts-swiss.md` 的骨架粘到新 HTML,结果样式全部丢失——大标题字重错误、数据大字报字体小得像正文、结构页挤成一坨、图片堆到浏览器底部。

**根因**：如果 `assets/template-xreal.html` 的 `<style>` 里没有这些类的定义,浏览器就 fallback 到默认样式。

**做法**：
- **生成 PPT 前,必须先 `Read` `assets/template-xreal.html` 的 `<style>`**,确认 `layouts-swiss.md` 用到的类都已定义
- 常见 XREAL Style 类:`h-hero / h-statement / h-xl / h-md / t-cat / t-meta / lead / num-mega / card-ink / card-accent / card-fill / card-outlined / grid-12 / span-N / timeline-v / timeline-h / kpi-tower-row / h-bar-chart / xreal-data-chart / xreal-line-chart / frame-img / fit-contain / swiss-lined`
- 如果某个类确实缺了,**在模板的 `<style>` 里补上**,不要在每页 inline 重写
- 生成后打开浏览器,如果看到"大标题是非衬线"或"pipeline 步骤挤在一行",几乎 100% 是这个问题

### 1. 不要用 emoji 作图标

**现象**：在中式杂志风格里用 emoji（🎯 💡 ✅）会立刻破坏格调。

**做法**：用 Google Material Symbols Outlined，统一使用 `FILL 0` 的线性图标：

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">
...
<span class="material-symbols-outlined">target</span>
```

常用图标名：`target / palette / search / explore / share / workspace-premium / check-circle / cancel / add / arrow-forward / grid-view / hub`

### 2. 图片只允许裁底部，左右和顶部绝对不能切

**现象**：用 `aspect-ratio` 撑图，网格会在父容器不足时堆叠或切掉图片关键信息（比如截图上部的标题栏）。

**做法**：图片容器用**固定 height + overflow hidden**，图片走 `object-fit:cover + object-position:top`：

```html
<figure class="frame-img" style="height:26vh">
  <img src="screenshot.png">
</figure>
```

CSS 里 `.frame-img img` 已经预设 `object-position:top`，只裁底。

**绝不用这种写法**（会在网格中撑破容器）：

```html
<!-- 坏例 -->
<figure class="frame-img" style="aspect-ratio: 16/9">...</figure>
```

**例外**：单张主视觉（非网格内）可以用 `aspect-ratio + max-height`，因为父容器会兜底。

### 2b. XREAL Style 必须保持静态纯色背景

**现象**:页面出现网格、点阵、噪点、shader 或动态背景，或封面媒体与主题无关、影响文字可读性。

**根因**:移除了 `<body class="canvas-mode">`，或重新启用了模板中的遗留背景 canvas。

**做法**:
- 保留 `<body class="canvas-mode">`，不要启用或重建背景 canvas。
- 封面/封底固定使用 `#000000` 基底；只有通过语义匹配的官方媒体可作为背景。正文只用 `var(--paper)`、`var(--grey-1)` 或 `var(--ink)`。
- slide 仍需明确带 `light` / `dark` / `accent` / `split` 类，以便导航与反色 Logo 正确工作。

### 2b-2. 整个 deck 全是 light,没有节奏

**现象**:除封面 `hero dark` 外,其余所有页面默认写 `light`——视觉平淡,没有呼吸感,白花花一片。

**根因**:`layouts-swiss.md` 的骨架默认全写 `light`,如果只是粘贴骨架不调整主题,就会全亮。

**做法**:
- **生成前画"主题节奏表"**:每一页写清 `hero dark` / `hero light` / `light` / `dark` 中的哪一个,对齐后再写代码
- **硬规则**:连续 3 页以上同主题 = 不允许;8 页以上必须有 ≥1 `hero dark` + ≥1 `hero light`;不能全是 `light` 正文页——必须有 `dark` 正文页
- **按布局选主题**(详见 `layouts-swiss.md` 开头的主题节奏规划):
  - statement、对比、图文页 → **`light` / `dark` 交替**
  - KPI、图片、流程页 → `light`(截图/数字/流程需要亮底)
  - 封面、问题页 → `hero dark`
  - 收束页 → `hero light` 或 `hero dark`，根据整份 deck 的节奏决定
- **生成后自检**:`grep 'class="slide' index.html`,目视确认节奏有交错

### 2c. chrome 和 kicker 不要写同一句话

**现象**:左上角 `.chrome` 写"Design First · 设计先行",同一页里 `.kicker` 又写"Phase 01 · 设计阶段"——同义翻译,AI 味浓。

**做法**:
- **chrome = 杂志页眉 / 导航标签**:跨多页可相同(如 "Act II · Workflow"、"Data · Result"、"lukew.com · 2026.04")
- **kicker = 本页独一份的引导句**:短、有钩子、是大标题的"小前缀"(如 "BUT"、"一个人,做了什么。"、"The Question")
- 一个描述栏目,一个描述这一页——绝不互相翻译

### 3. 大标题字号不能超过屏宽 / 单字数

**现象**：中文大标题字号设太大（比如 13vw），结果每行只容 1 个字，强制换行非常难看。

**做法**：
- `h-hero`（最大）：10vw，**且标题长度 ≤ 5 字**
- `h-xl`（次大）：6vw-7vw
- 长标题用 `<br>` 手工断行，不要依赖自动换行
- 必要时加 `white-space:nowrap`

**示例**：`我不是程序员。`（6 字）用 `h-xl` 7.2vw + nowrap，一行排完。

### 4. 字体选择：按整套 PPT 的语言语境统一

**做法**：
- 纯英文 PPT → 整套使用 **XREAL Diatype**
- 中文或中英混排 PPT → `<html lang="zh-CN">`，整套使用 **IBM Plex Sans SC**
- 日语或日英混排 PPT → `<html lang="ja">`，整套使用 **IBM Plex Sans JP**
- 混排中的英文、数字、元数据、代码、页码、日期、图表标签和技术标识也使用对应整套主字体
- 不按字符、文本框或页面切换字体；一套 PPT 只使用一套主字体

品牌字体使用模板内置的本地字体文件；Google Fonts CDN 仅用于 Material Symbols Outlined 图标。

### 4b. 图片不要用 `align-self:end` 贴底

**现象**：左文右图布局里,为了让右列图片和左列 callout 底部对齐,在 `<figure>` 上加 `align-self:end`。结果:
- 如果父容器不是 grid(比如类名没定义),`align-self` 完全失效,图片掉到文档流最下面被浏览器底栏遮挡
- 即使是 grid,图片会在 cell 里贴底,低分屏上仍然被 `.foot` 和 `#nav` 圆点遮挡

**做法**:
- 图文混排**必须用 `.frame.grid-2-7-5`**(或 `.grid-2-6-6`/`.grid-2-8-4`)
- 右列 `<figure class="frame-img r-16x10">` 或 `<figure class="frame-img r-4x3">` 自然贴顶即可
- 要让左列 callout 看起来"贴底",给**左列**加 flex column + `justify-content:space-between`,不要动右列
- 如果图片与大标题顶端齐平但正文从标题下方开始,给图片加 `margin-top:7vh` 到 `9vh`,让图片跟正文内容区对齐

### 4c. 图片不要用原图奇葩比例

**现象**:`aspect-ratio: 2592/1798` 这种从原图复制的比例,在不同屏幕下撑出奇怪的空白或溢出。

**做法**:无论原图什么比例,占位器固定用标准比例 **16/10 / 4/3 / 3/2 / 1/1 / 16/9**。图片自动 `object-fit:cover + object-position:top`,顶部不裁,底部裁掉一点无伤大雅。

### 5. 不要给图片加厚边框 / 阴影

**现象**：为了"高级感"加了强阴影或黑框，瞬间变成商务 PPT。

**做法**：图片统一使用 `--radius-sm:8px`、静态纯色托底；不要加底噪、`box-shadow`、发光或装饰性边框。结构确有需要时只使用 1px hairline。

---

## 🟡 P1 · 排版节奏

### 6. Hero 页和非 hero 页要交替

**推荐节奏**（25-30 页）：
```
Hero Cover → Act Divider (hero) → 3-4 pages non-hero → Act Divider (hero)
→ 4-5 pages non-hero → Hero Question → ... → Hero Close
```

连续 2 页以上 hero 会让人疲劳，连续 4 页以上 non-hero 会让节奏死。

### 7. 大字报页和密集页要交替

大字报（big numbers / hero question）和密集页（pipeline / image grid）交替出现，听众眼睛才不累。

### 8. 同一概念的英文/中文用法要统一

**现象**：一会儿写 "Skills"，一会儿写 "技能"，一会儿写 "薄承载厚技能"，全篇不一致。

**做法**：
- 术语优先用**英文单词**（Skills / Harness / Pipeline / Workflow），这些都是圈内熟悉词
- **别硬翻译**，硬翻译反而生硬
- 整个 deck 里同一个词 1 个写法

### 9. 页面不显示页码

删除顶部、底部、Logo 后和角标中的 `XX / 总页数`。底部导航圆点可保留，用于交互定位，但不显示数字计数。

### 9b. 动效系统:每一页都要有 data-anim 标记

**现象**:生成后打开浏览器,翻页时内容直接"啪"地出来,没有任何节奏感——杂志风完全靠排版硬撑,少了层级展开的仪式感。

**根因**:完全没给任何元素加 `data-anim`,Motion One 脚本找不到可播的元素,整页静态出现。

**做法**:
- 所有正文页,**至少给 kicker / 主标题 / lead / callout / stat-card / figure 这些叶子元素加 `data-anim`**
- **Hero 页**(开场/幕封/问题/结尾):所有核心块(kicker + 大标题 + lead + meta-row)都要加
- **不需要特殊 recipe 的页**:什么也不用写,默认 cascade 就好看
- **需要特殊 recipe 的 4 类页**:必须在 `<section>` 上加对应 `data-animate`
  - 大引用 → `data-animate="quote"` + 每行 `<span data-anim="line" style="display:block">`
  - Before/After 对比 → `data-animate="directional"` + 左列 `data-anim="left"` + 右列 `data-anim="right"`
  - Pipeline 流水线 → `data-animate="pipeline"` + 每 step 加 `data-anim="step"`
  - Hero 页(自动用 hero recipe,但仍需给元素加 `data-anim`)

**自检**:生成后 `grep -c 'data-anim' index.html`,应该数十条以上。如果只有个位数,一定漏标了。

### 9c. Pipeline 页必须加 data-animate="pipeline"

**现象**:流水线页直接全部淡入,失去"一步步讲"的节奏,但切到下一页时又只能往前翻,没法回到上一个 step。

**做法**:Layout 6 的 `<section>` 必须加 `data-animate="pipeline"`。演示时按 →/空格/滚轮下滑可以**逐个点亮 step**,全部点亮之后再按 → 才会翻到下一页。这个节奏是刻意的,不是 bug。

---

## 🟢 P2 · 视觉打磨

### 10. 背景只使用静态纯色

- 封面和封底基底：`#000000`；可叠加通过语义匹配的官方媒体背景。
- light 页面：`var(--paper)` 或 `var(--grey-1)`。
- dark 页面：`var(--ink)`。
- 不使用透明遮罩来透出 WebGL、图片纹理或动态装饰。

### 11. 禁止 shader、噪点和动态装饰

Spiral、FBM、Holographic Dispersion、ASCII、点阵、纹理和持续 RAF 动画都不属于 XREAL Style。视觉冲击由构图、字重、留白、产品图和单一红色信号建立。

### 12. Dark hero 保持克制

Dark hero 不添加 shader 或装饰场；通过静态黑色基底、明确主张和必要的官方媒体证据形成开场冲击。

### 13. 左文右图的对齐

- 左列的文字组 `justify-content:space-between`：标题贴顶，引用框贴底
- 右列图片保持自然顶对齐,不要加 `align-self:end`
- 右列图片通常要跟正文内容区对齐,不是跟大标题顶端对齐;必要时加 `margin-top:7vh` 到 `9vh`
- 网格整体 `align-items:start`（不是 `center` / `end`）

### 13b. 标题与正文间距

- 顶部标题 + 下方长文章/引用/图表的两段式布局,中间必须有明显间距,推荐 `margin-top:6vh` 到 `8vh`
- 居中大标题页必须整体水平居中,不要只让文字块左对齐居中摆放
- 复杂内容页用大标题定调,下方内容用 grid / rowline 两端对齐,不要把大标题、小标题、正文挤成一坨

### 13c. UI 情景图不要拉成巨长条

- 单张 UI 截图如果放满宽后变成长条,优先拆成 2-3 个局部面板
- 多面板拼排时每个 `.frame-img` 用同一个固定高度类,如 `.h-16` / `.h-18` / `.h-22`,不要用同一个超宽容器硬塞
- 同一组图片的视觉大小必须一致,不要混用不同高度、不同缩放和不同边距密度
- 如果确实需要全宽,必须从资产库选择比例足够长的横向图片;没有合适资产时改用其他版式

### 13d. 媒体资产不要与 slide 元素冲突

- 优先选择不含页眉、页脚、页码、角标或装饰边框的媒体资产
- 流程图/信息图只保留核心图形和必要短标签,PPT 自己负责标题、页脚和 chrome
- 如果资产自带元素与当前页面冲突,换用其他资产或无图版式,不要在 PPT 里重复叠加 chrome

### 13e. XREAL Style 图文混排不能只用一种

- 7-8 页 XREAL Style 测试 deck 至少使用 6 个不同 S 编号版式
- 有 2-3 张配图时,至少使用两种图片承载方式:S22 主视觉 / S15 矩阵 / S16 小报 / S08 对照图文 / S19 四卡证据
- 左文右图或右文左图需要底对齐时,先控制图片高度和主体安全区,不要把整块内容推到分页组件附近
- 白底信息图容器必须白底、无描边;不要用灰框包白图

### 13f. XREAL Style 中文大标题要降级

- 中文 2 行标题默认从 `min(5.8vw,10.2vh)` 起步,不要直接用英文页的 `6.8vw-7vw`
- 任一行 9-12 个中文字符时降到 `min(5.2vw,9.2vh)`
- 3 行标题可在不改变事实、范围和语气的前提下缩短，省略的限定信息必须移入正文；不能为了标题大而挤掉或删除下方图文内容

### 14. 卡片型实体块与图片统一使用 8px 小圆角，基线柱体底角保持直角

XREAL Style 的 `.frame-img`、`.sub-card`、`.stack-block`、KPI Tower 的 `.cap`、Horizontal Bar 的 `.row-track/.row-fill`、Three Forces 的 `.hero-ink-col/.force-card`、Multi-card Brief 的 `.brief-card`、Milestone Gallery 的 `.milestone-entry` 统一使用 `border-radius:var(--radius-sm)`（8px）。KPI Tower 的 `.body-block`、S23 `.chart-bar` 和同类垂直柱体只保留 7-9px 顶部圆角，底部两角必须为 `0` 并与共同 x 轴齐平。S19 Bento 仅整体外框圆角，内部区块必须为直角。页面画布、分割线和坐标轴保持直线；不使用阴影、大圆角、胶囊形或消费 app 式卡片感。

### 14a. Multi-card Brief 默认等权，强调必须有语义依据

默认六张 `.brief-card` 都使用白底 + 1px 中灰边界，不为了制造焦点强行涂黑一张。只有内容明确存在首选、推荐、关键或风险优先级时，才允许最多一张 `.is-accent`，并添加 `data-emphasis="primary|recommended|critical|risk"`；强调卡使用黑底、白色标题和约 74% 白色辅助文字。
微卡四边统一使用 `--brief-card-pad:2.2vh`；上下左右的计算后 padding 应一致，不混用不同的 `vh` 与 `vw`。
S04 `.sub-card` 同样使用 `--sub-card-pad:2.2vh` 保持四边相等；右上 `.nb-corner` 的 `top / right` 也必须相等。

### 14b. 单位和中文标题

KPI / 图表中的展示级单位统一挂在数字右上肩位：`°`、`in`、`Hz`、`ms`、`%` 都使用 `vertical-align:text-top` 和 `.62` 中性透明度，并保持数字 + 单位不可拆行。文字单位与数字间距为 `.18em`；`°` 使用 `.03em` 的紧间距。正文句子中的单位作为普通文本随正文基线。角度写作 `57°` 或 `57<sup class="unit-degree">°</sup>`，禁止 `<sub>°</sub>`。中文、日语及对应混排标题保持正体，不使用 `<i>`、`<em>` 或 `font-style:italic`。
---

## 🔵 P3 · 操作细节

### 15. 图片路径用相对路径

图片放在 `images/` 文件夹下，HTML 里用相对路径 `images/xxx.png`，不要用绝对路径。

### 16. 页序只由导航系统维护

JS 动态计算总页数并扩展底部翻页圆点；页面内容层不得再写 `XX / N`。

### 17. 翻页导航要保留

模板默认支持：← → / 滚轮 / 触屏滑动 / 底部圆点 / Home·End。不要删 JS 里的导航逻辑。

底部圆点必须保持弱提示：亮底普通点 `.08`、当前点 `.18`，暗底普通点 `.10`、当前点 `.22`。当前点可以加宽，但不得使用不透明黑白或 `var(--accent)`。

### 18. 不要用 `height:100vh` 硬设，用 `min-height:80vh`

`100vh` 会让内容刚好卡满屏幕，但浏览器工具栏、标签栏会吃掉一部分高度，导致内容溢出。用 `min-height:80vh + align-content:center` 更稳。

---

## 🧪 最终自检清单

生成完 PPT 后，逐项对照这个清单（勾一下）：

```
预检(生成前)
  □ 新任务已完成 Skill 更新检查；如检测到更新，已询问用户并按其选择处理
  □ 已读过 template-xreal.html 的 <style>,确认所需类都存在
  □ 已决定每页使用哪个正式登记版式（S01-S08、S11-S28；S09/S10 已移除）
  □ 已画出"主题节奏表":每页明确 hero dark / hero light / light / dark
  □ 节奏表满足硬规则:无连续 3 页同主题 / 有 ≥1 hero dark + ≥1 hero light(8 页以上) / 至少有 1 个 dark 正文页
  □ `<title>` 已改为实际 deck 标题(grep "[必填]" 应无结果)
  □ XREAL:已复制 `assets/fonts/` 与 `assets/brand/xreal-logo-black.svg`
  □ XREAL:已按整套 PPT 语境选择主字体——纯英文为 XREAL Diatype，中文或中英混排为 IBM Plex Sans SC，日语或日英混排为 IBM Plex Sans JP
  □ XREAL:语言标记正确——英文 `lang="en"`，中文 `lang="zh-CN"`，日语 `lang="ja"`
  □ XREAL:未按字符、文本框或页面混用两套品牌字体
  □ XREAL:每页 chrome-min 的品牌位置使用 XREAL Logo,深色背景反白
  □ XREAL:已建立媒体编排表；只复制已分配槽位的素材，`images/` 不存在无说明的孤儿媒体
  □ XREAL:产品图标使用 Google Material Symbols Outlined,统一 `FILL 0`
  □ XREAL:红色仅用于明确的关键数据/警示语义,不成为第二套页面 accent
  □ XREAL Style:封面是 `slide accent` 黑色基底(不是 `slide light` 白底),data-layout 为 `XREAL-COVER-BLACK`，并声明 `data-media-match`
  □ XREAL Style:封底是最后一页，使用 `slide accent` 黑色基底 + 居中大号 `Thanks` + 底部中央小号 XREAL Logo,data-layout 为 `XREAL-CLOSING-BLACK`，并声明 `data-media-match`
  □ XREAL Style:当封面/封底存在合适媒体时已使用对应 `.xreal-cover-media` / `.xreal-closing-media`；若为 `none`，确实没有通过语义、quiet zone 与对比度检查的素材
  □ XREAL Style:`rg -n "ascii-bg" index.html` 无结果
  □ XREAL Style:封面、页眉、Logo 后和角标均没有页码或"01"等无语义编号
  □ XREAL Style:中文与日文标题保持正体；纯英文黑色背景标题如确有必要，才使用一次克制斜体强调
  □ XREAL Style:Logo 默认独立;相邻文字如存在,字高与 Logo 一致、使用标准字距，并保留至少 `1.6vw` 间距
  □ XREAL Style:正文页页眉品牌区明显小于封面/封底,且不与页面标题争抢层级
  □ XREAL Style:所有带 `chrome-min` 的版式，页眉到首个正文块为 24px（tight 为 16px），没有被额外首块 margin 双重下推
  □ XREAL Style:英文页眉使用 `.313` 光学比例，中文/日语及对应混排使用 `.26`，视觉字高均与 Logo 一致
  □ XREAL Style:普通英文短语使用自然大小写;全大写只用于 XREAL 字标、通用缩写和短型号代码
  □ XREAL Style:没有无信息价值的角标、重复小标题和装饰性分割线
  □ XREAL Style:S04/S05/S19 卡片媒体都有明确语义角色；没有给密集卡片强塞图片，S19 hero 文字直接反白且内部没有新增圆角
  □ S02 纵向时间线有统一列头；宽度为正文的 72%-82%，每个节点都包含可见且对齐的 dot、年份、同口径指标、阶段名和体验影响；贯穿轴按行连续，横线从 axis 右侧开始且不与竖轴叠线，列头与正文列左对齐
  □ S17 已声明 flow / hierarchy / network / containment；左侧只有结论与解释，右侧为唯一关系结构，两列顶部误差 ≤16px；flow 纵向占满关系图区至少 85%、节点均衡分布，没有重复阶段列表或制作说明式文案，同心圆只用于真实包含关系
  □ S17 flow 的每个连接器独占相邻节点间区域；箭头 ≥24px 并位于左侧阶段栏、与上下 `.system-level` 共轴，关系标签左对齐右侧正文列，连接器未被节点边界遮挡
  □ S14 使用单一细线闭环、3-5 个 HTML 节点与一个中心结论；SVG 无文字，最多一个红色返回段，无粗圆环或重复装饰点
  □ 单一产品 deck 已检查 `00-product-marks/`；有官方产品标志时没有继续用手打产品名替代，且产品标志未侵入页眉企业 Logo 位
  □ S12 manifesto 中的产品标志只作身份落款，宽度为页面内容宽度的 10%-16%，没有成为第二主标题；底部身份行透明且没有整块黑色通栏；如使用背景媒体，仅使用匹配的 lifestyle/conceptual/品牌 KV，覆盖 ≥95% 且有深色蒙版

内容
  □ 每一幕的页数比例合理(不会头重脚轻)
  □ 没有使用 emoji 作图标
  □ Skills / Harness 等术语用法统一
  □ 每页的 kicker + 标题 + 正文 三级信息清晰
  □ S23/S24 的标题写成数据结论,单位、坐标标签、来源和系列含义齐全
  □ 所有底部来源/说明注脚使用统一 `--footnote-size`，左端与内容轴对齐、底部停在同一导航安全基线；没有 border、分割线、底色或额外 padding
  □ 每个底部注脚/底栏都通过必要性审计：只承载来源、口径、法务/风险或信息增量；没有重复“虚构/示意”，没有产品名、口号、芯片名、功能列表或制作说明式填空栏
  □ S07 每个 `.row-fill` 都以 `--value` 持久保存真实宽度；动效结束和 B 静态模式下仍可见，实际宽度与 `--value` 一致；标签列按内容收紧，标签到 track 间距 16-32px；普通条同色，最多一个有结论依据的 `.critical` 红色关键项
  □ S23 四边 plot frame 同色同粗且没有与首末网格线叠加；默认使用 `data-scale-mode="auto"`，`data-value` 保存原始数值并由当前数据域生成 nice scale；只有跨图共享量纲时才用 fixed min/max；没有沿用示例纵轴导致最高柱明显偏矮；首末柱与边界至少 28px、没有贴边或裁切，最高数值留在 plot 内；每个 `.chart-value` 与对应柱体水平中心对齐，且不依赖水平 transform
  □ S24 横轴确实是时间或连续变量,没有把无顺序类别强行连线；四边 plot frame 同色同粗、首末网格线不重叠，`.line-geometry` 左右至少 28px，首末点、描边和终值标签都没有越界；终值标签透明底并位于端点左上肩位，没有压线或压点
  □ S25 确实存在时间/阶段与第二层级维度；2-4 个 period、2-4 条中性 lane、3-7 个媒体节点均完整落在 plot 内，节点不重叠；纵轴标签列收紧并左对齐，标签到 plot 为 12-24px；示意位置已声明 illustrative
  □ S26 有 4-6 个完整阶段，每阶段的媒体都与语义匹配；卡片统一浅灰底、1px 边界、等距 padding、8px 圆角且等高；阶段眉题仅在真实年份/版本/独立阶段名有信息增量时整组出现，没有重复翻译主标题；底部综合链没有变成按钮或 filled ribbon
  □ S27 只在信息必须同时可见时使用；有 1 个总述带、恰好 3 个等高主面板、7-12 个条目和来源；总述文字共享同一左轴，内部没有重复分割线；列宽与组内行高依据内容量调整；横向比较项可用无边框中性子区域区分且文字紧凑聚合在顶部；每面板至少 2 项，正文 ≥16px、meta ≥14px，焦点区有语义依据和 `data-focus-reason` 且未固定在某个序号，数字编号列与文本左轴对齐；最多 1 张 `cover + darken` 背景媒体，没有自动拆页
  □ S28 只在存在真实卖点优先级时使用；已按内容和媒体构图选择 `left-focus/right-focus/panorama/center-focus`，没有随机轮换或机械复用固定坐标；12×6 网格中有 5-9 卡、恰好 1 个主卡、1-4 个中卡、至少 2 个支持卡、至少 3 种面积且无重叠越界；主卡占约 25%-50%，1-4 张媒体均符合 cover/darken 或 contain/none 契约

排版
  □ 所有大标题没有出现 1 字 1 行的换行
  □ 图片网格用 height:Nvh 而非 aspect-ratio
  □ 图片只裁底部，顶部和左右完整
  □ 全局主字体与 deck 语言语境一致,所有组件继承同一主字体
  □ Pipeline 多组之间有明显分隔
  □ 描述性小标题和辅助文字使用标准字距,没有 `text-transform:uppercase` 或超过 `0.05em` 的正向 tracking
  □ 列表 bullet 使用实心圆点,没有短横线
  □ 横向时间线节点名称使用 600 字重

视觉
  □ hero 页和 non-hero 页交替
  □ hero 页使用静态纯色背景,没有 WebGL、ASCII、点阵、纹理或动态装饰
  □ S04/S05/S06/S07/S13/S16/S26/S27/S28 的卡片型实体块和图片统一使用 8px 小圆角；S06/S23 等基线柱体仅顶部圆角、底角为 0 且贴齐 x 轴；S19 Bento 只圆整体外框、内部直角
  □ S06 KPI Tower 每根柱体与共同基线零间距；1px 边界没有形成悬浮缝隙
  □ S04/S16 卡片四边 padding 相等，S04 编号的 top/right 相等；S16 默认六卡等权，若存在强调卡，其内容确有优先级依据、已声明 `data-emphasis`，且反白文字有足够反差
  □ KPI / 图表大数字的单位统一位于右上肩位且不拆行；`screen` 等英文词单位使用 `.unit-word` 与正常字距；正文单位随正文基线；角度没有使用下标；中文与日文标题没有斜体
  □ S22 图片上的标题为直接叠加的高对比文本，没有白底卡片、色块或半透明面板
  □ S07/S23/S24 与 ECharts 共用 `--chart-series-1/2/3/4` 中性色阶和 `--chart-critical`；没有蓝灰/临时色或无语义红色，最多一个红色关键系列/点
  □ S24 SVG 只包含线、点和数据几何,没有 `<text>`、面积渐变或无说明双轴
  □ S25/S26/S27/S28 没有复制参考图的蓝色 tabs、多彩泳道、彩色渐变、UI 控件、大圆角或阴影；媒体框、S25 节点、S26 阶段卡、S27 主面板和 S28 单卡保持 8px 小圆角
  □ ECharts 只用于登记的复杂图表类型,保留正式版式,使用离线 bundle 与 XREAL 受控主题
  □ ECharts 页面在 B 静态模式可读,无默认 tooltip/toolbox、彩虹色、阴影、渐变或 dashboard 控件
  □ 没有发光、霓虹、大圆角、胶囊形或 SVG/Canvas/CSS 插画配图
  □ 没有沉重的阴影和边框

交互
  □ ← → 翻页正常
  □ 底部圆点数量与总页数匹配
  □ 底部圆点透明度克制,当前点不使用实色 accent
  □ 页面没有可见页码，底部圆点数量与总页数匹配
  □ ESC 键触发索引视图（如果保留）
  □ B 键触发静态/低功耗模式,但页面右下角不显示操作提示

动效
  □ `assets/motion.min.js` 存在(本地兜底)
  □ 使用 ECharts 时 `assets/echarts.min.js` 存在且最终 HTML 已通过 `inline-echarts.mjs` 内联
  □ 低功耗模式下当前页内容仍全部可见,且没有遗留背景 canvas 挂 RAF 循环
  □ 翻页时内容逐个淡入,不是"啪"一下全出
  □ 大引用页 `<section>` 带 `data-animate="quote"`,每行 `<span data-anim="line">`
  □ Before/After 对比页 `<section>` 带 `data-animate="directional"`,左右列标 left/right
  □ Pipeline 页 `<section>` 带 `data-animate="pipeline"`,每 step 标 data-anim="step"
  □ S23 使用 `chart-rise`,S24 使用 `line-draw`,S25 使用 `portfolio-roadmap`,S26 使用 `milestone-gallery`,S27 使用 `dense-synthesis`,S28 使用 `priority-bento`;低功耗模式下全部结构仍可见
  □ `grep -c 'data-anim' index.html` 数量 ≥ 页数 × 3(平均每页 3 个以上标记)
```

全勾完，才是合格的 PPT。
