# 质量检查清单（Checklist）

每一条都是踩过坑之后总结的，按重要性排序。

生成 PPT 前，先通读一遍；生成后，逐项自检。

---

## 🔴 P0 · 一定不能犯的错

### 0-S. XREAL Style locked mode:正文页必须来自 23 个正式登记版式

**现象**:颜色、字体看起来像 XREAL Style,但标题跑到中间、图片不在网格上、页面结构和正式登记版式完全不是一套东西。

**根因**:生成时把 XREAL Style 当成风格包,自由组合了未登记结构或 SVG 插画页面,没有从 23 个正式登记版式里选。历史实验 `P23/P24` 与正式 `S23/S24` 不是同一组 ID。

**做法**:
- 先读 `references/swiss-layout-lock.md`
- 正文页只能使用 `S01-S08`、`S10-S24`;`S09` 已移除;新增首页/尾页只能使用 `XREAL-COVER-BLACK` / `XREAL-CLOSING-BLACK`
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

### 0-S-2. XREAL Style 顶部标题默认左上,不是居中

**现象**:最顶上的中文标题在页面中间,像一页自制海报,不再像原始 PPT。

**做法**:
- 除 `S03/S10` 这类 statement/split 版式外,顶部标题必须贴原始模板的左上内容轴。
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
- 内容超出时,先删减文案、拆页或换 Sxx 版式,不要用 10/11/12/13px 小字硬塞。

**做法（角色字重层级 ⭐）**:
字重由内容角色固定，同一角色在整套 PPT 中保持一致：

- Hero / 封面 / 章节主标题 → `var(--weight-display)`：XREAL Diatype **500**，IBM Plex Sans SC **600**
- 页面标题 / 模块标题 → `var(--weight-title)`：XREAL Diatype **500**，IBM Plex Sans SC **600**
- 关键 KPI / 数据 → 纯英文 **500**，中文或中英混排 **600**；每页最重要的单个数据可使用 **700**
- 副标题 / lead → **400**
- 正文 / 描述 → **400**
- caption / 辅助元数据 → 纯英文 **400**，中文或中英混排 **450**
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

### 0-B-2. XREAL Style 封面 / 封底默认:纯黑背景 + 极简品牌收束

**现象**:封面用 `slide light` 白底 + 黑字 + 一个大大的"01"，或页眉出现 `01 / 07` 等计数；数字与内容无关，形成多余角标。

**根因**:封面和封底承担不同职责。封面需要建立主题，封底只需要品牌落款；把 takeaway、作者日期和宣言继续堆在封底会削弱结束感。

**做法**(XREAL Style 必守):
- **封面强制 `<section class="slide accent">`**(满屏黑色),不要 `slide.light`,也不要 `slide.dark`;黑色区域保持纯黑,禁止 ASCII、点阵、纹理、噪点和动态装饰背景
- **页面不显示页码**：删除页眉、Logo 后、角标和封面大字中的 `01 / N`、`NN / NN` 等计数
- **强调字可用斜体**,但保持与主标题相同字重或升至强调字重,不要降成 Light；黑底页面默认不额外上色
- **封底强制 `<section class="slide accent">`** 全屏纯黑，使用大号 `.xreal-closing-thanks` 作为居中主视觉，小号 `.xreal-closing-logo` 通过 `.xreal-closing-mark` 固定在底部中央
- 封底必须是最后一个 section，进入该页时隐藏底部分页导航；不放 takeaway、宣言、作者日期、页码、联系方式、CTA、眉题或装饰线，所有结论在前一页完成
- Logo 默认独立,右侧不接 deck 名、章节名或风格说明;确有导航文字时,文字标准字距且视觉字高与 Logo 一致
- 正文页 chrome 品牌区使用紧凑导航级尺寸；IBM Plex Sans SC 相邻文字按 Logo 宽度的 `.26` 计算，XREAL Diatype 按 `.313` 计算，并与 Logo 垂直居中；封面/封底才使用较大品牌级尺寸
- 普通英文眉题、导航、标签、图注和页脚使用自然大小写;禁止整词组全大写,也禁止 CSS `text-transform:uppercase`
- 全大写只允许 XREAL 字标、行业通用缩写和短型号代码;辅助文字 `letter-spacing` 默认 normal,最大不超过 `0.05em`
- 删除无信息价值的角标、`MANIFESTO` 式重复小标题和封面底部分割线
- 封面主标题使用 `.xreal-cover-title`；正文页面标题使用 `.xreal-page-title`。纯英文语境自动使用更克制的字号 token，不在页面内联放大

**自检命令**:
- `rg -n "ascii-bg" index.html`——应无结果
- `grep -E '"slide accent"' index.html | head -1`——封面应是 `slide accent` 而非 `slide light`
- `rg -n 'data-layout="XREAL-(COVER|CLOSING)-BLACK"' index.html`——封面和封底应各命中一次
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
- 不同单位默认拆图或拆页；不使用无说明双轴。类别无连续顺序时使用 S23/P7,不要连线。
- 红色只能标记一个关键系列或关键拐点；其余系列使用黑、灰、银，并通过图例、线型或终值标签辅助识别。
- 标题必须写成数据结论；图表占主导面积，不在上方再堆 KPI 卡片或 dashboard 控件。

**自检命令**:
- `rg -n 'data-layout="S23"[^>]*data-animate="chart-rise"|data-layout="S24"[^>]*data-animate="line-draw"' index.html`——每张新增图表页都应命中正确 recipe。
- `rg -n 'data-layout="S2[34]"' index.html` 后逐页确认 `.chart-unit`、`.chart-source` 和 HTML 坐标标签齐全。
- `rg -n '<svg[^>]*class="[^"]*line-chart-svg[\s\S]*?<text' index.html`——应无结果。

### 0-B-5. XREAL ECharts 只处理复杂数据形状

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

**做法**:
- 先选版式:单张大图 + KPI 用 `S22`;多图用 `S15/S16` 的原始网格骨架改造
- S22 资产优先选择接近 `21:9` 的 KV、产品图或场景图,并在 `<img>` 上写 `data-image-slot="s22-hero-21x9"`
- 照片默认 `object-position:center 35%` 或 `center center`,不要用 `top center` 截人脸
- 图片容器只用 `.frame-img`，由模板统一应用 `border-radius:var(--radius-sm)`；不要内联覆盖圆角，也不要使用 `box-shadow`
- UI / 信息图 / 流程图若是用户原始截图或文字密集图,使用 `.fit-contain`;现有资产与槽位比例匹配时使用对应比例类铺满容器,例如 `.frame-img.r-21x9`
- 多图同组必须统一槽位、比例、高度,不要混用
- 用户原始截图优先保真并使用 `fit-contain`;不要为了比例统一就重画截图内容
- 配图必须来自 `assets/media/` 或用户明确提供的素材;禁止调用外部图库、图片生成流程，或用内联 SVG、Canvas、CSS 图形绘制插画配图

- 文字压图 / 全屏主视觉必须先做 quiet-zone 判断:至少约 30% 低细节区域可承载标题;不通过就换图、换裁切或改成图文分栏,不要整页套黑色/白色遮罩

**自检命令**:
- `rg -n "frame-img[^>]*style=.[^>]*border-radius" index.html`——命中图片容器的内联圆角就改回全局 `--radius-sm`
- `rg -n "box-shadow" index.html | rg -v "box-shadow\s*:\s*none"`——命中非空阴影就删除
- `rg -n "<svg\\b" index.html`——每个内联 SVG 都必须是图表、地图、流程或数据几何，并声明合法 `data-svg-role`
- `grep -n "data-image-slot" index.html`——每张本地图片都应有槽位声明
- 目视:图片内部如果自带冲突的大标题、页码、页脚或角标,换用其他资产或无图版式,不要在页面里裁切硬救
- 目视:截图外侧背景应该安静托底,不能比截图本身更抢眼;XREAL Style 截图统一 3px 小圆角且不使用投影

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
- 标题字重按固定角色表执行：`.h-hero` / `.h-xl` / `.h-hero-zh` / `.h-xl-zh` 使用 `var(--weight-display)`；纯英文为 500，中文或中英混排为 600
- 除品牌层、封面/封底纯黑机制、S22 图片槽位修复、横向时间线 label 居中修复、角色化字重层级和已登记组件规则外,不要改动原始基座 CSS/JS recipe
- 新增图片能力必须绑定到 S22/S15/S16 原始槽位,不要发明新正文结构
- 如果要修改 `assets/template-xreal.html`,先做原始参考对比;可接受差异只应是品牌层、纯黑封面/封底、S22 图片定位类、角色化字重 token、标准字距、实心圆点和已知动效修复

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
- 通用版式(S03/S08/S11/S19)可多用;数据专用(S06/S07/S20/S21/S22/S23/S24)必须有真实数据或案例,S24 还必须有连续横轴;结构专用(S14/S15/S17)必须有闭环、矩阵或层级关系
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

**现象**:页面出现网格、点阵、噪点、shader 或动态背景，黑色封面不再纯净。

**根因**:移除了 `<body class="canvas-mode">`，或重新启用了模板中的遗留背景 canvas。

**做法**:
- 保留 `<body class="canvas-mode">`，不要启用或重建背景 canvas。
- 封面/封底黑色区域固定 `#000000`；正文只用 `var(--paper)`、`var(--grey-1)` 或 `var(--ink)`。
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
- 中文或中英混排 PPT → 整套使用 **IBM Plex Sans SC**
- 中英混排中的英文、数字、元数据、代码、页码、日期、图表标签和技术标识也使用 **IBM Plex Sans SC**
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

**做法**：图片统一使用 `--radius-sm:3px`、静态纯色托底；不要加底噪、`box-shadow`、发光或装饰性边框。结构确有需要时只使用 1px hairline。

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

- 封面和封底黑色区域：`#000000`。
- light 页面：`var(--paper)` 或 `var(--grey-1)`。
- dark 页面：`var(--ink)`。
- 不使用透明遮罩来透出 WebGL、图片纹理或动态装饰。

### 11. 禁止 shader、噪点和动态装饰

Spiral、FBM、Holographic Dispersion、ASCII、点阵、纹理和持续 RAF 动画都不属于 XREAL Style。视觉冲击由构图、字重、留白、产品图和单一红色信号建立。

### 12. Dark hero 保持纯黑和克制

Dark hero 不添加 shader 或装饰场；通过静态纯黑背景、明确主张和必要的产品证据形成开场冲击。

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
- 3 行标题优先改写,不能为了标题大而挤掉下方图文内容

### 14. 卡片型实体块与图片统一使用 3px 小圆角，基线柱体底角保持直角

XREAL Style 的 `.frame-img`、`.sub-card`、`.stack-block`、KPI Tower 的 `.cap`、Horizontal Bar 的 `.row-track/.row-fill`、Three Forces 的 `.hero-ink-col/.force-card`、Multi-card Brief 的 `.brief-card` 统一使用 `border-radius:var(--radius-sm)`（3px）。KPI Tower 的 `.body-block`、S23 `.chart-bar` 和同类垂直柱体只保留 2-4px 顶部圆角，底部两角必须为 `0` 并与共同 x 轴齐平。页面画布、分割线和坐标轴保持直线；不使用阴影、大圆角、胶囊形或消费 app 式卡片感。
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
  □ 已决定每页使用哪个正式登记版式（S01-S08、S10-S24；S09 已移除）
  □ 已画出"主题节奏表":每页明确 hero dark / hero light / light / dark
  □ 节奏表满足硬规则:无连续 3 页同主题 / 有 ≥1 hero dark + ≥1 hero light(8 页以上) / 至少有 1 个 dark 正文页
  □ `<title>` 已改为实际 deck 标题(grep "[必填]" 应无结果)
  □ XREAL:已复制 `assets/fonts/` 与 `assets/brand/xreal-logo-black.svg`
  □ XREAL:已按整套 PPT 语境选择主字体——纯英文为 XREAL Diatype,中文或中英混排为 IBM Plex Sans SC
  □ XREAL:未按字符、文本框或页面混用两套品牌字体
  □ XREAL:每页 chrome-min 的品牌位置使用 XREAL Logo,深色背景反白
  □ XREAL:产品图标使用 Google Material Symbols Outlined,统一 `FILL 0`
  □ XREAL:红色仅用于明确的关键数据/警示语义,不成为第二套页面 accent
  □ XREAL Style:封面是 `slide accent` 满屏纯黑(不是 `slide light` 白底),data-layout 为 `XREAL-COVER-BLACK`
  □ XREAL Style:封底是最后一页，使用 `slide accent` 全屏纯黑 + 居中大号 `Thanks` + 底部中央小号 XREAL Logo,data-layout 为 `XREAL-CLOSING-BLACK`
  □ XREAL Style:`rg -n "ascii-bg" index.html` 无结果
  □ XREAL Style:封面、页眉、Logo 后和角标均没有页码或"01"等无语义编号
  □ XREAL Style:黑色背景上的强调字用 `font-style:italic`,禁止用额外颜色
  □ XREAL Style:Logo 默认独立;相邻文字如存在,字高与 Logo 一致且使用标准字距
  □ XREAL Style:正文页页眉品牌区明显小于封面/封底,且不与页面标题争抢层级
  □ XREAL Style:英文页眉使用 `.313` 光学比例,中文或中英混排使用 `.26`,视觉字高均与 Logo 一致
  □ XREAL Style:普通英文短语使用自然大小写;全大写只用于 XREAL 字标、通用缩写和短型号代码
  □ XREAL Style:没有无信息价值的角标、重复小标题和装饰性分割线

内容
  □ 每一幕的页数比例合理(不会头重脚轻)
  □ 没有使用 emoji 作图标
  □ Skills / Harness 等术语用法统一
  □ 每页的 kicker + 标题 + 正文 三级信息清晰
  □ S23/S24 的标题写成数据结论,单位、坐标标签、来源和系列含义齐全
  □ S24 横轴确实是时间或连续变量,没有把无顺序类别强行连线

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
  □ S04/S05/S06/S07/S13/S16 的卡片型实体块、图片和 Bento 区块统一使用 3px 小圆角；S06/S23 等基线柱体仅顶部圆角、底角为 0 且贴齐 x 轴
  □ S23/S24 图表占正文主导面积,使用 1px 中性网格线,最多一个红色关键系列/点
  □ S24 SVG 只包含线、点和数据几何,没有 `<text>`、面积渐变或无说明双轴
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
  □ S23 使用 `chart-rise`,S24 使用 `line-draw`;低功耗模式下柱高、完整折线与终值仍可见
  □ `grep -c 'data-anim' index.html` 数量 ≥ 页数 × 3(平均每页 3 个以上标记)
```

全勾完，才是合格的 PPT。
