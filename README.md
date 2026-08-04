# Guizang PPT Skill · XREAL Style 网页 PPT

![GitHub stars](https://img.shields.io/github/stars/op7418/guizang-ppt-skill?style=flat-square)
![License](https://img.shields.io/github/license/op7418/guizang-ppt-skill?style=flat-square)
![Skill](https://img.shields.io/badge/Skill-Agent-111111?style=flat-square)
![HTML Deck](https://img.shields.io/badge/HTML-Deck-0A7CFF?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Supported-6B5B95?style=flat-square)
![Codex](https://img.shields.io/badge/Codex-Supported-222222?style=flat-square)

> 🌏 **English version: [README.en.md](./README.en.md)**

一个适配 Claude Code / Codex 等 Agent 环境的网页 PPT skill，用于生成**单文件 HTML 横向翻页 PPT**、配图和社交平台封面。当前只保留一套视觉系统：**XREAL Style**，采用严格网格、直角、发丝线和克制的品牌色彩体系。

# xreal-ppt-skill

## 视觉系统

网格至上、黑白灰结构、少量红色语义强调、直角、1px 发丝线、极致字号对比和无衬线排版。正文页使用锁定的 `S01-S22` 版式，适合：

- AI / 科技产品发布、demo day、产品分析
- 数据汇报、年度总结、benchmark、流程和系统关系
- 设计、工程、方法论、城市/历史路线等结构化分享

![XREAL Style 效果展示](https://github.com/user-attachments/assets/8960e78c-69bb-4b7e-aa95-6fad64b70314)

## 30 秒开始

```bash
npx skills add https://github.com/op7418/guizang-ppt-skill --skill guizang-ppt-skill
```

安装后直接告诉 Agent：

```text
帮我基于这篇文章做一份 XREAL Style PPT，控制在 7 页左右，需要 2-3 张配图。
```

也可以这样请求：

```text
把这份产品分析文档做成 8 页 XREAL Style PPT，使用黑白灰主体系和少量红色语义强调，保留 3 张截图并按模板槽位适配。
基于这份 PPT 的核心观点，生成一张 21:9 头图和一张 1:1 分享卡。
把这张产品截图重新设计成适合 XREAL Style PPT 的 16:10 配图。
```

## 功能

- 📐 横向左右翻页：键盘、滚轮、触屏、底部圆点、ESC 索引
- 🧱 22 个锁定版式：Cover、Statement、KPI Tower、Loop Diagram、Duo Compare、Image Hero、Closing 等
- 🎨 固定 XREAL Style 品牌色彩：黑白灰为主，红色仅作为关键数据语义强调
- 🔤 语境化品牌字体：纯英文 deck 使用 XREAL Diatype，中文或中英混排 deck 使用 IBM Plex Sans SC
- ◼️ XREAL Logo + Google Material Symbols Outlined 图标规范
- 🖼 可选配图流程：纪实照片、信息图、流程图、系统图、UI 情景图和数据视觉
- 📰 社交封面：21:9 头图、1:1 分享卡、3:4 封面和 16:9 缩略图
- ✅ XREAL Style validator：检查版式登记、图片槽位、SVG 文本、标题对齐和渲染边界

## 工作流

1. 明确受众、时长、素材、图片/截图要求、品牌语义和硬约束
2. 拷贝 `assets/template-swiss.html`、`assets/fonts/` 和 `assets/brand/`
3. 使用固定的 XREAL 黑白灰品牌体系；红色只用于关键数据、警示或操作状态
4. 先读 `swiss-layout-lock.md` 和 `layouts-swiss.md`，再按 `S01-S22` 选版式
5. 填充内容和图片，保持直角、无渐变、无阴影、无圆角
6. 运行 XREAL Style validator，并打开 HTML 逐页做视觉检查

```bash
node scripts/validate-swiss-deck.mjs path/to/index.html
```

完整规范见 [`SKILL.md`](./SKILL.md)，品牌规则见 [`references/brand-xreal.md`](./references/brand-xreal.md)。

## XREAL Style 主题色

`references/themes-swiss.md` 只保留一套主题，**固定使用 XREAL 黑白灰体系，不允许任意自定义颜色**：

| 角色 | 色值 | 用途 |
|---|---|---|
| 结构锚点 | `#0A0A0A` | 主文字、结构块、网格与导航 |
| 语义强调 | `#D71920` | 关键数据、警示、关键操作 |
| 技术质感 | `#A7ADB4` | 少量技术标记 |
| 品牌价值 | `#B08D57` | 少量价值标记 |

## 配图与截图

配图提示词在 [`references/image-prompts.md`](./references/image-prompts.md)，截图适配规则在 [`references/screenshot-framing.md`](./references/screenshot-framing.md)。

- S22 主图优先 21:9；S15/S16 多图统一比例和高度
- 保真截图优先程序化适配和 `.fit-contain`
- 图片内部不要生成页眉、页脚、标题、页码、logo 或 PPT 外壳
- XREAL Style 图片必须直角、无阴影、无圆角，只使用黑白灰和必要的品牌语义色

## 目录

```
guizang-ppt-skill/
├── SKILL.md
├── assets/
│   ├── template-swiss.html
│   ├── brand/xreal-logo-black.svg
│   ├── fonts/                 ← XREAL Diatype + IBM Plex Sans SC
│   ├── screenshot-backgrounds/xreal-style/
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

## FAQ

**可以导出 PPTX 吗？**

当前核心交付是 HTML。可以在浏览器演示、截图或录屏；PPTX 转换属于额外流程。

**为什么不允许自定义颜色？**

为了保证稳定的视觉输出，只允许使用 XREAL Style 的固定品牌色彩角色。

**我能加自己的版式吗？**

可以，但必须同步更新 `template-swiss.html`、`layouts-swiss.md`、`swiss-layout-lock.md` 和校验器，并明确标记实验版式。

**Codex 配图是必须的吗？**

不是。没有配图也能生成 PPT；配图流程只在需要照片、信息图、UI 情景图或封面时使用。

## 贡献

- 修改模板类时，同步更新 `layouts-swiss.md` 和 `swiss-layout-lock.md`
- 新增 XREAL Style 规则时更新 `scripts/validate-swiss-deck.mjs` 或 `checklist.md`
- 保持黑白灰为主、红色仅作语义强调，不新增其他色彩入口

## License

AGPL-3.0 © 2026 [op7418](https://github.com/op7418)
