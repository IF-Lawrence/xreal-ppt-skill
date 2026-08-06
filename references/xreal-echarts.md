# XREAL ECharts Component

本组件把 Apache ECharts 作为复杂数据图表的计算与渲染引擎，但不把 ECharts 默认主题、dashboard 结构或控件视觉带入 XREAL Style。它是已登记版式的扩展能力，不新增正文版式编号。

## 何时使用

简单分组柱图继续使用 S23 原生 HTML 组件，简单折线继续使用 S24 原生 SVG 组件。只有数据形状确实需要复杂编码、布局或交互时才使用 ECharts。

| `data-layout` | 可用 `data-chart-kind` | 用途 |
|---|---|---|
| S23 | `bar`、`mixed`、`scatter`、`bubble`、`heatmap`、`waterfall`、`boxplot`、`candlestick` | 复杂比较、分布、相关性、矩阵和区间 |
| S24 | `line`、`mixed` | 多段趋势或柱线混合；不同量纲仍默认拆图 |
| S17 | `sankey`、`graph`、`tree`、`treemap` | 流向、网络、层级和面积编码 |
| S08 | `geo` | 地理数据编码；地点关系与路线仍优先使用 XREAL Map Component |

仪表盘、3D、炫光尾迹、液体填充、图标柱、装饰性雷达和无数据意义的动态效果不登记。

## 页面契约

```html
<section class="slide light"
  data-layout="S23"
  data-chart-engine="echarts"
  data-chart-kind="scatter">
  <div class="canvas-card">
    <header class="chrome-min">...</header>

    <div data-anim="line">
      <div class="t-cat">Correlation</div>
      <h2 class="xreal-page-title">Usage depth, not reach, explains retention</h2>
    </div>

    <div class="chart-meta-row">
      <span class="chart-unit">Unit · sessions / retention %</span>
      <div class="chart-legend" aria-label="Data series">
        <span class="chart-legend-item"><i class="chart-swatch series-1"></i>Current cohort</span>
      </div>
    </div>

    <div class="xreal-echart-stage">
      <div class="xreal-echart"
        data-echarts-key="retentionScatter"
        data-renderer="svg"
        data-interactive="false"
        role="img"
        aria-label="Sessions per week and 90-day retention by cohort"></div>
    </div>

    <div class="chart-foot">
      <span class="chart-source">Source · Analytics warehouse · 2026-07</span>
      <span class="chart-note">Each point is one acquisition cohort</span>
    </div>
  </div>
</section>

<script data-xreal-echarts-options>
window.XREAL_ECHARTS_OPTIONS = {
  retentionScatter: {
    xAxis:{type:'value',name:'Sessions / week',min:0},
    yAxis:{type:'value',name:'90-day retention',min:0,max:100},
    series:[{
      type:'scatter',
      symbolSize:10,
      data:[[1.2,24],[2.1,31],[3.4,46],[4.8,59],{value:[6.2,72],xrealCritical:true}]
    }]
  }
};
</script>
```

## 必须结构

- `<section>` 保留正式 `data-layout`，并添加 `data-chart-engine="echarts"` 与登记的 `data-chart-kind`。
- 图表容器使用 `.xreal-echart[data-echarts-key]`，key 必须命中 `window.XREAL_ECHARTS_OPTIONS`。
- 每张图必须在 ECharts 容器外显示 `.chart-unit`、`.chart-legend` 和 `.chart-source`。`.chart-foot` 继承全局注脚 token：`max(11px,.62vw)`、统一底部基线、透明底且不使用分割线或额外 padding。
- 默认 `data-renderer="svg"`。只有图形元素超过约 1,000 或交互密集时才使用 `canvas`，并同时写 `data-large-data="true"`。
- 默认 `data-interactive="false"`，演讲模式不显示 tooltip。确需现场探索时才设为 `true`。

## 视觉锁

运行时会强制应用 XREAL 主题：

- 透明背景；标题、图例、toolbox 由 HTML 版式控制，ECharts 内部默认关闭。
- 原生图表和 ECharts 共用 `--chart-series-1/2/3/4` 的近黑、中性深灰、中性浅灰、最浅灰顺序；不得引入默认主题蓝、蓝灰或临时色。仅一个有明确结论、风险或警示依据的系列/数据项可声明 `xrealCritical:true`，并使用 `--chart-critical` 品牌红。
- 坐标轴、网格和关系线使用 1px hairline；文字跟随整套 deck 字体。
- 柱体从共同零基线长出；垂直柱仅顶部 8px 圆角，水平柱仅末端 8px 圆角。
- 禁止 `shadowBlur`、`shadowColor`、`colorStops`、非空 `areaStyle`、`decal`、3D、发光和连续彩虹色带。
- 热力图只使用 `visualMap.type="piecewise"` 的离散灰阶；关键区间可单独使用一个红色 piece。
- ECharts 生成的运行时 SVG/Canvas 仅属于合法图表几何，不构成“代码绘制插画”的例外扩张。

## 图表类型白名单

运行时系列类型只接受：

`bar`、`line`、`scatter`、`boxplot`、`heatmap`、`candlestick`、`sankey`、`graph`、`tree`、`treemap`。

`mixed`、`bubble` 和 `waterfall` 是页面语义类型，分别由白名单内的多个 series、scatter symbol size 和辅助 bar series 实现。`geo` 需要项目明确提供合法地图数据，不允许在线抓取地图或默认启用 roam。

## 动效与切页

- ECharts 负责图表几何动画，Motion One 只负责页面标题与 HTML 元数据，禁止双重动画同一几何。
- 切换到图表页时运行时会 `resize`、清空并重新 `setOption`，让动画从确定状态开始。
- `B` 静态模式、`prefers-reduced-motion` 或低功耗模式会关闭 ECharts 动画并直接显示最终状态。
- ESC 索引会优先复用 SVG 预渲染；大数据 Canvas 图表在缩略图中可只显示静态占位。

## 离线单文件流程

Apache ECharts 固定使用 `6.1.0`，本地文件带 SHA-256 校验和 Apache 2.0 许可证头。

```bash
node scripts/prepare-echarts.mjs
node scripts/inline-echarts.mjs path/to/index.source.html path/to/index.html
node scripts/validate-swiss-deck.mjs path/to/index.html
```

`inline-echarts.mjs` 只在 deck 实际声明 `data-chart-engine="echarts"` 时嵌入依赖；普通 deck 会移除 bundle marker，不增加文件体积。最终交付文件不得依赖 ECharts CDN。
