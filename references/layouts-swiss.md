# Layouts · XREAL Style

23 个正式登记版式 · 严格模块化网格 · 每个版式说明用途、骨架、关键类名、专属动效。

> 这是本 skill 唯一支持的版式系统。类名和结构都以 `assets/template-xreal.html` 为准；一份 deck 只能使用 XREAL Style 版式。

---

## XREAL Style locked mode(必须先读)

本主题的 golden source 是仓库内的 `assets/template-xreal.html`(由作者本机的原始参考 PPT 派生;原始文件不随仓库分发)。`swiss-layout-lock.md` 当前登记 `S01-S08`、`S10-S24`；原 `S09 Dot Matrix Statement` 已移除。

生成正文页时不要把 XREAL Style 当成“自由组合的风格包”。默认只能使用 `references/swiss-layout-lock.md` 登记的 23 个版式（`S01-S08`、`S10-S24`）。每个 slide 都必须在 `<section>` 上写 `data-layout="Sxx"`。

**关键约束**:

- 顶部中文标题默认左对齐并处在左上内容轴;不要把标题放到页面中间。
- 不允许临时发明正式登记集合之外的正文结构。历史实验图文结构沿用旧 `data-layout="P23/P24"` 标识并默认禁用；它们与正式登记的 `S23/S24` 图表版式无关。
- 需要单张大图时使用 `S22 Image Hero`;需要多图时用 `S15/S16` 的原始矩阵/小报骨架改造成图片格。
- 地点、路线、人物住所、城市关系页使用 `S08 + XREAL Map Component`;这仍然是 S08 的右侧插槽扩展,不是新正文页。先读 `swiss-map-component.md`。
- SVG 只画几何,不写可见文字。标签放 HTML 里。
- 生成完成后运行 `node scripts/validate-swiss-deck.mjs index.html`。

---

## 设计语言基线

**配色**（`--accent` 固定为 XREAL 黑色结构锚点，变量以 `assets/template-xreal.html` 的 `:root{}` 为准，语义见 `brand-xreal.md`）
- `--paper` 纸白底 #ffffff(主背景)
- `--ink` 黑墨字 #0a0a0a(主文字 / Ink 反转块)
- `--accent` 结构锚点(XREAL 黑色 `#0A0A0A`)
- `--text-primary / secondary / helper` 三级文字灰阶
- `--border-subtle` 1px 发丝细线 #e0e0e0

**排版**
- 字体按整套 deck 的语言语境选择：纯英文统一使用 XREAL Diatype；中文或中英混排统一使用 IBM Plex Sans SC
- 所有组件继承 `var(--deck-font)`；禁止按字符、文本框或页面拆分字体。中英混排 deck 中的英文、数字、元数据、代码、日期和图表标签也使用 IBM Plex Sans SC
- 字重按信息角色分配,不按字号反比：主标题使用 `var(--weight-display)`，页面标题使用 `var(--weight-title)`，正文 400，标签 500，关键数据 600-700
- 纯英文 XREAL Diatype 主标题默认 500；中文或中英混排 IBM Plex Sans SC 主标题默认 600。内容文字禁止使用 100/200/300
- 大字号收紧:`letter-spacing:-.04em` / `line-height:.9`
- 表格数字：使用当前 deck 主字体，并以 `font-feature-settings:"tnum"` 保持纵向对齐

**中文大标题字号分档**
中文方块字的视觉面积比英文更重,不能直接套英文页的 `6.8vw-7vw`。生成前先按中文标题长度降级:

| 中文标题形态 | 推荐字号 |
|---|---|
| 1 行,≤ 8 个中文字符 | `min(6.4vw,11.2vh)` |
| 2 行,每行≤ 8 个中文字符 | `min(5.8vw,10.2vh)` |
| 2 行,任一行 9-12 个中文字符 | `min(5.2vw,9.2vh)` |
| 3 行或更长标题 | 改写标题;实在不能改时用 `min(4.6vw,8.2vh)` |

规则:中文标题优先改短,其次降字号;不要让标题挤占下方图文区域。英文、数字型 hero 可以更大,中文方法论页必须更克制。

**演示最小字号与角色字重层级**
XREAL Style 不是网页说明页,投屏时不能出现 10-12px 的注释字。默认下限:

| 文本类型 | 最小字号 |
|---|---|
| 正文段落 / 主要说明 | `18px` |
| 卡片描述 / 列表 / 时间线说明 / caption / 图注 | `16px` |
| meta / kicker / mono label / 图表标签 | `14px` |

内容过多时,先压缩文案、拆页或更换 Sxx 版式;禁止靠降低小字字号解决拥挤。图注、时间线说明、KPI 注释、底部 note 尤其要守住这个下限。

**角色字重层级（XREAL Style 核心）** — 字重由内容角色固定，同一角色在整套 PPT 中保持一致：

| 信息角色 | 推荐字重 | 典型场景 |
|---|---|---|
| Hero / 封面 / 章节主标题 | XREAL 500 / IBM Plex Sans SC 600 | h-hero、h-xl、h-statement |
| 页面标题 / 模块标题 | XREAL 500 / IBM Plex Sans SC 600 | h-md、卡片标题、takeaway 标题 |
| 关键 KPI / 数据 | XREAL 500 / IBM Plex Sans SC 600；每页单个核心数据可用 700 | 巨号 KPI、大编号、结论数字 |
| 副标题 / lead | 400 | 引子、产品说明、摘要 |
| 正文 / 描述 | 400 | 正文段落、卡片描述、说明文字 |
| caption / 辅助元数据 | XREAL 400 / IBM Plex Sans SC Text 450 | 图注、来源、辅助信息 |
| kicker / 导航标签 / 图表标签 | 500 | 栏目、导航、图表标签 |

**硬规则:**
- 默认内容样式使用 Regular / Text、Medium / SemiBold 和 Bold 三个层级
- 同级标题保持相同字重；字号变化不改变对应角色的字重
- 封面/黑底反白大标题内的斜体强调保持主标题字重，核心强调可使用 700

**网格**(IBM Carbon 2x Grid 改造)
- 16 列 grid:`grid-template-columns:repeat(16,1fr)` + `gap:16px`
- spacing token:`--sp-3` 8 / `--sp-4` 12 / `--sp-5` 16 / `--sp-6` 24 / `--sp-7` 32 / `--sp-8` 40 / `--sp-9` 48 / `--sp-10` 64 / `--sp-11` 80 / `--sp-12` 96 / `--sp-13` 160

**画布**
- `.canvas-card`:`100vw × 100vh` 全屏铺满，不暴露画布圆角；内部结构容器统一使用 `--radius-sm:3px`，padding `5.6vh 5vw 4.4vh`
- `body{background:var(--paper)}` — 不用 WebGL 背景
- 必须保留 `B` 键静态模式功能,但不显示右下角操作提示。低功耗模式使用 `body.low-power`,停止 WebGL canvas RAF 与 Motion 入场动画,刷新后通过 `localStorage` 保持用户选择。

## XREAL 品牌层

在当前 XREAL Style 版式骨架上，先读 `references/brand-xreal.md`：

- 纯英文 deck 使用 `<html lang="en">`，全局主字体为 XREAL Diatype
- 中文或中英混排 deck 使用 `<html lang="zh-CN">`，全局主字体为 IBM Plex Sans SC
- `var(--sans)`、`var(--sans-zh)` 和 `var(--mono)` 仅作为旧组件兼容接口，均指向 `var(--deck-font)`；不要用它们拆分语言字体
- `--accent` 固定为黑色结构锚点；品牌红色只用于明确的关键数据/警示/操作语义
- `chrome-min` 的左侧品牌位置可使用：

```html
<div class="l brand">
  <img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL">
  <span>Section · Product Brief</span>
</div>
```

- 产品特性图标统一使用 `<span class="material-symbols-outlined">icon_name</span>`，不要混用 Lucide、emoji 或自绘 SVG 图标
- 禁止用 SVG、Canvas 或 CSS 图形绘制人物、设备、场景或抽象科技插画作为配图；合法内联 SVG 仅限图表、地图、流程和数据几何，并标记 `data-svg-role`

---

### P0 对齐法则(每生成一页都先过这 4 条,违反 = 整页报废)

**1. 不要二次叠加水平 padding** ⚠️ 最常踩
`.canvas-card` 已自带 `padding:5.6vh 5vw 4.4vh`。
chrome-min(页眉)、主体内容、底部 footnote 都是 canvas-card 的子元素,**共用同一条 5vw 边线**。
如果在主体那层再写 `padding:5vh 5vw 4vh`,水平方向就变成 `5vw + 5vw = 10vw`,主体比 chrome-min 多内缩一圈,左右对不齐。

```html
<!-- ❌ 错:主体多缩了 5vw -->
<div class="canvas-card">
  <div class="chrome-min">...</div>
  <div style="flex:1;padding:5vh 5vw 4vh;...">主体内容</div>
</div>

<!-- ✅ 对:主体 padding 为 0,只用 grid gap 控垂直间距 -->
<div class="canvas-card">
  <div class="chrome-min">...</div>
  <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr auto;gap:3vh">主体内容</div>
</div>
```

例外:`.slide.split .canvas-card{padding:0}` 已被 CSS 覆盖,split 模式下两个 `.half` 自己控制 padding(常用 `5.6vh 3.6vw 4.4vh`),与本法则不冲突。

**2. kicker 必须在大标题"上方",不要压成左右**
小标题(`.t-meta` / `.t-cat`)与大标题之间是从属关系,版式上必须**上下结构**。

```html
<!-- ❌ 错:auto 1fr 把 kicker 和大标题挤成左右两列 -->
<div data-anim="head" style="display:grid;grid-template-columns:auto 1fr;gap:3vw;align-items:end">
  <div class="t-meta">Methodology · 03</div>
  <h2 class="h-xl-zh">为什么是 N+1</h2>
</div>

<!-- ✅ 对:flex column 上下叠 -->
<div data-anim="head" style="display:flex;flex-direction:column;gap:1.4vh">
  <div class="t-meta">Methodology · 03</div>
  <h2 class="h-xl-zh">为什么是 N+1</h2>
</div>
```

**3. 双约束限高 `min(Xvw, Yvh)` 中 Y ≥ X × 1.6**
标准 16:9 屏 1vw : 1vh ≈ 1.78,如果 Y 太严(例如 `min(7vw, 10vh)`),大字号会被高度上限截断到 10vh,不再受 7vw 主导,显得整体缩小。
经验数值:

| 用途 | 推荐 |
|---|---|
| h-hero 巨字宣言 | `min(11.6vw, 19vh)` |
| h-xl 章节标题 | `min(7vw, 12vh)` ~ `min(7.4vw, 13vh)` |
| 大数字 KPI | `min(8.4vw, 14vh)` |
| 中数字 / 编号 | `min(4.6vw, 8.5vh)` ~ `min(5.6vw, 10vh)` |

**4. canvas-card 子元素之间用 grid `gap`,不要靠 margin/padding 堆**
`.canvas-card` 默认 `display:flex;flex-direction:column`,chrome-min 自带 `margin-bottom:48px`(`--sp-9`)。
主体区往下排几行(head / 内容 / footnote),**首选** `display:grid;grid-template-rows:...;gap:Nvh`,**次选** flex column + gap,**禁用** 在每个子块里加 `margin-top` / `padding-top` 调间距(会和 chrome-min 的 margin-bottom 重叠或撕裂)。

**5. 底部分页安全区:主内容最低处不要触及 nav**
底部分页 dot 固定在 `bottom:2vh`,视觉上占据约 `93vh` 之后的区域。主内容、图片 caption、图表说明、timeline label 的最低处必须停在安全区上方。

- 模板提供 `--nav-safe-bottom:8vh`,可用 `.nav-safe-bottom` / `.nav-safe-bottom-tight`
- P23 使用 `.swiss-img-split.align-image-bottom` 时,模板会自动给底部加安全区,避免图片 caption 被分页组件挡住
- 如果为某页手写 `align-items:end` / `margin-top:auto` / `position:absolute;bottom:...`,必须肉眼检查最低处是否越过 nav
- 视觉自检:打开页面到该页,确认内容最低边缘与分页 dot 之间至少有 `3vh` 呼吸空间

---

**卡片填充规则(必须遵守)**
| 类型 | 类名 | 角色 | 用法 |
|---|---|---|---|
| Ink 黑底 | `.card-ink` | 反转 / 宣言 | hero 块、收束页一半 |
| Black 结构填充 | `.card-accent` | 结构焦点 | 一组中突出一项 |
| Grey 灰底 | `.card-fill` | 默认中性 | 多卡并列、统计卡 |
| Outlined 描边 | `.card-outlined` | 锚点(非卡片) | hairline 分割框 |

❌ 禁止混用(黑色背景+黑色描边、灰底+描边等)
所有卡片类型统一使用 `--radius-sm:3px`，不单独声明其他圆角值。

**装饰极简原则**
- 1px hairline 分隔(`hr-hairline` / `border-bottom`)
- 8×8 / 12×12 直角小方块只用于承担节点或状态语义
- 不使用点阵、圆环纹理、叉号网格或其他纯装饰背景

**图片使用原则(XREAL Style + 媒体资产库)**
- 图片是网格中的"证据块",不是装饰背景;必须有明确功能:案例、实拍证据、UI 截图、系统图、概念信息图
- 所有图片容器统一使用 `--radius-sm:3px`、无阴影;默认**不加图片外框**,让 caption 或页面网格承担层级
- 白底信息图 / 流程图 / UI 图:容器背景必须是 `var(--paper)`,不要用灰底包白图,也不要加 `.swiss-keyline` 描边
- 只有当图片本身边缘无法和页面区分时,才用 `.swiss-lined` 加一条顶部 accent 线;不要给每张图都套边框
- 纪实照片用 `object-fit:cover` 只裁底部/边缘;原始截图或文字密集图用 `.fit-contain`,避免文字被裁
- 如果现有信息图、流程图、UI 图与 S15/S16 槽位比例匹配,使用 `.frame-img.r-21x9` / `.frame-img.r-16x10` 铺满;否则使用 `.fit-contain` 或更换版式
- XREAL Style 图片优先比例:S22 顶部横幅 `21:9`;S15/S16 多图格统一 `21:9` 或统一 `16:10`
- 选择 2-3 张媒体资产时,必须先绑定原始版式槽位:单张大图 = S22;多图 = S15/S16 网格改造;不要使用未登记的 P23/P24
- S22 的照片主体必须位于中央安全区,HTML 用 `object-position:center 35%` 或 `center center`,不要用 `top center` 截人脸
- 页面配图只使用 `assets/media/` 或用户明确提供的 PNG/JPG/JPEG/WebP 文件,不用外部图库、图片生成、内联 SVG、Canvas 或 CSS 绘制插画
- 资产自带元素与页面 chrome 冲突时换图或换版式,不要重绘原始资产

**版式多样性硬规则**
XREAL Style 有 23 个正式登记版式（`S01-S08`、`S10-S24`）,生成时要主动展示版式系统,不要把所有内容都做成 `head + grid-reveal + card`:

- 7-8 页 deck 至少使用 **6 个不同 S 编号版式**
- 不允许连续 3 页使用同一种主体结构(如三页连续 S19 / 普通卡片)
- 如果是"测试模板"或"我想看看效果",必须覆盖:封面、收尾、至少 1 个对比/时间线(S08/S11/S02)、至少 1 个结构图(S14/S17/S15)、至少 1 个图片版式(S22 或 S15/S16 图片格)
- 如果材料包含跨类别多系列数据或连续时间序列,必须在规划阶段显式比较 S23/S24 与现有 S06/S07/P02 的适配性；散点、热力、瀑布、箱线、桑基、网络或层级数据还必须评估 XREAL ECharts Component，不能继续把所有数据压成 KPI 卡片
- 图片页不等于新发明一页。单图用 S22,多图用 S15/S16 的原始网格骨架改造
- 每页写代码前先列 `内部页序（不渲染）→ data-layout → 为什么选它 → 图片槽位`;生成后用 validator 检查

**动效原则(每页一个语义化 recipe)**
- 不是统一 fade-up,而是**与图形语义耦合**:数字 scale 弹入、bar scaleY 拉起、SVG 圆环 stroke-dashoffset 描线、时间线节点序列点亮
- 缓动:`EASE_PROD` `cubic-bezier(.2,0,.38,.9)` 用于 productive(120-240ms)、`EASE_ENTRY` `cubic-bezier(0,0,.3,1)` 用于 expressive(400-700ms)
- playSlide 入口要 reveal 所有 `[data-anim]` 容器到 opacity:1,recipe 内再用 motion `{opacity:[0,1]}` 覆盖

---

## 视觉 + 代码双维审核(生成后必须做)

不要只看 HTML/CSS。XREAL Style 模板的还原度要同时从**浏览器视觉**和**代码结构**判断:

1. 同时打开两份页面:当前 `template-xreal.html`(golden source 快照)和正在修改的测试 PPT;有条件时再加一份此前验收过的成品 deck 作对照。
2. 截图前先等入场动效稳定(约 1-2 秒)。不要把动画中间态误判成"内容缺失"或"版式空白"。
3. 先看视觉:标题重量、头部距离、图片落位、底部安全区、caption 是否被 nav 挡住。
4. 对照原始参考 PPT 的同类版式,不要只对照 CSS helper;以实际页面结构和视觉结果为准。
5. 再回到代码,检查该页是否误用了不属于该版式的组件,例如把 P24 的三图证据墙塞进 P23,或把 P7 图表用于没有真实数值的概念列表。
6. 若视觉不一致,优先判断是**版式选择错**、**必选组件缺失**、**可选组件滥用**还是**间距/安全区问题**,不要直接靠调 `margin` 硬救。
7. 修改模板时,新增能力必须用新类隔离;不要因为一页出问题去改全局基座类。

### 原始 PPT 视觉锚点(对照时优先看这些)

| 视觉锚点 | 原始 PPT 的实际做法 | 生成时的规则 |
|---|---|---|
| 大标题重量 | 纯英文标题 500，中文或中英混排标题 600，正文 400，标签 500 | 同一内容角色在整套 PPT 中保持固定字重 |
| 留白 | 页面经常只占上半屏或中部,底部留给 nav 和少量 footnote | 不要为了"填满"而把内容推到底 |
| 分割线 | 只在章节边界、证据墙、卡片层级处使用 1px hairline | 不要给每个内容块都加线 |
| 描述性小标题 | 使用品牌主字体 500、自然大小写和标准字距 | 不使用全大写或夸张 tracking 制造“科技感” |
| 列表 bullet | 使用实心圆点 | 不使用短横线代替 bullet |
| Logo 邻接文字 | 默认无;确有导航价值时字高匹配 Logo | 不把 deck 名、风格名接在 Logo 后 |
| 正文页页眉品牌区 | Logo `max(60px,5.2vw)`；IBM Plex Sans SC 使用 `.26`，XREAL Diatype 使用 `.313`，并垂直居中 | 不共用单一比例，不与页面标题争抢层级 |
| 封面/封底品牌区 | Logo `max(72px,6.8vw)`；文字继续使用对应字体的 `.26` / `.313` 光学比例 | 不复制正文页 Logo 尺寸 |
| 底部导航 | 亮底 `.08/.18`，暗底 `.10/.22`；当前点仅加宽并略提高透明度 | 不使用实色 `var(--accent)` 或高对比黑白 |
| 标题与内容 | 标题区和正文/图表之间有明显空气感 | 复杂页用 grid `gap`,不要让内容贴着标题 |
| Timeline | 轴线在中下部,但 label 不碰底部 nav | 横向 timeline 必须同时检查上下 label 和 nav 安全区 |
| 图片页 | 图片是证据块,要么做 S22 主视觉,要么放进 S15/S16 原始网格 | 不要使用未登记图文结构 |

### 组件必选 / 可选 / 可省略

| 组件 | 规则 |
|---|---|
| `.canvas-card` / `.chrome-min` | 基础页必选;split 页左右 half 各自有 chrome-min |
| `t-meta` / `t-cat` kicker | head 区必选,但正文卡片内可省略;必须在大标题上方 |
| 大标题 | 章节/论点页必选;列表型小卡页可以用较小标题,但不能缺页级信息锚点 |
| `lead` 说明 | 可选;如果标题已经解释清楚,可以省略,但不能用长段正文贴着标题 |
| 图片 caption | S15/S16 多图格必选;S22 大图可选,因为图已经是主视觉且下方有 KPI/说明 |
| 发丝线 / border-bottom | 可选;只能用于建立层级,不能为了装饰堆线 |
| KPI / 数字 | 只在有真实数据时使用;不要为概念解释编造数值 |
| 图表单位 / 坐标 / 来源 | S23/S24 必选；SVG 只画几何，所有标签和来源使用 HTML |
| `footnote` / 底部说明 | 可选;如果使用,必须避开 nav 安全区 |
| `S08 + XREAL Map Component` | 地点/路线/人物住所关系专用;右侧地图必须有点、连线、卡片和 `+` / `-` / `Drag` 控制,详见 `swiss-map-component.md` |

### 通用版式 / 非通用版式

| 类型 | 版式 | 使用边界 |
|---|---|---|
| 通用 | S01, S03, S08, S10, S11, S19 | 大多数叙事 deck 都能用,但仍要满足内容形状 |
| 条件通用 | S04, S13, S16 | 取决于数量是否刚好匹配:3/6 项 |
| 数据专用 | S02, S06, S07, S18, S20, S21, S22, S23, S24 | 必须有真实时间、数值、指标或案例数据；S24 还必须有连续横轴 |
| 结构专用 | S05, S14, S15, S17 | 必须有三层、闭环、矩阵、层级/生态关系;不适合普通段落 |

---

## 23 个登记版式

### P1 · Cover · 封面页

**用途**:整套 deck 起手 / 主题宣言。
**适用内容类型**:整套封面 / deck 级主题宣言。**纯文字结构**(主标题 + 副标 + 元信息),不承载数据。内部章节标题页使用下方登记的 `section-hero` 次级变体。

**默认推荐:纯黑色满屏** ⭐
- `<section class="slide accent">` 满屏黑色,**不是** light 白底
- 黑色区域保持纯黑,不插入 ASCII、点阵、纹理或动态背景
- 主标题反白使用 `var(--weight-display)`,微强调字用同字重斜体,不额外使用红色
- 页面不显示页码，也不要再放编号大字"01"
- Logo 默认独立,右侧不要附加 deck 名或风格说明;如确有导航文字相邻,文字标准字距且视觉字高与 Logo 一致
- 删除无信息价值的右下角角标和底部分割线
- 与 P9 Closing 的极简纯黑封底形成"主题开场 ↔ 品牌落款"结构闭环

**关键类**:`.slide.accent` + `.xreal-cover-title`
**动效 recipe**:`hero` — 纯黑底保持静止,文字 fade-up 序列入场

**示例代码(XREAL 黑色默认变体)**:
```html
<section class="slide accent" data-layout="XREAL-COVER-BLACK" data-animate="hero">
  <div class="canvas-card">
    <div class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"></div>
      <div class="r">SS · 26.05.10</div>
    </div>
    <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr auto;gap:2.6vh">
      <div data-anim="kicker" class="t-meta" style="color:rgba(255,255,255,.78)">[必填] 章节英文 / Section title</div>
      <h1 data-anim="title" class="xreal-cover-title" style="align-self:center;color:#fff">[必填] 中文主标题<br/>(可在某字加 <span style="font-style:italic;font-weight:inherit">italic</span> 微强调)</h1>
      <div data-anim="bottom" style="display:grid;grid-template-rows:auto auto;gap:1.6vh">
        <div data-anim="lead" class="lead" style="max-width:52ch;color:rgba(255,255,255,.86);font-weight:400">[必填] 一段 1-2 行的副标 / 引子,定调全场.</div>
        <div style="display:flex;justify-content:space-between;align-items:end">
          <div class="t-meta" style="color:rgba(255,255,255,.6)">[选填] 作者 · 日期 · 出处</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**经典变体(左 ink + 右 paper 对开)** — 仅当全黑不合内容调性时使用:
```html
<section class="slide" data-animate="cover-reveal">
  <div class="canvas-card cover-split">
    <div class="cover-ink">
      <span class="t-cat">Volume 18 · 2026</span>
      <h1 class="h-hero">Thin Harness,<br>Fat Skills.</h1>
      <span class="t-meta">— Kevin · 2026-05</span>
    </div>
    <div class="cover-paper">
      <p class="lead">薄型承载层,厚重技能。</p>
      <ul class="meta-list">
        <li>NN pages</li><li>XREAL · Monochrome</li><li>MP-75</li>
      </ul>
    </div>
  </div>
</section>
```

#### 登记变体 · Section Hero · 章节标题页

用于 deck 内部章节切换。它是一张单标题 Hero 停顿页,不是缩小版目录；视觉层级必须低于 Index Cover,但明显高于普通正文页。

- 仍写 `data-layout="S01"`,并增加 `data-variant="section-hero"`。
- 可使用 `hero light`、浅灰纯色或 `hero dark`,禁止 `slide accent` 满屏纯黑。
- 标题使用 `.xreal-section-title`,禁止 `.xreal-cover-title`。
- 只保留小型章节标识、1 个章节主标题、1 句引导语和可选范围提示。
- 禁止巨大章节编号、目录列表、三行 `cover-row`、deck 级作者/日期、KPI、图表或大图。

```html
<section class="slide hero light section-hero" data-layout="S01" data-variant="section-hero" data-animate="section-hero">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"></div>
      <div class="r">Section</div>
    </header>
    <div class="section-hero-body">
      <div data-anim="section-kicker" class="section-hero-kicker">Part 02 · Architecture</div>
      <h2 data-anim="section-title" class="xreal-section-title">[必填] 章节标题</h2>
      <p data-anim="section-summary" class="section-hero-summary">[必填] 用一句话提出本章要回答的问题。</p>
    </div>
    <div data-anim="section-foot" class="section-hero-foot">
      <span class="t-meta">[选填] 章节范围</span>
      <span class="t-meta">Next · [下一议题]</span>
    </div>
  </div>
</section>
```

---

### P2 · Vertical Timeline · 纵向时间轴

**用途**:演化对比、年代变迁、版本迭代(2-5 个时间节点)。
**适用内容类型**:**带量化数据的时间演化**。每节点必须有「年份 + 量化数值(如 1× / 4× 倍数 / 单位数字)+ 描述」三件套。如果只有节点名没有数据,改用 P11 横向时间线。
**骨架**:左侧 axis 列 12px 圆点 + 1px 虚线轴 / 右侧节点信息(年份 + 大字数据 + 小标 + 描述)。
**关键类**:`.timeline-v` `.tl-node` `.tl-axis`(12px 固定列宽,绝对定位 dot 防错位) `.kpi-row-4`
**动效 recipe**:`timeline-vertical` — 节点按时间顺序由上到下点亮(dot 先 pop 再扩 → 文字横向滑入)
**网格规则**:axis 列 = 12px 固定;dot 用 `position:absolute;left:50%;transform:translateX(-50%)` 与虚线对齐
**示例代码**:
```html
<section class="slide" data-animate="timeline-vertical">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>[必填] Deck 标题 · Timeline</span></div>
      <div class="r">02 / NN</div>
    </header>
    <div class="timeline-v">
      <div class="tl-node">
        <div class="tl-axis"><span class="dot"></span></div>
        <div class="tl-body">
          <span class="yr">2023</span>
          <span class="multi">1<small>×</small></span>
          <p class="desc">Prompt Engineering Era</p>
        </div>
      </div>
      <!-- 重复 N 个 tl-node,axis 列贯穿 -->
    </div>
  </div>
</section>
```

---

### P3 · Statement · 极简陈述

**用途**:中心论点、章节起始、口号。一页只放一句话 + 简单装饰。
**适用内容类型**:**纯定性论断 / 口号 / 章节切换**。一句话压缩到 8-12 词,**不承载任何数据或列表**。如果需要数据支撑,改用 P18 Why Now;如果是封面,用 P1。
**骨架**:左 1/3 空白 + 中段巨字陈述(8-10vw, `var(--weight-display)`) + 右下小字注脚 + 底部 hairline。
**关键类**:`.h-statement`(9.6vw,letter-spacing:-.05em) `.stmt-anchor`
**动效 recipe**:`statement-rise` — 大字按词序错峰升起(每词延迟 180ms)+ 注脚 fade in
**示例代码**:
```html
<section class="slide" data-animate="statement-rise">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>[必填] Deck 标题 · Statement</span></div>
      <div class="r">03 / NN</div>
    </header>
    <h1 class="h-statement">
      <span>Build it</span> <span>once.</span><br>
      <span>It runs</span> <span>forever.</span>
    </h1>
    <span class="stmt-anchor">— Statement 03</span>
  </div>
</section>
```

---

### P4 · Six Cells · 六格定义

**用途**:6 个并列概念定义、6 项功能并列。
**适用内容类型**:**6 个对等概念 / 功能列举**(数量必须 = 6,过少用 P5,过多用 P15/P16)。每格仅承载「图标 + 编号 + 短标题 + 一行描述」,**不承载需要展开的数据 / 段落**。
**骨架**:2×3 网格 / 6 张彼此留有 gap 的独立卡片 / 每格上方 Material Symbols Outlined 图标 + 编号 + 短标题 + 一行描述。
**关键类**:`.sub-grid-3-2` `.sub-card` `.nb-corner`
**动效 recipe**:`six-cells` — 6 格按 z 形顺序点亮(L→R, T→B,每格延迟 90ms)
**圆角规则**:6 张 `.sub-card` 统一使用 `border-radius:var(--radius-sm)`（3px）；外层网格、分割轴和页面画布不加圆角。**不要自己画 SVG 图标**,用 Google Material Symbols Outlined，例如 `<span class="material-symbols-outlined">bookmark</span>`。
**示例代码**:
```html
<div class="sub-grid-3-2">
  <article class="sub-card">
    <span class="material-symbols-outlined">stacks</span>
    <span class="nb-corner">01</span>
    <h4 class="ttl">Skill File</h4>
    <p class="desc">纯 markdown,可手写、可重写</p>
  </article>
  <!-- 5 more -->
</div>
```

---

### P5 · Three Layers · 三层结构

**用途**:三层架构、三个递进层级、三段边界清晰的系统分层。
**适用内容类型**:**正好 3 层的层级结构**。每层承载编号、图标、标题、简短描述和可选标签；若是三个无层级的平行观点，改用 P13 Three Forces。
**骨架**:顶部左对齐标题 / 下方 `.stack-row` 三个等宽 `.stack-block` 色块。
**关键类**:`.stack-row` `.stack-block` `.layer-nb` `.layer-ttl` `.layer-desc`
**动效 recipe**:`stack-build` — 三层按 01→03 依次建立。
**圆角规则**:3 个 `.stack-block` 统一使用 `border-radius:var(--radius-sm)`（3px）；层间保持明确 gap，不拼成大圆角容器。
**示例代码**:
```html
<div class="stack-row">
  <article class="stack-block b-grey">
    <span class="layer-nb">01</span>
    <h4 class="layer-ttl">Outer layer</h4>
    <p class="layer-desc">...</p>
  </article>
  <article class="stack-block b-ink">...</article>
  <article class="stack-block b-accent">...</article>
</div>
```

---

### P6 · KPI Tower · 不等高柱状 KPI

**用途**:4 项数据用视觉高度表达层级差异。
**适用内容类型**:**4 项可比量化数据**(必须有真实数值,bar 高度由数据决定)。典型如:成本、容量、计数、效率指标。**禁止**用于无数据的概念列举(那是 P4/P5 的事)。
**骨架**:4 列均分,每列底部一根不同高度的黑色矩形(数据决定高度)+ 顶部图标 + 中段巨数 + 底部标签。
**关键类**:`.bar-towers` `.bar-tower` `.cap` `.body-block`
**动效 recipe**:`tower-grow` — 标签先入 → 数字 scale 弹入 → tower scaleY 从 0 拉起(transform-origin:bottom)
**圆角与基线规则**:每列 `.cap` 使用四角 `border-radius:var(--radius-sm)`（3px）；`.body-block` 只保留 3px 顶部圆角，底部两角为直角并与四列共同 x 轴齐平。四列高度可以不同，但不得出现四角圆角矩形贴在轴线上，也不得在柱体与轴之间留空。
**示例代码**:
```html
<div class="bar-towers">
  <div class="bar-tower">
    <div class="cap"><span class="material-symbols-outlined">layers</span></div>
    <div class="body-block h-4 b-accent"><span class="lbl">Skills</span><span class="nb">90K</span></div>
  </div>
  <!-- 3 more,使用 h-1 / h-2 / h-3 -->
</div>
```

---

### P7 · H-Bar Chart · 横向条形图

**用途**:多项排名比较 / 占比对比(5-10 项)。
**适用内容类型**:**5-10 项可比量化数据**(必须有真实百分比 / 评分 / 数值,bar 宽度由数据决定)。典型如:benchmark 排名、市场份额、问卷占比。⚠️ **严禁用于无量化数据的概念列举**(那是 P4/P5/P15)— 编造数字会被识破。
**骨架**:顶部大标题 / 中段空 / 下半部条形列表(每行:文字标签 + 灰色 track + 数据 fill + 末端数字)。
**关键类**:`.h-bar-chart` `.row-lbl` `.row-track` `.row-fill` `.row-val`
**动效 recipe**:`hbar-grow` — 大标题先入 → 每行依序 width 0→target(transform-origin:left)+ 末端数字 count-up
**圆角规则**:`.row-track` 与 `.row-fill` 统一使用 `border-radius:var(--radius-sm)`（3px）；圆角不得等于条高的一半，禁止胶囊化。
**示例代码**:
```html
<div class="h-bar-chart">
  <span class="row-lbl">Anthropic Advisor</span>
  <span class="row-track"><span class="row-fill" style="width:84%"></span></span>
  <span class="row-val">84</span>
  <!-- N more -->
</div>
```

---

### P8 · Duo Compare · 双轨对照

**用途**:Before/After、A vs B、旧/新对比。
**适用内容类型**:**二元对照**(必须正好 2 项)。两侧结构同质(t-cat 标签 + 大字标题 + 段落 / 列表说明)。典型如:旧/新工作流、传统/AI、客户视角/团队视角。
**骨架**:左右两半屏中间一根纵向 1px 长线分隔 / 各自顶部 t-cat + 大字标题 + 下方说明。
**组件规则**:描述性小标题使用标准字距;列表使用实心圆点,不用短横线。
**关键类**:`.duo-compare` `.duo-half` `.vrule`(scaleY 拉开)
**动效 recipe**:`duo-mirror` — 中线 vrule 先 scaleY 0→1 → 左右各自标题、文字镜像入场
**示例代码**:
```html
<div class="duo-compare">
  <div class="duo-half">
    <span class="t-cat">Before</span>
    <h2>交给模型</h2>
  </div>
  <span class="vrule"></span>
  <div class="duo-half">
    <span class="t-cat">After</span>
    <h2>交给代码</h2>
  </div>
</div>
```

---

### P9 · Brand Back Cover · 品牌封底

**用途**:整套 deck 收尾页。
**适用内容类型**:**deck 封底**(每个 deck 只有一页，且必须是最后一页)。所有结论、行动建议和联系方式应在前一页完成；封底只承担品牌落款。

**固定结构:纯黑全屏 + 大号 Thanks + 底部小号 XREAL Logo** ⭐
- 使用 `<section class="slide accent">` 与 `data-layout="XREAL-CLOSING-BLACK"`
- 全屏背景固定 `#000000`，自然大小写 `Thanks` 以显示级字号居中，反白官方 XREAL Logo 缩小后固定在底部中央
- 不放 takeaway、宣言、作者日期、页码、联系方式、CTA、眉题、角标或装饰线
- `Thanks` 是唯一主视觉，Logo 只作为底部品牌落款；不得替换成产品字标或重绘 Logo

**关键类**:`.slide.accent` `.xreal-closing-lockup` `.xreal-closing-thanks` `.xreal-closing-mark` `.xreal-closing-logo`
**动效 recipe**:`closing-thanks` — `Thanks` 先上浮落定 → 底部 Logo 轻微出现

**示例代码**:
```html
<section class="slide accent" data-layout="XREAL-CLOSING-BLACK" data-animate="closing-thanks">
  <div class="canvas-card">
    <div class="xreal-closing-lockup">
      <div data-anim="closing-thanks" class="xreal-closing-thanks">Thanks</div>
      <div class="xreal-closing-mark">
        <img data-anim="closing-logo" class="xreal-closing-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL">
      </div>
    </div>
  </div>
</section>
```

---

### P11 · Horizontal Timeline · 横向时间线

**用途**:多步骤流程(4-7 步)、时间演进。
**适用内容类型**:**4-7 步线性流程**(每步只有一个名称,不需要展开数据 / 描述)。如果每步要展开,改用 P5;如果有量化数据,改用 P2。**禁止**用于循环结构(那是 P14)。
**骨架**:顶部大标题 / 中段一根 1px hairline 横线 + N 个均布节点(8×8 直角方块 + 上方 mono 编号 + 下方步骤名)。
**组件规则**:节点名称使用 600 字重,节点说明使用 400 字重。
**关键类**:`.timeline-h` `.tl-h-node` `.tl-h-axis`
**动效 recipe**:`timeline-walk` — 节点沿轴左→右依次点亮(每节点 220ms)
**对齐注意**:横向时间线 label 的 CSS 依赖 `translateX(-50%)` 居中。动效里如果要做上下位移,必须写完整 `transform: translate(-50%, y)` 序列,不能只写 `y`,否则动画结束后 label 会偏离 dot。
**示例代码**:
```html
<div class="timeline-h">
  <span class="tl-h-axis"></span>
  <div class="tl-h-node">
    <span class="num">01</span>
    <span class="dot"></span>
    <span class="lbl">Investigate</span>
  </div>
  <!-- 4-6 more -->
</div>
```

---

### P12 · Manifesto + Ink Banner · 宣言 + 通栏 ink 条

**用途**:阶段性结论、章节封底、口号 + 视觉强收束。
**适用内容类型**:**章节性收束 / 阶段性宣言**(用于 deck 中段而非结尾,P9 是 deck 终结)。承载「主张 + 简短说明 + ink 通栏宣言」三段结构,无数据。
**骨架**:上半屏左侧 t-cat + 大字 4 行宣言 + 右侧短段说明 / 下半屏 ink 通栏(无左右下边距)+ 反白短句 + Material Symbols 图标矩阵。
**关键类**:`.manifesto-top` `.ink-banner-full`(`margin:0 -5vw -4.4vh` 取消父级 padding)
**动效 recipe**:`manifesto` — 大字三段错峰升起 → 底 ink 条横向 scaleX 0→1 铺开 → 反白文字 fade in
**注意**:Skill File 那段小字 **顶对齐于右侧大字基线**(`align-items:flex-start;padding-top:1.2vw`)

---

### P13 · Three Forces Cards · 三力卡片小报

**用途**:3 个对等概念展示(每个 = 巨数 + 标题 + 双列描述)。
**适用内容类型**:**3 个对等概念深化**(数量 = 3,比 P5 承载更多文字)。每卡内容比较丰富(巨编号 + 标题 + 双列段落描述)。01/02/03 为编号锚点而非真实数据。典型如:三大反驳、三种力量、三大主张。
**骨架**:左 5/16 ink hero 块(t-cat + 4 行标题,保持纯色)/ 右 11/16 三张水平卡堆叠。
**关键类**:`.three-forces` `.hero-ink-col` `.force-card`(`.card-fill`)`.force-num`(9.2vw 黑色结构字)
**动效 recipe**:`three-forces` — 左 hero 横移入 → 右 3 卡阶梯式从右滑入 → 巨大结构数字单独 pop
**圆角规则**:左侧 `.hero-ink-col` 与右侧 3 张 `.force-card` 都使用 `border-radius:var(--radius-sm)`（3px）。**3 张卡片必须统一样式**(都用 `.card-fill` 灰底,不要混用描边/黑底);若需突出一张,改用 `.card-accent`,**禁止**黑底+描边。

---

### P14 · Loop Diagram · 闭环流程图

**用途**:自学闭环、自动化流程(3-5 步循环)。
**适用内容类型**:**循环 / 闭环流程**(终点回到起点,3-5 步)。如自学循环、CI/CD、反馈闭环、agent loop。**线性流程禁用**(那是 P11)。
**骨架**:左 4 行编号步骤(顶对齐) / 右侧 SVG 同心圆环 / 中央巨字 LOOP / 节点统一灰底直角方块(不用圆点交替色)。
**关键类**:`.loop-diagram` `.loop-steps` `.loop-svg`
**动效 recipe**:`loop-form` — 左侧步骤纵向序列 → 右 SVG 圆环 stroke-dashoffset 描线 → 节点序列点亮
**注意**:左右**整体居中对齐**(顶部对齐 + 高度等同)

---

### P15 · Image Matrix + Hero Stat · 矩阵 + 大字底注

**用途**:大量同类项展示(8-12 项 skill / 团队成员 / 案例图标),底部一个总数据收束。
**适用内容类型**:**8-12 项同类型小项 + 一个汇总指标**。每项只承载短标题(无展开),底部巨数为「汇总值」(项目总数 / 总流量 / 总用户)。**项数过少改用 P4(6 项)**。
**骨架**:顶部标题(留 9vh 间距)/ 中段 4×3 矩阵卡(每卡 12vh 固定高度)/ 底部巨数 + 标签(margin-top:auto 推到底)。
**关键类**:`.matrix-fill`(grid-template-columns:repeat(4,1fr))`.matrix-cell`(`.card-fill` 灰底,**禁止描边**)`.hero-stat-bottom`
**动效 recipe**:`matrix-fill` — 12 格随机棋盘渐显(每格 random delay)→ 底部巨数 count-up
**注意**:卡片高度限定(避免大数字溢出);**所有卡用 `.card-fill` 灰底**,只突出强调项时单独换 `.card-accent`

---

### P16 · Multi-card Brief · 微卡小报

**用途**:6 项小卡并列(快讯、tip 集合、特性概览)。
**适用内容类型**:**6 项轻量短讯 / tip / 注脚**(数量 = 6,每项主文短 + 小字注脚)。比 P4 内容更碎,适合快讯类。**只允许一张黑色结构块突出**(单焦点法则)。
**骨架**:顶部大标题(留 9vh)/ 下方 3×2 微卡(每卡:左上主文 + 右下小字 + 中间留空)。
**关键类**:`.brief-grid` `.brief-card`(`.card-fill` 灰底)`.brief-card.is-accent`(单一黑底结构强调)
**动效 recipe**:`field-notes` — 6 卡按 z 形顺序点亮(L→R, T→B,90ms 错开)
**圆角规则**:6 张 `.brief-card` 统一使用 `border-radius:var(--radius-sm)`（3px）。卡内排版**左上主文 + 右下小字**,中间空出(避免内容散);**只允许一张黑色结构块**。

---

### P17 · System Diagram · 同心圆系统图

**用途**:层级架构(core→middle→outer)、生态地图。
**适用内容类型**:**严格三层嵌套关系**(core 内核 / middle 中间层 / outer 外圈)。典型如:技术栈层级、生态分层、影响力辐射。**非三层结构禁用**(扁平用 P4,层级不清用 P5)。
**骨架**:左半屏标题 + 三段说明 / 右半屏 SVG 三层同心圆 + 标签外引线。
**关键类**:`.system-diagram` `.sys-svg` `.sys-label`
**动效 recipe**:`system-diagram` — 同心圆从外向内 scale 入 → 标签序列出现

---

### P18 · Why Now · 三列递进 + 巨数

**用途**:三论点 + 各自支撑数据(为什么是现在)。
**适用内容类型**:**3 个论点 + 每个论点对应一个量化数据**。每论点结构 = t-cat 标签 + 一句标题 + 段落 + 一个底部巨数(可以是百分比/年份/倍数)。最后一列用 XREAL 红色强调表示「重点支撑论据」。
**骨架**:顶部大标题 / 中段 3 列(每列:t-cat + 标题 + 描述)/ 列底各一个 8.4vw 巨数(01 / 02 / 03,最后一列红色强调)。
**关键类**:`.why-now-grid` `.why-col` `.why-num-bottom`(8.4vw, `var(--weight-emphasis)`)
**动效 recipe**:`why-now` — 三列垂直递进 → 底部巨数 count-up
**注意**:巨数字号统一,只用颜色(`var(--brand-red)`)突出最后一列,**不要**用粗体

**登记扩展: XREAL Pie Component**
- 当内容是 2-5 个互斥类别且总和为 100% 时，可在 S18 骨架中用 `.xreal-pie-layout` 替换三列论点区。
- SVG 只画扇形，不写 `<text>`；右侧 `.xreal-pie-legend` 使用 HTML 分类名与数值。
- 仅一个关键扇区使用 `var(--brand-red)`，其余使用 ink / grey / silver；禁止渐变。

---

### P19 · Four Cards · 四列均分卡

**用途**:4 项功能/特性并列(等权重)。
**适用内容类型**:**4 项等权特性 / 模块**(数量 = 4,结构完全同质)。每项 = t-meta 编号 + 大字标题 + 一段描述。无数据维度,纯定性。比 P5(三步)更平均,比 P6(数据高度)更纯文字。
**骨架**:顶部 80px 黑色短发丝顶线 + 大字双行标题 / 下方 4 列均分卡(每卡:t-meta 顶部 "— 01 / SLASH" + 大字标题 + 段落描述)。
**关键类**:`.four-cards` `.fc-col`
**动效 recipe**:`four-cards` — 顶部黑线 width 0→100% → 4 列从下向上推入(每列 110ms 错开)
**注意**:装饰节点统一使用 8×8 方块或 `.t-meta` 文字，不使用 9px 圆点

**登记扩展: XREAL Bento Component**
- 需要“一个主叙事 + 两项指标 + 一条行动说明”的摘要时，可在 S19 中使用 `.xreal-bento`。
- 使用 12 列非对称布局：主块 6 列 × 2 行，指标块 3 列，行动块 6 列。
- 区块统一使用 `--radius-sm:3px`、1px 间隙、无阴影，不模拟大圆角软件卡片或胶囊按钮。
- 黑白灰承担结构；全页只允许一个红色关键数字。

---

### P20 · Stacked KPI Ledger · 纵向账单 KPI

**用途**:4-6 行核心数据账单式展示(每行=数字+标签+图标)。
**适用内容类型**:**4-6 项核心数据账单**(每行必须有真实数值 + 标签 + 图标)。垂直 ledger 形式适合财务数据、KPI 仪表板、关键指标列表。比 P6 KPI Tower 容纳数据更多但视觉化弱(无 bar 高度对比)。
**骨架**:每行一道 hairline 分隔 / 左侧巨数(限高 `min(13vw,16vh)` 防溢出) / 中部标签 / 右侧 Material Symbols 图标。
**关键类**:`.stacked-ledger` `.ledger-row`(border-bottom:1px solid var(--border-subtle))`.ledger-num`
**动效 recipe**:`stacked-ledger` — 每行数字升起 → 标签左滑 → 图标 pop(每行 180ms 错开)
**注意**:**字号必须限高**(`font-size:min(13vw, 16vh)`),否则在标准 16:9 屏底部行会被挤出

---

### P21 · Tech Spec Sheet · 规格说明书

**用途**:产品规格、benchmark 数据、性能基线展示(多 KPI + 视觉化竖线装饰)。
**适用内容类型**:**产品规格 / benchmark / 性能基线**(必须有真实多维数据,3 KPI + 9 根竖线 = 12+ 数据点)。典型如:模型评分、API 性能、压测结果。是 deck 中数据密度最高的版式。
**骨架**:左 4 行大标题 / 中部 3 KPI(顶部 hairline + 数字 + 单位)/ 右下 9 根高低不一的垂直竖线 / 底部巨数 + Yearly goal + 三 tag；不显示页码。
**关键类**:`.tech-spec` `.spec-title-col` `.spec-kpi-grid` `.spec-bars`(`.bar-vert`,scaleY 弹起,transform-origin:bottom)
**动效 recipe**:`tech-spec` — hero 区淡入 → 标题入 → KPI 顶线一根根画出 → 底巨数 pop → 竖线从底部 scaleY 弹起(50ms 错开)
**注意**:右下 bars 矩阵必须**底对齐**且**不超出右边距**

---

### P22 · Image Hero · 图文混排封面

**用途**:案例展示、产品图 + 数据落地、章节封面带图。
**适用内容类型**:**案例展示 / 产品发布 / 章节带图封面**(必须有真实图片资源 + 3 个核心数据)。典型如:产品截图 + 关键指标、案例图 + ROI、用户反馈图 + 复购率。**没有真实图源时禁用**(占位灰图破坏视觉)。
**骨架**:上半屏 60% 全幅图片 + 左上白底标题块叠加(top:11vh,留出充分缓冲)/ 下半屏 40% 长说明 + 三列 KPI($ / 127× / 100%)。
**关键类**:`.image-hero` `.hero-img-wrap`(60vh)`.hero-overlay-block` `.hero-stats`
**动效 recipe**:`image-hero` — 图缓慢 zoom-out(scale 1.05→1)→ 白块 scaleX 0→1 推开 → 三 KPI 顶线依序画出
**注意**:
- 图片优先从 `assets/media/` 选择并复制为 `images/{页号}-{语义}.{ext}` 本地文件,不要使用外链图库
- 图片下方内容不要贴着图下沿,使用 `.image-hero-body` 统一给下半屏增加顶部缓冲
- 三列 KPI 大字号要限高(`min(4.6vw, 7.6vh)`),小字用 `margin-top:auto` 锚定列底,防止溢到 nav 圆点
- 列高度统一(grid 不要 `align-items:start`,让列拉伸到同一高度)

**示例代码**:
```html
<section class="slide light" data-animate="image-hero">
  <div class="canvas-card" style="padding:0;display:flex;flex-direction:column;overflow:hidden">
    <div data-anim="img" style="position:relative;flex:0 0 60%;overflow:hidden;background:var(--grey-1)">
      <img src="images/22-product-scene.png" alt="[必填] 图片说明" loading="eager"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%">
      <div class="chrome-min" style="position:absolute;top:0;left:0;right:0;color:rgba(255,255,255,.9);padding:5.6vh 5vw 0">
        <div class="l brand"><img class="xreal-logo logo-inverse" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>Section · Case / Visual Evidence</span></div>
        <div class="r">22 / NN</div>
      </div>
      <div data-anim="title-block" style="position:absolute;left:5vw;top:11vh;background:var(--paper);padding:3.2vh 3.2vw;max-width:40vw">
        <div style="font-family:var(--sans),var(--sans-zh);font-weight:var(--weight-title);font-size:min(5.2vw,9vh);line-height:1;letter-spacing:-.035em;color:var(--text-primary)">
          [必填] Image<br>Evidence
        </div>
      </div>
    </div>
    <div data-anim="kpi" class="image-hero-body">
      <div style="max-width:48ch;font-family:var(--sans),var(--sans-zh);font-size:max(15px,1.3vw);line-height:1.55;font-weight:400;color:var(--text-primary);letter-spacing:-.005em">
        [必填] 1-2 行解释这张图为什么重要,不要重复标题.
      </div>
      <div class="image-hero-stats" style="gap:4vw">
        <div style="display:flex;flex-direction:column;gap:.6vh"><div style="height:1px;background:var(--ink)"></div><div class="t-meta">Metric 01</div><div style="font-family:var(--sans);font-weight:var(--weight-emphasis);font-size:min(4.6vw,7.6vh);line-height:.95;letter-spacing:-.04em">12×</div><div style="height:1px;background:var(--border-subtle);margin-top:auto"></div><p class="body-sm">[必填] 指标解释</p></div>
        <div style="display:flex;flex-direction:column;gap:.6vh"><div style="height:1px;background:var(--ink)"></div><div class="t-meta">Metric 02</div><div style="font-family:var(--sans);font-weight:var(--weight-emphasis);font-size:min(4.6vw,7.6vh);line-height:.95;letter-spacing:-.04em">3.4h</div><div style="height:1px;background:var(--border-subtle);margin-top:auto"></div><p class="body-sm">[必填] 指标解释</p></div>
        <div style="display:flex;flex-direction:column;gap:.6vh"><div style="height:1px;background:var(--ink)"></div><div class="t-meta">Metric 03</div><div style="font-family:var(--sans);font-weight:700;font-size:min(4.6vw,7.6vh);line-height:.95;letter-spacing:-.04em;color:var(--brand-red)">100%</div><div style="height:1px;background:var(--border-subtle);margin-top:auto"></div><p class="body-sm">[必填] 指标解释</p></div>
      </div>
    </div>
  </div>
</section>
```

---

### P23 · Data Chart · 分组数据图表

**用途**:跨类别比较 2-4 个同量纲数据系列。
**适用内容类型**:**3-8 个类别 × 2-4 个系列的真实数值**。典型如区域 × 产品、季度 × 渠道、方案 × 指标。只有一个系列且重点是排名时优先使用 P7 Horizontal Bar；指标量纲不一致时拆成小多图,不得强行共用纵轴。
**骨架**:顶部左对齐结论标题 / 单位与紧凑图例 / 占主导面积的分组柱图 / HTML 横纵轴标签 / 底部来源与一句洞察。
**关键类**:`.xreal-data-chart` `.chart-legend` `.chart-stage` `.chart-y-labels` `.chart-plot` `.chart-groups` `.chart-group` `.chart-bar` `.chart-x-labels` `.chart-source`
**动效 recipe**:`chart-rise` — 坐标结构先入 → 各类别柱从共同零基线生长 → 值、图例和来源落定。
**注意**:
- 柱高必须由 `data-value` 与 `--value` 对应真实数值；共同零基线不可截断。
- 每个柱提供可见值或明确的 HTML 终值标签；纵轴单位与来源必填。
- 最多 4 个系列，黑/深灰/浅灰承担常规系列，只允许一个关键系列使用 XREAL 红色。
- 网格线保持 1px 中性 hairline；禁止渐变、3D、阴影、图标柱和装饰性多色。

```html
<section class="slide light" data-layout="S23" data-animate="chart-rise">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>Section · Analysis</span></div>
      <div class="r">Data comparison</div>
    </header>

    <div data-anim="line">
      <div class="t-cat">[必填] 结论标签</div>
      <h2 class="xreal-page-title">[必填] 用一句结论说明比较结果</h2>
    </div>

    <div data-anim="chart" class="xreal-data-chart" data-chart-unit="%" aria-label="[必填] 图表摘要">
      <div class="chart-meta-row">
        <span class="chart-unit">Unit · %</span>
        <div class="chart-legend" aria-label="数据系列">
          <span class="chart-legend-item"><i class="chart-swatch series-1"></i>Current</span>
          <span class="chart-legend-item"><i class="chart-swatch series-2"></i>Prior</span>
        </div>
      </div>

      <div class="chart-stage">
        <div class="chart-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
        <div class="chart-plot">
          <div class="chart-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="chart-groups" style="--groups:4;--series-count:2">
            <div class="chart-group">
              <div data-anim="chart-bar" class="chart-bar series-1" data-value="72" style="--value:72" aria-label="North, Current, 72"><span class="chart-value">72</span></div>
              <div data-anim="chart-bar" class="chart-bar series-2" data-value="58" style="--value:58" aria-label="North, Prior, 58"><span class="chart-value">58</span></div>
            </div>
            <div class="chart-group">
              <div data-anim="chart-bar" class="chart-bar series-1" data-value="84" style="--value:84" aria-label="East, Current, 84"><span class="chart-value">84</span></div>
              <div data-anim="chart-bar" class="chart-bar series-2" data-value="66" style="--value:66" aria-label="East, Prior, 66"><span class="chart-value">66</span></div>
            </div>
            <div class="chart-group">
              <div data-anim="chart-bar" class="chart-bar series-1 critical" data-value="91" style="--value:91" aria-label="South, Current, 91"><span class="chart-value">91</span></div>
              <div data-anim="chart-bar" class="chart-bar series-2" data-value="73" style="--value:73" aria-label="South, Prior, 73"><span class="chart-value">73</span></div>
            </div>
            <div class="chart-group">
              <div data-anim="chart-bar" class="chart-bar series-1" data-value="63" style="--value:63" aria-label="West, Current, 63"><span class="chart-value">63</span></div>
              <div data-anim="chart-bar" class="chart-bar series-2" data-value="54" style="--value:54" aria-label="West, Prior, 54"><span class="chart-value">54</span></div>
            </div>
          </div>
        </div>
        <div class="chart-x-labels" style="--groups:4"><span>North</span><span>East</span><span>South</span><span>West</span></div>
      </div>

      <div class="chart-foot"><span class="chart-source">Source · [必填] 数据来源与日期</span><span class="chart-note">[选填] 一句洞察</span></div>
    </div>
  </div>
</section>
```

---

### P24 · Line Chart · 趋势折线图

**用途**:展示时间或其他连续变量上的趋势、拐点与系列差距。
**适用内容类型**:**1-3 个系列 × 4-12 个连续采样点**。典型如月度增长、季度留存、温度/距离/频率变化。横轴只是无顺序类别时禁止使用折线图,应改用 P23 或 P7。
**骨架**:顶部左对齐结论标题 / 单位与紧凑图例 / 占主导面积的折线图 / HTML 横纵轴标签与终值 / 底部来源和关键拐点说明。
**关键类**:`.xreal-line-chart` `.chart-legend` `.line-stage` `.chart-y-labels` `.line-plot` `.line-chart-svg` `.chart-line` `.chart-point` `.line-x-labels` `.line-end-label` `.chart-source`
**动效 recipe**:`line-draw` — 坐标结构先入 → 1-3 条线依次绘制 → 数据点与终值标签落定。
**注意**:
- SVG 只承载线、点和数据几何，不写 `<text>`；坐标与标注均用 HTML。
- 不使用无说明的双轴；不同量纲默认拆页或使用共享尺度的小多图。
- 折线不做面积渐变，不使用平滑曲线掩盖真实采样点；关键拐点可用一个红色点或一条红色系列。
- 每条线必须可通过图例、线型/点型或直接终值标签识别，不能只依赖颜色。

```html
<section class="slide light" data-layout="S24" data-animate="line-draw">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>Section · Trend</span></div>
      <div class="r">Time series</div>
    </header>

    <div data-anim="line">
      <div class="t-cat">[必填] 趋势结论</div>
      <h2 class="xreal-page-title">[必填] 用一句结论指出趋势或拐点</h2>
    </div>

    <div data-anim="chart" class="xreal-line-chart" data-chart-unit="Index" aria-label="[必填] 折线图摘要">
      <div class="chart-meta-row">
        <span class="chart-unit">Unit · Index</span>
        <div class="chart-legend" aria-label="数据系列">
          <span class="chart-legend-item"><i class="chart-swatch series-1"></i>Core</span>
          <span class="chart-legend-item"><i class="chart-swatch series-2"></i>Reference</span>
        </div>
      </div>

      <div class="line-stage">
        <div class="chart-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
        <div class="line-plot">
          <div class="chart-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <svg class="line-chart-svg" data-svg-role="chart" viewBox="0 0 1000 400" preserveAspectRatio="none" role="img" aria-label="Core 与 Reference 从一月至五月的趋势">
            <title>Core and Reference trend</title>
            <desc>Core rises from 42 to 86, while Reference rises from 38 to 63.</desc>
            <path data-anim="chart-line" class="chart-line series-1" d="M0 300 L250 250 L500 210 L750 115 L1000 55"></path>
            <path data-anim="chart-line" class="chart-line series-2" d="M0 320 L250 285 L500 248 L750 210 L1000 175"></path>
            <g class="chart-points series-1">
              <circle class="chart-point series-1" cx="0" cy="300" r="5"></circle><circle class="chart-point series-1" cx="250" cy="250" r="5"></circle><circle class="chart-point series-1" cx="500" cy="210" r="5"></circle><circle class="chart-point series-1" cx="750" cy="115" r="5"></circle><circle class="chart-point series-1" cx="1000" cy="55" r="5"></circle>
            </g>
            <g class="chart-points series-2">
              <circle class="chart-point series-2" cx="0" cy="320" r="5"></circle><circle class="chart-point series-2" cx="250" cy="285" r="5"></circle><circle class="chart-point series-2" cx="500" cy="248" r="5"></circle><circle class="chart-point series-2" cx="750" cy="210" r="5"></circle><circle class="chart-point series-2" cx="1000" cy="175" r="5"></circle>
            </g>
          </svg>
          <span class="line-end-label series-1" style="--x:100;--y:14">86</span>
          <span class="line-end-label series-2" style="--x:100;--y:44">63</span>
        </div>
        <div class="line-x-labels" style="--points:5"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span></div>
      </div>

      <div class="chart-foot"><span class="chart-source">Source · [必填] 数据来源与日期</span><span class="chart-note">[选填] 关键拐点说明</span></div>
    </div>
  </div>
</section>
```

---

### XREAL ECharts Component · 复杂图表扩展

**用途**:在不增加正文版式编号的前提下，用 Apache ECharts 处理复杂数据几何、布局、动画和必要交互。

**版式映射**:
- S23:复杂比较、scatter/bubble、heatmap、waterfall、boxplot、candlestick。
- S24:复杂 line 或 bar + line mixed；不同单位仍默认拆图，不因 ECharts 自动获得双轴豁免。
- S17:sankey、graph、tree、treemap。
- S08:明确地理数据编码；地点关系和路线仍优先使用 XREAL Map Component。

**必须属性**:`data-chart-engine="echarts"`、登记的 `data-chart-kind`、`.xreal-echart[data-echarts-key]`、`data-renderer="svg|canvas"`。

**必须保留的 HTML 层**:结论标题、`.chart-unit`、`.chart-legend`、`.chart-source`。ECharts 内部 `title`、`legend`、`toolbox` 由运行时关闭，不能另起 dashboard UI。

**选型优先级**:
1. S23/S24 原生组件能清楚表达时，不启用 ECharts。
2. 需要复杂编码、自动布局、超过原生容量或现场探索时，才启用 ECharts。
3. 一页只保留一个主图；复杂图表上方不再堆 KPI 卡片、筛选器或 tab。

**视觉与交付**:只能使用模板内置 XREAL ECharts 主题和 series 白名单；默认 SVG、无 tooltip、无阴影/渐变/面积填充/3D。最终必须通过 `scripts/inline-echarts.mjs` 嵌入 ECharts 6.1.0，并运行 validator。完整代码与白名单见 `references/xreal-echarts.md`。

---

## 历史实验区(默认禁用)

下面的 E01/E02 是早期以旧 `data-layout="P23/P24"` 标识探索的图文混排实验。它们不属于当前正式登记集合,默认不要用于正式生成，也与正式 `S23/S24` 图表版式无关。除非用户明确说“我要实验新图文版式”,否则请使用 S22 或 S15/S16 的图片槽位。

### E01 · XREAL Image Split · 左文右图 / 右文左图(旧 P23,实验,默认禁用)

**用途**:解释一个观点时配一张纪实照片、信息图、UI 情景图或系统关系图。
**适用内容类型**:**一个核心论点 + 一张核心图片**。适合"左侧大标题 + 右侧图片证据"或"左图右说明"。如果图片是整页主角且需要 KPI,用 P22;如果是多张图片,用 P24。
**骨架**:`.canvas-card` 内 head 上下叠 / 主体 `.swiss-img-split` 两列(5:7 或 reverse 7:5) / 图片下方 `.swiss-img-caption`。
**关键类**:`.swiss-img-split` `.swiss-img-copy` `.frame-img.r-16x10.fit-contain|cover` `.swiss-img-caption`
**动效 recipe**:`grid-reveal` — head 先入,图片和文字块错峰出现
**注意**:
- 图片通常与正文首行对齐,不要与大标题顶端齐平;可在图片列加 `padding-top:1vh` 到 `3vh`
- 如果希望左侧内容块与右侧图片底部对齐,使用 `.swiss-img-split.align-image-bottom`,不要靠额外空行硬推
- `.align-image-bottom` 已内置底部 nav safe zone;不要再额外把图片或 caption 往页面底部推
- 左侧内容块避免无意义分割线;除非需要章节感,不要额外插入 `.rule`
- 信息图/UI 图必须 `.fit-contain`;纪实照片默认 cover
- 右图宽度大,标题不要超过 3 行,正文控制在 2-3 个短段或 3 条 bullet

```html
<section class="slide light" data-animate="grid-reveal">
  <div class="canvas-card">
    <div class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>Section · Visual Argument</span></div>
      <div class="r">23 / NN</div>
    </div>
    <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr;gap:5vh">
      <div data-anim="head" style="display:flex;flex-direction:column;gap:1.4vh">
        <div class="t-meta">Evidence · XREAL media</div>
        <h2 style="font-family:var(--sans),var(--sans-zh);font-weight:var(--weight-display);font-size:min(7vw,12vh);line-height:.96;letter-spacing:-.035em">[必填] 一句核心论点</h2>
      </div>
      <div class="swiss-img-split align-image-bottom" data-anim="up">
        <div class="swiss-img-copy">
          <div class="t-cat" style="color:var(--accent)">Why it matters</div>
          <p class="lead" style="font-weight:400;max-width:36ch">[必填] 2-3 行解释图片与论点的关系.</p>
          <div class="body" style="font-weight:400;color:var(--text-secondary)">[必填] 可以放 2-3 条短 bullet 或一段说明,保持左对齐和充足留白.</div>
        </div>
        <figure class="tile">
          <div class="frame-img r-16x10 fit-contain">
            <img src="images/23-visual-evidence.png" alt="[必填] 图片说明">
          </div>
          <figcaption class="swiss-img-caption"><strong>[必填] 图片标题</strong><span>16:10 · fit-contain</span></figcaption>
        </figure>
      </div>
    </div>
  </div>
</section>
```

---

### E02 · XREAL Evidence Grid · 多图证据墙(旧 P24,实验,默认禁用)

**用途**:三张同类型图片/截图/图表并列,展示证据链或多案例对比。
**适用内容类型**:**2-3 张同类图片**。适合 UI 截图重绘、流程图三段、三个案例实拍、三张数据小图。不同类型混放会破坏 XREAL Style 秩序。
**骨架**:head 上下叠 / `.swiss-img-grid` 三列 / 每张 tile 用同一个 `.h-22` 或 `.h-26`。
**关键类**:`.swiss-img-grid` `.frame-img.h-22|h-26` `.fit-contain` `.swiss-img-caption`
**动效 recipe**:`grid-reveal`
**注意**:
- 同组图片必须同一比例、同一高度、同一边距密度;不要一张 16:9、一张 4:3、一张长条截图混排
- 标题区和图片区之间必须有明显缓冲;模板里的 `.swiss-img-grid` 默认带顶部间距,只有在外层 grid 已经给足 gap 时才加 `.tight`
- UI/信息图统一 `.fit-contain`;照片统一 cover
- 用户原始截图优先保真并使用 `fit-contain`;太长时截取关键区域或拆成多张,不要为统一比例重画截图内容

```html
<section class="slide light" data-animate="grid-reveal">
  <div class="canvas-card">
    <div class="chrome-min">
      <div class="l brand"><img class="xreal-logo" src="assets/brand/xreal-logo-black.svg" alt="XREAL"><span>Section · Evidence Grid</span></div>
      <div class="r">24 / NN</div>
    </div>
    <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr;gap:6vh">
      <div data-anim="head" style="display:flex;flex-direction:column;gap:1.4vh">
        <div class="t-meta">Three visual proofs</div>
        <h2 style="font-family:var(--sans),var(--sans-zh);font-weight:var(--weight-display);font-size:min(6.6vw,11.6vh);line-height:.96;letter-spacing:-.035em">[必填] 三个证据,一个结论</h2>
      </div>
      <div class="swiss-img-grid" data-anim="up">
        <figure class="tile"><div class="frame-img h-26 fit-contain"><img src="images/24-proof-a.png" alt="[必填]"></div><figcaption class="swiss-img-caption"><strong>01</strong><span>[必填] 证据 A</span></figcaption></figure>
        <figure class="tile"><div class="frame-img h-26 fit-contain"><img src="images/24-proof-b.png" alt="[必填]"></div><figcaption class="swiss-img-caption"><strong>02</strong><span>[必填] 证据 B</span></figcaption></figure>
        <figure class="tile"><div class="frame-img h-26 fit-contain swiss-lined"><img src="images/24-proof-c.png" alt="[必填]"></div><figcaption class="swiss-img-caption"><strong>03</strong><span>[必填] 关键证据</span></figcaption></figure>
      </div>
    </div>
  </div>
</section>
```

---

## 选版式索引(给 LLM 的决策表)

| 内容意图 | 推荐版式 |
|---|---|
| Deck 起手封面 | P1 Cover |
| 内部章节标题 / 议题切换 | S01 + Section Hero Variant |
| 演化对比 / 时间轴(纵) | P2 Vertical Timeline |
| 一句口号 / 章节起 | P3 Statement |
| 6 项概念定义 | P4 Six Cells |
| 三层架构 / 三段递进 | P5 Three Layers |
| 4 项数据视觉化高度对比 | P6 KPI Tower |
| 5-10 项排名比较 | P7 H-Bar Chart |
| Before/After / 双轨对照 | P8 Duo Compare |
| 整 deck 收尾 | P9 Brand Back Cover |
| 多步流程(横,4-7 步) | P11 Horizontal Timeline |
| 阶段性结论 + ink 通栏 | P12 Manifesto + Banner |
| 3 个对等概念深化 | P13 Three Forces Cards |
| 闭环流程 / 自学循环 | P14 Loop Diagram |
| 8-12 项矩阵 + 总数据 | P15 Image Matrix |
| 6 项快讯小卡 | P16 Multi-card Brief |
| 层级架构 / 同心圆系统 | P17 System Diagram |
| 三论点 + 数据支撑 | P18 Why Now |
| 4 项等权特性 | P19 Four Cards |
| 4-6 行账单式 KPI | P20 Stacked Ledger |
| 产品规格 / benchmark | P21 Tech Spec |
| 案例图 + 数据落地 | P22 Image Hero |
| 3-8 类别 × 2-4 系列同尺度比较 | P23 Data Chart |
| 时间 / 连续变量趋势与拐点 | P24 Line Chart |
| 地点 / 路线 / 人物住所关系 | S08 + XREAL Map Component |
| 单图解释论点 / 图文混排实验 | E01 XREAL Image Split（默认禁用） |
| 2-3 张图片/截图证据链实验 | E02 XREAL Evidence Grid（默认禁用） |

---

## 选版式 P0 原则:内容数据类型必须匹配版式

> 这是写 deck 时**最容易踩雷**的地方。版式承载内容的「形状」是固定的——你必须先看内容,再选版式,**绝不能先选版式再编内容硬塞**。

| 内容类型 | 必须用 | 严禁用 |
|---|---|---|
| 有真实量化数据(百分比/数值) | P6 KPI Tower / P7 H-Bar / P20 Ledger / P21 Tech Spec / P23 Data Chart / P24 Line Chart | P3 / P4 / P13(无数据版式) |
| 无数据,纯定性论断 | P3 Statement / P12 / P13 / P19 | ⚠️ **P7 H-Bar / P6 KPI Tower**(编造数据会被识破) |
| 4 项对等 | P19 Four Cards / P6(若有数据) | 不能强凑成 6 用 P4 |
| 6 项对等 | P4 Six Cells / P16 Brief | 不能强凑成 4 用 P19 |
| 3 项对等 | P13 Three Forces | P5 只用于有明确层级关系的三层结构 |
| Before/After | P8 Duo Compare(必须正好 2 项) | |
| 地点/路线/城市关系 | S08 + XREAL Map Component | 普通 S04/S16 卡片罗列 |
| 闭环结构 | P14 Loop Diagram | P11 横向流程(线性 ≠ 闭环) |
| 三层并列 / 递进 | P5 Three Layers | |
| 三层嵌套 / 同心生态 | P17 System Diagram | |
| 时间演化(事件 + 阶段 KPI) | P2 Vertical Timeline | P24 不承载事件叙事 |
| 时间 / 连续变量趋势(4-12 点) | P24 Line Chart | P23 分组柱图 / P2 事件时间线 |
| 类别 × 系列比较(3-8 类别) | P23 Data Chart | P24 折线图(类别无连续顺序) |
| 多步骤流程(无数据) | P11 Horizontal Timeline | |
| 8-12 项同类 | P15 Image Matrix | |
| deck 收尾 | P9 Closing(每 deck 仅 1 次) | |
| 1 张核心图片 + 一段解释 | S22 Image Hero 或用户明确启用 E01 | E01 默认禁用 |
| 2-3 张同类图片 | S15/S16 图片格或用户明确启用 E02 | E02 默认禁用 |

**雷区案例**:用 P7 H-Bar Chart 展示「智能补全 / 实时协作 / 自主代理」这种**无可比百分比的概念列举**,编造 96/88/78 之类数字 → **数据不可信,版式滥用**。这种内容应该用 P2(若有时间维度)或 P3 Statement(若是论断)。

---

## 常犯错误(P0 检查项)

1. ❌ 卡片各自使用不同圆角或保持生硬直角 → ✅ 卡片统一使用 `border-radius:var(--radius-sm)`（3px）；接触 x 轴的垂直柱体只圆顶部两角，底角保持直角
2. ❌ 在 `.card-accent` 上又加描边 → ✅ 卡片填充类型互斥
3. ❌ 自己画 SVG 图标或 SVG 插画配图 → ✅ 图标用 Google Material Symbols Outlined；配图从 `assets/media/` 或用户素材中选择
4. ❌ 时间线 dot 用 grid `justify-self` 对齐虚线 → ✅ axis 列固定 12px + dot 绝对定位
5. ❌ 大字号不限高(`13vw`)→ ✅ 永远 `min(Xvw, Yvh)` 双约束
6. ❌ ESC 索引页缩略图看不到带动效内容 → ✅ 给 cloned slide 加可见性 override CSS
7. ❌ 所有页用同一个 fade-up recipe → ✅ 每页一个语义化 recipe,与图形耦合
8. ❌ 标题 + 卡片间距 < 5vh → ✅ 章节级标题至少 9vh
9. ❌ 9px 圆形装饰点 → ✅ 8×8 直角小方块 / mono `t-meta` 文字
10. ❌ 装饰元素超出页面边距 → ✅ 严格在 grid 内,不贴边
