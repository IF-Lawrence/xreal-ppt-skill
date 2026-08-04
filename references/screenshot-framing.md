# 截图美化语义规则 · XREAL Style

用于把产品截图、网页截图、代码截图、设计稿或旧 PPT 截图处理成符合 XREAL Style 模板比例的图片资产。目标是“截图保真 + 网格适配”，不是默认让 GPT-M 2.0 重画。

## 优先级

1. **程序化适配优先**：需要保留文字、UI 细节或数据时，创建目标比例画布，把原截图等比缩放后放入画布。
2. **GPT-M 2.0 只做重构**：原图过长、过窄、信息太乱，或需要 UI 情景化/概念化表达时才重绘。
3. **模板槽位先行**：先确定 `Sxx` 版式和图片槽位，再决定截图适配参数。

## 开始前询问

- 截图在哪个文件夹？包含网页、App、代码、dashboard、设计稿还是旧 PPT？
- 需要**保真展示**、**统一美化**、**重新设计成 UI 情景图**，还是混合处理？
- 最终放入哪个槽位：21:9 顶图、16:10 主图、4:3 侧图、1:1 方图还是多图网格？
- 是否必须保留所有文字和数据？是否需要隐藏账号、头像、项目名等敏感信息？
- 构图希望居中、左上、右下，还是根据页面内容自动判断？

## 处理链路

1. **先匹配版式**：根据内容选择模板 layout，确定截图槽位尺寸和比例。
2. **再选处理方式**：保真用程序化适配；只统一视觉则适配加主题背景；需要解释概念时再重构。
3. **再选择背景**：优先使用 `assets/screenshot-backgrounds/xreal-style/` 的内置背景，不要为每张截图临时生成背景。
4. **最后合成**：背景 cover 铺满目标画布，截图等比缩放后按 padding 和 alignment 放入。

默认不要裁掉截图内容。只有截图已按目标槽位重新生成，或用户明确允许裁切时，才使用 cover 裁切。

## 语义参数

| 参数 | 可选值 | XREAL Style 默认 |
|---|---|---|
| `ratio` | `21:9` / `16:10` / `16:9` / `4:3` / `1:1` | 跟随模板槽位 |
| `background` | `plain` / `grid` / `dot-matrix` | `grid` |
| `padding` | `compact` / `standard` / `spacious` | `standard` |
| `inset` | `none` / `subtle` / `balanced` | `subtle` |
| `shadow` | `none` | `none` |
| `corners` | `square` | `square` |
| `alignment` | `center` / `top-left` / `top-right` / `bottom-left` / `bottom-right` | 跟随页面构图 |

推荐语义：

```text
ratio:21:9, background:grid, padding:standard, inset:subtle, shadow:none, corners:square, alignment:center
```

## XREAL Style 视觉规则

- 背景使用 `plain` / `grid` / `dot-matrix`，以黑白灰为主；红色只在关键语义中低占比出现。
- 截图中的红色只保留原产品语义或关键状态，不把红色扩展成第二套页面 accent。
- 截图直角、无阴影、无圆角；必要时只加少量 hairline 或顶部 accent 线。
- accent 只占约 5%-8% 的视觉面积，不生成高亮大色块或霓虹渐变。
- 背景中心和四角保持安静，不能有文字、logo、图标、人物、设备、边框或明显主体。
- 背景必须 crop-safe：裁成 `21:9`、`16:10`、`4:3`、`1:1` 都不能暴露被裁切痕迹。

## 内置主题背景资产

优先复用以下 1920×1080 级别的 WebP；合成时先 cover 到目标画布，再裁成图片槽位比例：

| 主题色 | 内置资产 | 背景语义 |
|---|---|---|
| 黑白灰点阵 | `assets/screenshot-backgrounds/xreal-style/black-dot-grid.png` | 点阵 + 低对比黑色场 |

背景不是独立 slide，内部不能有标题、页脚、边框、logo、人物或明显主体。

## 截图类型决策

| 原始素材 | 推荐处理 |
|---|---|
| 普通网页 / App / 桌面截图 | 程序化适配到目标比例 |
| 产品 UI 细节很重要 | 程序化适配，使用 `fit-contain`，不重画 |
| 长网页截图 | 截关键区域或拆成 2-3 张同尺寸面板 |
| 极窄 / 极高截图 | 先尝试 `spacious + side alignment`，仍太小时再重构 |
| 代码截图 | 使用浅网格背景，保证文字可读 |
| 概念解释用 UI 情景图 | 使用 GPT-M 2.0 按 16:10 槽位重设计 |

## 新增背景提示词

只有现有背景缺失或明显不匹配时才生成：

```text
16:9 crop-safe screenshot background for an XREAL Style PPT system. Pure off-white base, ultra-subtle 16-column grid and sparse dot matrix in neutral black/gray, with red reserved for rare semantic emphasis. No large bright color blocks. Quiet center and quiet corners, no text, no logo, no objects, no border, no focal subject. Suitable for cropping to 21:9, 16:10, 4:3, or 1:1.
```
