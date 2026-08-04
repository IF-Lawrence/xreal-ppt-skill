# XREAL Style · 固定主题色

本 skill 固定使用一套主题：**XREAL 黑白灰品牌体系**。黑色是结构锚点，红色只作为关键语义强调；不提供其他主题，不接受任意自定义颜色。

## 使用方法

`assets/template-swiss.html` 已经内置 XREAL 黑白灰体系，无需切换主题。只有在模板被外部修改时，才按下面的完整变量组恢复：

```css
--paper:#ffffff;
--paper-rgb:255,255,255;
--ink:#0a0a0a;
--ink-rgb:10,10,10;
--pure-black:#000000;
--grey-1:#f2f3f4;
--grey-2:#d6dade;
--grey-3:#667085;
--accent:#0a0a0a;
--accent-rgb:10,10,10;
--accent-on:#ffffff;
--brand-red:#D71920;
--brand-silver:#A7ADB4;
--brand-gold:#B08D57;
```

## 视觉定位

- 适合：通用场合、商业发布、AI/科技产品、设计分享、方法论和数据汇报
- 调性：黑、白、灰为主，红色少量强调，冷静、理性、克制、有科技感
- 参考：Helvetica Forever、Massimo Vignelli、Josef Müller-Brockmann
- 使用 `.accent-block` 或 `.accent` 时以黑色承载结构，不把红色扩展成大面积背景
- 封面/封底使用 `--pure-black:#000000` 的满屏或半屏纯黑结构闭环，不叠加纹理或动态背景；正文页用灰阶和 hairline 保持呼吸
- XREAL 红色、银色、金色只作为品牌语义 Token 使用，不形成第二套主题

## 固定原则

- `--accent` 只能是 `#0a0a0a`
- `--pure-black` 只能是 `#000000`，仅用于封面/封底黑色区域
- 红色只能通过 `--brand-red` 或 `.xreal-critical` 作为语义强调
- 不要修改灰阶变量：`--paper` / `--grey-1/2/3` / `--ink`
- 不要使用渐变、阴影、圆角或透明高亮
- 主题色只在 `:root{}` 中定义，组件和页面统一使用 `var(--accent)`
