# Guizang PPT Skill · AI 使用说明

1. 先读取 `SKILL.md`，再按需读取 `references/` 中的规范。
2. 生成 PPT 时，以 `assets/template-swiss.html` 为模板，输出单文件 HTML。
3. 默认使用 XREAL Style：黑白灰为主、红色仅作语义强调；正文版式使用已登记的 `S01-S22`。
4. 生成后运行：`node scripts/validate-swiss-deck.mjs <你的 index.html>`。
5. 最后在浏览器打开 HTML，逐页检查布局和内容是否溢出。

示例请求：

> 基于这篇材料生成一份 7 页左右的 XREAL Style 网页 PPT，使用 2–3 张配图，并完成校验。
