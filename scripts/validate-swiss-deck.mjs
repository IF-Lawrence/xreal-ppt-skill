#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const file = process.argv[2];
const allowExperimental = process.argv.includes('--allow-experimental');

if (!file) {
  console.error('Usage: node scripts/validate-swiss-deck.mjs <index.html> [--allow-experimental]');
  process.exit(2);
}

const html = readFileSync(file, 'utf8');
const htmlWithoutEChartsBundle = html.replace(/<script\b[^>]*\bdata-xreal-echarts-bundle\b[^>]*>[\s\S]*?<\/script>/gi, '');
const htmlForSlides = htmlWithoutEChartsBundle.replace(/<!--[\s\S]*?-->/g, '');
const htmlForStatic = htmlForSlides.replace(/<script\b[\s\S]*?<\/script>/gi, '');
const errors = [];
const warnings = [];
const approvedUppercaseTokens = new Set([
  'XREAL', 'AI', 'AR', 'VR', 'XR', 'IBM', 'PPT', 'PPTX', 'PDF', 'CSV',
  'HTML', 'CSS', 'JS', 'JSON', 'API', 'SDK', 'UI', 'UX', 'KPI', 'OKR',
  'ROI', 'CAGR', 'EBITDA', 'B2B', 'B2C', 'OEM', 'ODM', 'ESG', 'URL',
  'HTTP', 'HTTPS', 'RGB', 'CMYK', 'CEO', 'CTO', 'COO', 'CFO', 'ESC',
  'AWE', 'OST', 'TOPS', 'USB-C', 'FOV', 'EAP', 'X1S',
]);

function overflowFix(px) {
  const n = Math.round(px);
  if (n <= 40) return `only ${n}px over: nudge content up or tighten one gap/padding by 20-40px; do not delete content`;
  if (n <= 90) return `${n}px over: compact local gaps/padding and reduce one block height; avoid cutting copy`;
  if (n <= 160) return `${n}px over: reduce a display title slightly or compress one paragraph before deleting content`;
  return `${n}px over: switch to a higher-capacity layout or remove/merge content intentionally`;
}

async function loadPlaywright() {
  const candidates = [
    createRequire(import.meta.url),
    createRequire(pathToFileURL(path.join(process.cwd(), 'package.json')).href),
  ];
  for (const req of candidates) {
    try {
      const resolved = req.resolve('playwright');
      const mod = await import(pathToFileURL(resolved).href);
      return mod.default || mod;
    } catch {
      // Try the next resolution root.
    }
  }
  return null;
}

const allowedLayouts = new Set([
  'XREAL-COVER-BLACK',
  'XREAL-CLOSING-BLACK',
  'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08',
  'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17',
  'S18', 'S19', 'S20', 'S21', 'S22', 'S23', 'S24',
]);
const echartsKindsByLayout = new Map([
  ['S23', new Set(['bar', 'mixed', 'scatter', 'bubble', 'heatmap', 'waterfall', 'boxplot', 'candlestick'])],
  ['S24', new Set(['line', 'mixed'])],
  ['S17', new Set(['sankey', 'graph', 'tree', 'treemap'])],
  ['S08', new Set(['geo'])],
]);

const slideRe = /<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>[\s\S]*?<\/section>/g;
const slides = [...htmlForSlides.matchAll(slideRe)].map((m, idx) => ({ idx: idx + 1, html: m[0], tag: m[0].match(/<section\b[^>]*>/)?.[0] ?? '' }));

if (!slides.length) {
  errors.push('No <section class="slide"> pages found.');
}

const closingSlides = slides.filter((slide) => /\bdata-layout="XREAL-CLOSING-BLACK"/.test(slide.tag));
if (closingSlides.length !== 1) {
  errors.push(`Back cover mismatch: expected exactly one XREAL-CLOSING-BLACK slide; found ${closingSlides.length}.`);
} else if (closingSlides[0].idx !== slides.length) {
  errors.push(`Back cover mismatch: XREAL-CLOSING-BLACK must be the final slide; found it at slide ${closingSlides[0].idx} of ${slides.length}.`);
}

const documentLang = htmlForSlides.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1]?.toLowerCase() ?? '';
const slideText = slides
  .map((slide) => slide.html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '))
  .join(' ');
const hasCjkContent = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(slideText);

if (hasCjkContent && !documentLang.startsWith('zh')) {
  errors.push('Font context mismatch: Chinese or mixed-language deck must use <html lang="zh-CN"> so the whole deck uses IBM Plex Sans SC.');
}
if (!hasCjkContent && !documentLang.startsWith('en')) {
  errors.push('Font context mismatch: all-English deck must use <html lang="en"> so the whole deck uses XREAL Diatype.');
}

const englishTypographyBlock = htmlForStatic.match(/html\[lang\^?=["']en["']\]\s*\{([^}]*)\}/i)?.[1] ?? '';
const englishChromeRatio = Number(englishTypographyBlock.match(/--chrome-label-optical-ratio\s*:\s*([0-9.]+)/i)?.[1]);
if (documentLang.startsWith('en') && (!Number.isFinite(englishChromeRatio) || englishChromeRatio < 0.305 || englishChromeRatio > 0.32)) {
  errors.push('English chrome mismatch: XREAL Diatype needs --chrome-label-optical-ratio around .313 so adjacent labels match the XREAL Logo visual height.');
}
if (documentLang.startsWith('en')) {
  const enCoverTitleVw = Number(englishTypographyBlock.match(/--cover-title-size\s*:\s*min\(\s*([0-9.]+)vw/i)?.[1]);
  const enSectionTitleVw = Number(englishTypographyBlock.match(/--section-hero-title-size\s*:\s*min\(\s*([0-9.]+)vw/i)?.[1]);
  const enPageTitleVw = Number(englishTypographyBlock.match(/--page-title-size\s*:\s*min\(\s*([0-9.]+)vw/i)?.[1]);
  if (![enCoverTitleVw, enSectionTitleVw, enPageTitleVw].every(Number.isFinite) || !(enPageTitleVw < enSectionTitleVw && enSectionTitleVw < enCoverTitleVw)) {
    errors.push('English title hierarchy mismatch: keep page title < section Hero < Index Cover in the html[lang^="en"] token overrides.');
  }
}

const cssNumber = (name) => Number(htmlForStatic.match(new RegExp(`${name}\\s*:\\s*([0-9.]+)`, 'i'))?.[1]);
const cssMinVw = (source, name) => Number(source.match(new RegExp(`${name}\\s*:\\s*min\\(\\s*([0-9.]+)vw`, 'i'))?.[1]);
const navDotAlpha = cssNumber('--nav-dot-alpha');
const navDotActiveAlpha = cssNumber('--nav-dot-active-alpha');
const navDotDarkAlpha = cssNumber('--nav-dot-dark-alpha');
const navDotDarkActiveAlpha = cssNumber('--nav-dot-dark-active-alpha');
const radiusSm = cssNumber('--radius-sm');
const baseCoverTitleVw = cssMinVw(htmlForStatic, '--cover-title-size');
const baseSectionTitleVw = cssMinVw(htmlForStatic, '--section-hero-title-size');
const basePageTitleVw = cssMinVw(htmlForStatic, '--page-title-size');
if (!Number.isFinite(radiusSm) || radiusSm < 2 || radiusSm > 4) {
  errors.push('Corner token mismatch: define --radius-sm between 2px and 4px; the XREAL template standard is 3px.');
}
if (![baseCoverTitleVw, baseSectionTitleVw, basePageTitleVw].every(Number.isFinite) || !(basePageTitleVw < baseSectionTitleVw && baseSectionTitleVw < baseCoverTitleVw)) {
  errors.push('Title hierarchy mismatch: define --page-title-size < --section-hero-title-size < --cover-title-size so chapter Heroes remain below Index Cover.');
}
if (!Number.isFinite(navDotAlpha) || navDotAlpha > 0.10 || !Number.isFinite(navDotActiveAlpha) || navDotActiveAlpha > 0.20) {
  errors.push('Navigation contrast mismatch: light-background nav dots must remain low contrast (normal <= .10, active <= .20).');
}
if (!Number.isFinite(navDotDarkAlpha) || navDotDarkAlpha > 0.12 || !Number.isFinite(navDotDarkActiveAlpha) || navDotDarkActiveAlpha > 0.24) {
  errors.push('Navigation contrast mismatch: dark-background nav dots must remain low contrast (normal <= .12, active <= .24).');
}
if (/#nav\s+\.dot\.active\s*\{[^}]*background\s*:\s*var\(--accent\)/i.test(htmlForStatic)) {
  errors.push('Navigation contrast mismatch: the active dot must use low-opacity black/white, not solid var(--accent).');
}

const contentWeightSource = htmlForStatic.replace(/@font-face\s*\{[^}]*\}/gi, '');
if (/font-weight\s*:\s*(?:100|200|300|800|900)\b/i.test(contentWeightSource)) {
  errors.push('Typography hierarchy mismatch: use the fixed role weights only—English display/title/key data 500; Chinese or mixed display/title/key data 600; body 400; support text 400/450; labels 500; one core datum may use 700.');
}

const nonNoneBoxShadows = [...htmlForStatic.matchAll(/box-shadow\s*:\s*(?!none\b)[^;}]+/gi)];
if (nonNoneBoxShadows.length || /text-shadow\s*:\s*(?!none\b)/i.test(htmlForStatic) || /drop-shadow\s*\(/i.test(htmlForStatic)) {
  errors.push('Visual effect mismatch: shadows, glow edges, and neon effects are forbidden. Remove box-shadow, text-shadow, and drop-shadow.');
}

if (/text-transform\s*:\s*uppercase\b/i.test(htmlForStatic)) {
  errors.push('Typography casing mismatch: text-transform:uppercase is forbidden. Write visible copy in natural case; reserve all caps for XREAL, standard acronyms, and short model codes.');
}

const wideTracking = [...htmlForStatic.matchAll(/letter-spacing\s*:\s*([+-]?(?:\d*\.)?\d+)em/gi)]
  .map((match) => Number(match[1]))
  .filter((value) => Number.isFinite(value) && value > 0.05);
if (wideTracking.length) {
  errors.push(`Typography tracking mismatch: positive letter-spacing exceeds 0.05em (${[...new Set(wideTracking)].join(', ')}em). Use normal tracking for labels and metadata.`);
}

if (/\bid=["']hint["']/i.test(htmlForStatic)) {
  errors.push('Interaction chrome mismatch: visible keyboard/navigation hint is forbidden. Keep keyboard controls functional without rendering an on-canvas instruction label.');
}

const usesECharts = /\bdata-chart-engine=["']echarts["']/i.test(htmlForSlides);
const hasEChartsBundle = /<script\b[^>]*\bdata-xreal-echarts-bundle\b[^>]*>/i.test(html);
const echartsOptionBlocks = [...htmlWithoutEChartsBundle.matchAll(/<script\b[^>]*\bdata-xreal-echarts-options\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
if (usesECharts && !hasEChartsBundle) {
  errors.push('ECharts delivery mismatch: final HTML uses data-chart-engine="echarts" but has no inline data-xreal-echarts-bundle. Run scripts/inline-echarts.mjs.');
}
if (usesECharts && !echartsOptionBlocks.length) {
  errors.push('ECharts option registry missing: add <script data-xreal-echarts-options> with window.XREAL_ECHARTS_OPTIONS.');
}
if (usesECharts && /<script\b[^>]*\bsrc=["']https?:\/\/[^"']*echarts[^"']*["']/i.test(htmlWithoutEChartsBundle)) {
  errors.push('ECharts delivery mismatch: CDN scripts are forbidden in the final deck; use the pinned offline bundle.');
}
const echartsOptionsSource = echartsOptionBlocks.join('\n');
if (/\b(?:shadowBlur|shadowColor|shadowOffsetX|shadowOffsetY|colorStops|decal|bar3D|line3D|scatter3D|pictorialBar|effectScatter|liquidFill)\b/.test(echartsOptionsSource)) {
  errors.push('ECharts visual mismatch: options contain a forbidden shadow, gradient, 3D, effect, pictorial, or liquid-fill setting.');
}
if (/\bareaStyle\s*:\s*\{\s*[^}]/.test(echartsOptionsSource)) {
  errors.push('ECharts visual mismatch: non-empty areaStyle is forbidden; use unfilled lines.');
}

slides.forEach((slide) => {
  const layout = slide.tag.match(/\bdata-layout="([^"]+)"/)?.[1];
  const variant = slide.tag.match(/\bdata-variant="([^"]+)"/)?.[1] ?? '';
  const chartEngine = slide.tag.match(/\bdata-chart-engine="([^"]+)"/)?.[1] ?? '';
  const chartKind = slide.tag.match(/\bdata-chart-kind="([^"]+)"/)?.[1] ?? '';
  const isECharts = chartEngine === 'echarts';
  const visibleText = slide.html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const unapprovedAllCaps = [...visibleText.matchAll(/\b[A-Z][A-Z0-9-]{2,}\b/g)]
    .map((match) => match[0].replace(/-+$/, ''))
    .filter((token) => !approvedUppercaseTokens.has(token) && !/^[A-Z]{1,3}\d{1,4}$/.test(token) && !/^[A-Z]{1,3}-\d{1,4}$/.test(token));
  if (unapprovedAllCaps.length) {
    errors.push(`Slide ${slide.idx}: unapproved all-caps copy (${[...new Set(unapprovedAllCaps)].join(', ')}). Use sentence/natural case; only brand marks, standard acronyms, and short model codes may stay all caps.`);
  }

  if (/\b\d{1,2}\s*\/\s*(?:\d{1,2}|NN)\b/i.test(visibleText)) {
    errors.push(`Slide ${slide.idx}: visible page number found. XREAL Style uses navigation dots for order and does not render XX / NN counters.`);
  }

  if (!layout) {
    errors.push(`Slide ${slide.idx}: missing data-layout. XREAL Style locked mode requires a registered layout (S01-S08 or S10-S24) or XREAL-COVER-BLACK/XREAL-CLOSING-BLACK.`);
  } else if (!allowedLayouts.has(layout)) {
    errors.push(`Slide ${slide.idx}: data-layout="${layout}" is not registered in swiss-layout-lock.md.`);
  }

  if (chartEngine && chartEngine !== 'echarts') {
    errors.push(`Slide ${slide.idx}: data-chart-engine="${chartEngine}" is not registered; use "echarts" or remove the attribute.`);
  }
  if (isECharts) {
    const allowedKinds = echartsKindsByLayout.get(layout);
    if (!allowedKinds) {
      errors.push(`Slide ${slide.idx}: XREAL ECharts is not registered for data-layout="${layout}"; use S23, S24, S17, or S08.`);
    } else if (!chartKind || !allowedKinds.has(chartKind)) {
      errors.push(`Slide ${slide.idx}: data-chart-kind="${chartKind || '(missing)'}" is not registered for ${layout}; allowed: ${[...allowedKinds].join(', ')}.`);
    }
    const requiredClasses = ['xreal-echart-stage', 'xreal-echart', 'chart-unit', 'chart-legend', 'chart-source'];
    const missing = requiredClasses.filter((name) => !new RegExp(`\\b${name}\\b`).test(slide.html));
    if (missing.length) {
      errors.push(`Slide ${slide.idx}: XREAL ECharts is missing required structure (${missing.map((name) => `.${name}`).join(', ')}).`);
    }
    const chartTags = [...slide.html.matchAll(/<div\b[^>]*\bclass="([^"]+)"[^>]*>/g)]
      .filter((match) => match[1].split(/\s+/).includes('xreal-echart'))
      .map((match) => match[0]);
    if (chartTags.length !== 1) {
      errors.push(`Slide ${slide.idx}: XREAL ECharts requires exactly one primary .xreal-echart; found ${chartTags.length}.`);
    }
    chartTags.forEach((tag) => {
      if (!/\bdata-echarts-key="[^"]+"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: .xreal-echart must declare data-echarts-key.`);
      }
      const renderer = tag.match(/\bdata-renderer="([^"]+)"/)?.[1] ?? '';
      if (!/^(?:svg|canvas)$/.test(renderer)) {
        errors.push(`Slide ${slide.idx}: .xreal-echart must declare data-renderer="svg" or "canvas"; SVG is the default for presentations.`);
      }
      if (renderer === 'canvas' && !/\bdata-large-data="true"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: Canvas rendering requires data-large-data="true"; otherwise use SVG.`);
      }
      if (!/\bdata-interactive="(?:true|false)"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: .xreal-echart must explicitly declare data-interactive="false" or "true".`);
      }
      if (!/\brole="img"/.test(tag) || !/\baria-label="[^"]+"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: .xreal-echart requires role="img" and a meaningful aria-label.`);
      }
    });
  }

  if (variant && variant !== 'section-hero') {
    errors.push(`Slide ${slide.idx}: data-variant="${variant}" is not registered.`);
  }
  const hasSectionHeroIdentity = /\bsection-hero\b/.test(slide.tag) || /\bdata-animate="section-hero"/.test(slide.tag);
  if (hasSectionHeroIdentity && variant !== 'section-hero') {
    errors.push(`Slide ${slide.idx}: the section Hero class/animation requires data-variant="section-hero".`);
  }
  if (variant === 'section-hero') {
    if (layout !== 'S01') {
      errors.push(`Slide ${slide.idx}: section-hero must keep data-layout="S01".`);
    }
    if (!/\bsection-hero\b/.test(slide.tag) || !/\bsection-hero-kicker\b/.test(slide.html) || !/\bxreal-section-title\b/.test(slide.html) || !/\bsection-hero-summary\b/.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: section-hero requires the section-hero class, .section-hero-kicker, .xreal-section-title, and .section-hero-summary skeleton.`);
    }
    if (/\bxreal-cover-title\b|\bcover-row\b|\b(?:section-opener-index|section-index|chapter-index|chapter-number|chapter-num|cover-number|cover-num)\b/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: section-hero must be a single-title Hero, not an index. Remove cover rows, giant/index-style chapter numbers, and cover-title hierarchy.`);
    }
    if (/\bclass="[^"]*\baccent\b/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: section-hero cannot use full-screen slide accent. Use hero light, shallow grey, or hero dark so it stays below Index Cover.`);
    }
    if (!/\bdata-animate="section-hero"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: section-hero must use data-animate="section-hero".`);
    }
  }

  if (layout === 'XREAL-CLOSING-BLACK') {
    const normalizedClosingText = visibleText.replace(/\s+/g, ' ').trim();
    const requiredClasses = ['xreal-closing-lockup', 'xreal-closing-thanks', 'xreal-closing-mark', 'xreal-closing-logo'];
    const missing = requiredClasses.filter((name) => !new RegExp(`\\b${name}\\b`).test(slide.html));
    if (!/\bclass="[^"]*\baccent\b/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: XREAL closing must use class="slide accent" for a full pure-black back cover.`);
    }
    if (!/\bdata-animate="closing-thanks"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: XREAL closing must use data-animate="closing-thanks".`);
    }
    if (missing.length) {
      errors.push(`Slide ${slide.idx}: XREAL closing is missing required structure (${missing.map((name) => `.${name}`).join(', ')}).`);
    }
    if (normalizedClosingText !== 'Thanks') {
      errors.push(`Slide ${slide.idx}: XREAL closing may display only centered "Thanks" plus the small bottom Logo; found visible text "${normalizedClosingText || '(empty)'}".`);
    }
    if (/\bsplit-half\b|\btakeaway-list\b|\bclass="[^"]*\bhalf\b|\b(?:Closing|Takeaways|3 rules|End of field note)\b/.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: legacy split/takeaway closing content found. Use only the centered Thanks + small bottom XREAL Logo structure.`);
    }
    if (!/<img\b(?=[^>]*\bclass="[^"]*\bxreal-closing-logo\b)(?=[^>]*\bsrc="[^"]*assets\/brand\/xreal-logo-black\.svg")[^>]*>/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: XREAL closing must use the official assets/brand/xreal-logo-black.svg in .xreal-closing-logo.`);
    }
  }

  if (!allowExperimental && /\bdata-layout="P2[34]\b|XREAL Image Split|XREAL Evidence Grid|swiss-img-split|swiss-img-grid/.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: uses experimental P23/P24 image structure. Use S22 or S15/S16 image-grid adaptations instead.`);
  }

  if (/\bclass="[^"]*\b(?:dots|dots-fine|dots-bold|hatch|dot-mat|ring-mat|cross-mat)\b/i.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: decorative dot/pattern class found. Dot Matrix Statement was removed; use typography, grid, and semantic structure instead.`);
  }

  const isStatement = layout === 'S03' || layout === 'S10' || layout === 'XREAL-COVER-BLACK' || layout === 'XREAL-CLOSING-BLACK';
  const topChunk = slide.html.slice(0, 1800);

  if (!isStatement && /text-align\s*:\s*center/i.test(topChunk)) {
    errors.push(`Slide ${slide.idx}: top title area contains text-align:center. XREAL Style body titles should stay left aligned.`);
  }

  if (!isStatement && /align-self\s*:\s*center/i.test(topChunk) && /<h[12]\b/i.test(topChunk)) {
    errors.push(`Slide ${slide.idx}: top heading appears vertically/centrally aligned. Use the original left-top title skeleton.`);
  }

  if (!isStatement && /grid-template-columns\s*:\s*[0-9.]+fr\s+[0-9.]+fr/i.test(topChunk) && /<h[12]\b/i.test(topChunk)) {
    warnings.push(`Slide ${slide.idx}: heading inside a custom fr/fr grid. Confirm this is copied from the original Sxx skeleton, not a centered title hack.`);
  }

  if (/<svg\b[\s\S]*?<text\b/i.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: SVG contains visible <text>. Put labels in HTML grid/captions, keep SVG for geometry only.`);
  }

  const svgTags = [...slide.html.matchAll(/<svg\b[^>]*>/gi)];
  svgTags.forEach((match, svgIndex) => {
    const tag = match[0];
    const role = tag.match(/\bdata-svg-role="([^"]+)"/i)?.[1] ?? '';
    const className = tag.match(/\bclass="([^"]+)"/i)?.[1] ?? '';
    const approvedRole = /^(?:chart|map|flow|data-geometry)$/i.test(role);
    const approvedLegacyClass = /(?:chart|map|flow|data|geometry|pie|loop|system|timeline|relations)/i.test(className);
    if (!approvedRole && !approvedLegacyClass) {
      errors.push(`Slide ${slide.idx}: inline SVG ${svgIndex + 1} has no approved information role. SVG illustrations are forbidden; use a raster image, or mark legitimate chart/map/flow/data geometry with data-svg-role.`);
    }
  });

  if (/<canvas\b/i.test(slide.html) || /class="[^"]*(?:illustration|artwork|scene-art|hero-svg)[^"]*"/i.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: code-drawn illustration detected. Do not use SVG, Canvas, or CSS artwork as page imagery; use supplied assets, screenshots, photos, or raster-generated images.`);
  }

  if (/\bxreal-pie(?:-layout)?\b/.test(slide.html) && layout !== 'S18') {
    errors.push(`Slide ${slide.idx}: XREAL Pie Component must keep data-layout="S18".`);
  }
  if (/\bxreal-bento\b/.test(slide.html) && layout !== 'S19') {
    errors.push(`Slide ${slide.idx}: XREAL Bento Component must keep data-layout="S19".`);
  }

  if (/\bascii-bg\b/i.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: legacy decorative background found. XREAL cover and closing black areas must stay pure black.`);
  }

  const localImages = [...slide.html.matchAll(/<img\b[^>]*src="images\//g)];
  localImages.forEach((_, imageIndex) => {
    const imgTag = slide.html.slice(_.index, slide.html.indexOf('>', _.index) + 1);
    if (!/\bdata-image-slot="/.test(imgTag)) {
      errors.push(`Slide ${slide.idx}: local image ${imageIndex + 1} missing data-image-slot. Bind every image to a layout slot such as s22-hero-21x9 or s15-grid-21x9.`);
    }
  });

  const frameImageRe = /<div\b(?=[^>]*\bclass="([^"]*\bframe-img\b[^"]*)")[^>]*>\s*<img\b(?=[^>]*\bdata-image-slot="([^"]+)")[^>]*>/g;
  const frameImages = [...slide.html.matchAll(frameImageRe)];
  frameImages.forEach((match) => {
    const className = match[1];
    const slot = match[2];
    const frameTag = match[0].match(/^<div\b[^>]*>/)?.[0] ?? '';
    if (/^s1[56]-(?:grid|brief)-21x9$/.test(slot)) {
      if (/\bfit-contain\b/.test(className)) {
        errors.push(`Slide ${slide.idx}: ${slot} uses fit-contain. Regenerated S15/S16 21:9 images should fill the slot with .frame-img.r-21x9.`);
      }
      if (!/\br-21x9\b/.test(className)) {
        errors.push(`Slide ${slide.idx}: ${slot} must use .frame-img.r-21x9 so the image slot controls the visible size.`);
      }
      if (/height\s*:\s*\d+(?:\.\d+)?vh/i.test(frameTag)) {
        errors.push(`Slide ${slide.idx}: ${slot} frame has a fixed vh height. Use aspect-ratio .r-21x9 instead of shrinking long images into a short slot.`);
      }
    }
  });

  if (layout === 'S22') {
    if (!/data-image-slot="s22-hero-21x9"/.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S22 must use data-image-slot="s22-hero-21x9".`);
    }
    if (/object-position\s*:\s*top center/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S22 photo uses object-position:top center, which commonly crops faces. Use center 35% or center center.`);
    }
  }

  if (layout === 'S23' && !isECharts) {
    const requiredClasses = ['xreal-data-chart', 'chart-unit', 'chart-legend', 'chart-stage', 'chart-y-labels', 'chart-plot', 'chart-groups', 'chart-x-labels', 'chart-source'];
    const missing = requiredClasses.filter((name) => !new RegExp(`\\b${name}\\b`).test(slide.html));
    if (missing.length) {
      errors.push(`Slide ${slide.idx}: S23 Data Chart is missing required structure (${missing.map((name) => `.${name}`).join(', ')}).`);
    }
    if (!/\bdata-animate="chart-rise"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: S23 Data Chart must use data-animate="chart-rise".`);
    }
    if (!/\bdata-chart-unit="[^"]+"/.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S23 Data Chart must declare data-chart-unit and show the unit in .chart-unit.`);
    }
    const groupCount = [...slide.html.matchAll(/<[^>]+\bclass="[^"]*\bchart-group\b[^"]*"[^>]*>/g)].length;
    const barTags = [...slide.html.matchAll(/<div\b(?=[^>]*\bclass="[^"]*\bchart-bar\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    const valueCount = [...slide.html.matchAll(/\bclass="[^"]*\bchart-value\b[^"]*"/g)].length;
    if (groupCount < 3 || groupCount > 8) {
      errors.push(`Slide ${slide.idx}: S23 Data Chart requires 3-8 .chart-group categories; found ${groupCount}.`);
    }
    if (groupCount && (barTags.length < groupCount * 2 || barTags.length > groupCount * 4)) {
      errors.push(`Slide ${slide.idx}: S23 Data Chart requires 2-4 bars per category; found ${barTags.length} bars across ${groupCount} groups.`);
    }
    if (valueCount !== barTags.length) {
      errors.push(`Slide ${slide.idx}: S23 Data Chart requires one visible .chart-value for every bar; found ${valueCount} values for ${barTags.length} bars.`);
    }
    barTags.forEach((tag, barIndex) => {
      const value = Number(tag.match(/\bdata-value="([+-]?[0-9.]+)"/)?.[1]);
      const normalized = Number(tag.match(/--value\s*:\s*([0-9.]+)/)?.[1]);
      if (!Number.isFinite(value) || !Number.isFinite(normalized) || normalized < 0 || normalized > 100) {
        errors.push(`Slide ${slide.idx}: S23 chart bar ${barIndex + 1} must provide numeric data-value and normalized --value from 0-100.`);
      }
    });
  }

  if (layout === 'S24' && !isECharts) {
    const requiredClasses = ['xreal-line-chart', 'chart-unit', 'chart-legend', 'line-stage', 'chart-y-labels', 'line-plot', 'line-chart-svg', 'chart-line', 'line-x-labels', 'line-end-label', 'chart-source'];
    const missing = requiredClasses.filter((name) => !new RegExp(`\\b${name}\\b`).test(slide.html));
    if (missing.length) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart is missing required structure (${missing.map((name) => `.${name}`).join(', ')}).`);
    }
    if (!/\bdata-animate="line-draw"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart must use data-animate="line-draw".`);
    }
    if (!/\bdata-chart-unit="[^"]+"/.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart must declare data-chart-unit and show the unit in .chart-unit.`);
    }
    if (!/<svg\b(?=[^>]*\bdata-svg-role="chart")(?=[^>]*\bclass="[^"]*\bline-chart-svg\b)[^>]*>/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart requires svg.line-chart-svg with data-svg-role="chart"; SVG may contain geometry but no visible text.`);
    }
    const lineCount = [...slide.html.matchAll(/<(?:path|polyline)\b(?=[^>]*\bclass="[^"]*\bchart-line\b)[^>]*>/g)].length;
    const pointCount = [...slide.html.matchAll(/<circle\b(?=[^>]*\bclass="[^"]*\bchart-point\b)[^>]*>/g)].length;
    if (lineCount < 1 || lineCount > 3) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart requires 1-3 .chart-line series; found ${lineCount}.`);
    }
    if (lineCount && (pointCount < lineCount * 4 || pointCount > lineCount * 12)) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart requires 4-12 .chart-point samples per series; found ${pointCount} points across ${lineCount} lines.`);
    }
    if (/\b(?:dual-axis|secondary-axis|axis-right)\b/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S24 Line Chart uses a secondary/dual axis. Split unlike units into separate charts in the registered layout.`);
    }
  }
});

async function runRenderedMeasurements() {
  const playwright = await loadPlaywright();
  if (!playwright?.chromium) {
    warnings.push('Rendered measurement skipped: Playwright is not resolvable from the skill folder or current project. Static XREAL Style checks still ran.');
    return;
  }

  const browser = await playwright.chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'domcontentloaded' });
    await Promise.race([
      page.evaluate(() => document.fonts && document.fonts.ready),
      page.waitForTimeout(1800),
    ]);
    await page.waitForTimeout(800);
    if (usesECharts) {
      await page.waitForFunction(() => {
        const nodes = [...document.querySelectorAll('.xreal-echart')];
        return nodes.length > 0 && nodes.every((node) => ['ready', 'error'].includes(node.dataset.echartsState));
      }, null, { timeout: 6000 }).catch(() => {});
    }

    const measures = await page.$$eval('section.slide', (els) => {
      const TRANSPARENT = /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\s*\)|transparent/;
      const titleSelector = [
        '.h-hero', '.h-hero-zh', '.h-xl', '.h-xl-zh', '.h-statement',
        '.display', '.display-zh', '.h1-zh', '.h2-zh', '.h-md',
        '.step-title', 'h1', 'h2', 'h3',
      ].join(',');
      const hasDirectText = (n) => {
        for (const c of n.childNodes) {
          if (c.nodeType === 3 && c.textContent.trim().length > 0) return true;
        }
        return false;
      };
      const colorVisible = (c) => c && !TRANSPARENT.test(c);
      const labelFor = (n) => {
        const cls = n.className ? '.' + String(n.className).split(' ').filter(Boolean).join('.') : n.tagName.toLowerCase();
        const text = n.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
        return text ? `${cls} "${text}"` : cls;
      };
      const isMeaningful = (el, n) => {
        const er = el.getBoundingClientRect();
        const posterArea = er.width * er.height;
        const tag = n.tagName;
        const cs = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) return false;
        if (n === el || n.classList.contains('canvas-card')) return false;
        if (cs.position === 'fixed') return false;
        if (cs.position === 'absolute' && r.width * r.height >= posterArea * 0.82) return false;
        if (n.matches('canvas.mag-bg, .grain')) return false;

        const isText = hasDirectText(n);
        const isMedia = tag === 'IMG' || tag === 'CANVAS' || tag === 'SVG';
        const isRule = tag === 'HR' || (r.height <= 4 && (
          parseFloat(cs.borderTopWidth) >= 1 ||
          parseFloat(cs.borderBottomWidth) >= 1 ||
          colorVisible(cs.backgroundColor)
        ));
        const hasFill = colorVisible(cs.backgroundColor) && r.width * r.height >= 1600 && !['MAIN', 'SECTION'].includes(tag);
        const hasBorder = (parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) +
          parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)) >= 1 && r.width * r.height >= 1600;
        return isText || isMedia || isRule || hasFill || hasBorder;
      };
      const titleGapChecks = (el, nodes) => {
        const titles = Array.from(el.querySelectorAll(titleSelector)).filter((n) => n.textContent.trim());
        const out = [];
        for (const title of titles) {
          const tr = title.getBoundingClientRect();
          const isLocal = title.matches('.h-md, .step-title, h3');
          const minGap = isLocal ? 14 : 32;
          let nearest = null;
          let nearestGap = Infinity;
          for (const node of nodes) {
            if (node === title || title.contains(node) || node.contains(title)) continue;
            const nr = node.getBoundingClientRect();
            const gap = nr.top - tr.bottom;
            if (gap < -2) continue;
            const overlap = Math.max(0, Math.min(tr.right, nr.right) - Math.max(tr.left, nr.left));
            const overlapRatio = overlap / Math.min(tr.width, nr.width);
            if (overlapRatio < 0.12 && gap < 96) continue;
            if (gap < nearestGap) {
              nearestGap = gap;
              nearest = node;
            }
          }
          if (nearest && nearestGap < minGap) {
            out.push({ title: labelFor(title), next: labelFor(nearest), gap: Math.round(nearestGap), minGap });
          }
        }
        return out;
      };

      const radiusChecks = (el) => Array.from(el.querySelectorAll([
          '.frame-img', '.card-fill', '.card-ink', '.card-accent', '.sub-card',
          '.stack-block', '.bar-tower .cap',
          '.h-bar-chart .row-track', '.h-bar-chart .row-fill',
          '.bar-row .bar-track', '.bar-row .bar-fill',
          '.hero-ink-col', '.force-card', '.brief-card',
          '.xreal-bento > article',
        ].join(','))).filter((node) => {
          const r = node.getBoundingClientRect();
          if (r.width < 20 || r.height < 20) return false;
          const radius = parseFloat(getComputedStyle(node).borderTopLeftRadius);
          return !Number.isFinite(radius) || radius < 2 || radius > 4;
        }).map((node) => ({
          node: labelFor(node),
          radius: getComputedStyle(node).borderTopLeftRadius,
        }));

      const baselineBarChecks = (el) => Array.from(el.querySelectorAll([
          '.bar-tower .body-block',
          '.v-bar-chart .col-bar',
          '.chart-bar',
        ].join(','))).filter((node) => {
          const r = node.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return false;
          const style = getComputedStyle(node);
          const topLeft = parseFloat(style.borderTopLeftRadius);
          const topRight = parseFloat(style.borderTopRightRadius);
          const bottomLeft = parseFloat(style.borderBottomLeftRadius);
          const bottomRight = parseFloat(style.borderBottomRightRadius);
          return !Number.isFinite(topLeft) || topLeft < 2 || topLeft > 4
            || !Number.isFinite(topRight) || topRight < 2 || topRight > 4
            || !Number.isFinite(bottomLeft) || Math.abs(bottomLeft) > .1
            || !Number.isFinite(bottomRight) || Math.abs(bottomRight) > .1;
        }).map((node) => {
          const style = getComputedStyle(node);
          return {
            node: labelFor(node),
            radii: [
              style.borderTopLeftRadius,
              style.borderTopRightRadius,
              style.borderBottomRightRadius,
              style.borderBottomLeftRadius,
            ].join(' '),
          };
        });

      return els.map((el, index) => {
        const er = el.getBoundingClientRect();
        const H = el.clientHeight;
        const W = el.clientWidth;
        const nodes = Array.from(el.querySelectorAll('*')).filter((n) => isMeaningful(el, n));
        let top = Infinity;
        let bottom = -Infinity;
        let topNode = null;
        let bottomNode = null;
        for (const n of nodes) {
          const r = n.getBoundingClientRect();
          const itemTop = r.top - er.top;
          const itemBottom = r.bottom - er.top;
          if (itemTop < top) {
            top = itemTop;
            topNode = n;
          }
          if (itemBottom > bottom) {
            bottom = itemBottom;
            bottomNode = n;
          }
        }
        if (!nodes.length) {
          top = 0;
          bottom = 0;
        }
        const safeBottom = Math.round(H * 0.93);
        return {
          idx: index + 1,
          id: el.id || '',
          layout: el.dataset.layout || '',
          width: W,
          height: H,
          scrollOverflow: Math.max(0, Math.round(el.scrollHeight - H)),
          visual: {
            top: Math.round(top),
            bottom: Math.round(bottom),
            activeRatio: H ? (bottom - top) / H : 0,
            bottomGap: Math.max(0, Math.round(H - bottom)),
            topOverflow: Math.max(0, Math.round(-top)),
            bottomOverflow: Math.max(0, Math.round(bottom - H)),
            bottomNode: bottomNode ? labelFor(bottomNode) : '',
            topNode: topNode ? labelFor(topNode) : '',
            safeBottom,
          },
          titleGaps: titleGapChecks(el, nodes),
          radiusIssues: radiusChecks(el),
          baselineBarIssues: baselineBarChecks(el),
          echartsIssues: Array.from(el.querySelectorAll('.xreal-echart')).filter((node) => node.dataset.echartsState !== 'ready').map((node) => ({
            state: node.dataset.echartsState || 'uninitialized',
            message: node.dataset.echartsMessage || 'Chart did not reach ready state.',
          })),
        };
      });
    });

    for (const m of measures) {
      const prefix = `Slide ${m.idx}${m.layout ? ` (${m.layout})` : ''}`;
      if (m.scrollOverflow > 4) {
        errors.push(`${prefix}: M1 DOM overflow ${m.scrollOverflow}px. ${overflowFix(m.scrollOverflow)}.`);
      }
      if (m.visual.bottomOverflow > 4) {
        errors.push(`${prefix}: M1 visual bottom overflow ${m.visual.bottomOverflow}px; lowest element is ${m.visual.bottomNode}. ${overflowFix(m.visual.bottomOverflow)}.`);
      }
      if (m.visual.topOverflow > 4) {
        errors.push(`${prefix}: M1 visual top overflow ${m.visual.topOverflow}px; highest element is ${m.visual.topNode}. Move content down by the measured overflow plus 16-24px.`);
      }
      if (m.visual.bottom > m.visual.safeBottom) {
        warnings.push(`${prefix}: M1 content reaches ${Math.round(m.visual.bottom)}px; nav-safe line is ${m.visual.safeBottom}px. Lift the lowest block or add .nav-safe-bottom.`);
      }
      if (m.visual.bottomGap > 170 && m.visual.activeRatio < 0.74) {
        warnings.push(`${prefix}: M1 bottom whitespace ${m.visual.bottomGap}px; active content height ${Math.round(m.visual.activeRatio * 100)}%. Restore spacing/content instead of over-correcting overflow.`);
      }
      for (const gap of m.titleGaps) {
        warnings.push(`${prefix}: M2 ${gap.title} has ${gap.gap}px gap before ${gap.next} (min ${gap.minGap}px).`);
      }
      for (const issue of m.radiusIssues) {
        errors.push(`${prefix}: ${issue.node} uses ${issue.radius} corner radius. Card-like elements must use the shared 2-4px token (standard: --radius-sm:3px); page axes and dividers stay straight.`);
      }
      for (const issue of m.baselineBarIssues) {
        errors.push(`${prefix}: ${issue.node} uses corner radii ${issue.radii}. Baseline bars may round only the top corners (2-4px); bottom corners must be square and flush to the x-axis.`);
      }
      for (const issue of m.echartsIssues) {
        errors.push(`${prefix}: ECharts runtime is ${issue.state}: ${issue.message}`);
      }
    }
  } finally {
    await browser.close();
  }
}

await runRenderedMeasurements();

if (warnings.length) {
  console.warn('Warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error('XREAL Style deck validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`XREAL Style deck validation passed: ${slides.length} slide(s).`);
