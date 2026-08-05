#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

const deckDir = path.dirname(path.resolve(file));
const imagesDir = path.join(deckDir, 'images');
const copiedMedia = existsSync(imagesDir)
  ? readdirSync(imagesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:png|jpe?g|webp|avif|gif)$/i.test(entry.name))
      .map((entry) => entry.name)
  : [];
const mediaReferences = slides.flatMap((slide) => [...slide.html.matchAll(/<img\b[^>]*\bsrc=["']images\/([^"'?#]+)["']/gi)]
  .map((match) => ({ slide: slide.idx, file: decodeURIComponent(match[1]) })));
const referencedMedia = new Set(mediaReferences.map((item) => item.file));
const unreferencedMedia = copiedMedia.filter((name) => !referencedMedia.has(name));
if (unreferencedMedia.length) {
  warnings.push(`Media utilization: ${unreferencedMedia.length} copied file(s) in images/ are not referenced (${unreferencedMedia.join(', ')}). Assign a semantic slot or remove them from the final output.`);
}

const coverSlides = slides.filter((slide) => /\bdata-layout="XREAL-COVER-BLACK"/.test(slide.tag));
if (coverSlides.length !== 1) {
  errors.push(`Front cover mismatch: expected exactly one XREAL-COVER-BLACK slide; found ${coverSlides.length}.`);
} else if (coverSlides[0].idx !== 1) {
  errors.push(`Front cover mismatch: XREAL-COVER-BLACK must be the first slide; found it at slide ${coverSlides[0].idx}.`);
}

const closingSlides = slides.filter((slide) => /\bdata-layout="XREAL-CLOSING-BLACK"/.test(slide.tag));
if (closingSlides.length !== 1) {
  errors.push(`Back cover mismatch: expected exactly one XREAL-CLOSING-BLACK slide; found ${closingSlides.length}.`);
} else if (closingSlides[0].idx !== slides.length) {
  errors.push(`Back cover mismatch: XREAL-CLOSING-BLACK must be the final slide; found it at slide ${closingSlides[0].idx} of ${slides.length}.`);
}

const documentLang = htmlForSlides.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1]?.toLowerCase() ?? '';
const productLine = htmlForSlides.match(/<body\b[^>]*\bdata-product-line=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
const productMarkTags = [...htmlForStatic.matchAll(/<img\b(?=[^>]*\bclass=["'][^"']*\bxreal-product-mark\b[^"']*["'])[^>]*>/gi)].map((match) => match[0]);
if (productLine) {
  if (!productMarkTags.length) {
    errors.push(`Product identity mismatch: body declares data-product-line="${productLine}" but no official .xreal-product-mark is used. Audit the matching 00-product-marks/ assets before falling back to typed product text.`);
  }
  productMarkTags.forEach((tag) => {
    if (!/\bsrc=["']images\/[^"']+\.svg["']/i.test(tag)) {
      errors.push('Product identity mismatch: .xreal-product-mark must use a selected local SVG copied into images/.');
    }
    if (!/\bdata-image-slot=["']product-mark["']/i.test(tag) || !/\bdata-media-role=["']product-identity["']/i.test(tag)) {
      errors.push('Product identity mismatch: .xreal-product-mark must declare data-image-slot="product-mark" and data-media-role="product-identity".');
    }
    if (!/\balt=["'][^"']+["']/i.test(tag)) {
      errors.push('Product identity mismatch: .xreal-product-mark requires an accessible product name in alt.');
    }
  });
}
const slideText = slides
  .map((slide) => slide.html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '))
  .join(' ');
const inferredProductLines = [
  { slug: 'one-pro', pattern: /\b(?:XREAL\s+)?One\s+Pro\b/gi },
  { slug: 'aura', pattern: /\bXREAL\s+AURA\b/gi },
  { slug: '1s', pattern: /\bXREAL\s+1S\b/gi },
  { slug: 'xbx-a01+', pattern: /\bXBX\s+A01\+\b/gi },
];
const inferredProductLine = inferredProductLines.find(({ pattern }) => (slideText.match(pattern) || []).length >= 2)?.slug ?? '';
if (inferredProductLine && !productLine) {
  errors.push(`Product identity mismatch: slide content repeatedly identifies product line "${inferredProductLine}" but body has no data-product-line declaration. Run the product identity audit before media selection.`);
}
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
const chromeBrandGap = cssNumber('--chrome-brand-gap');
const chromeContentGap = cssNumber('--chrome-content-gap');
const chromeContentGapTight = cssNumber('--chrome-content-gap-tight');
const unitMarkOpacity = cssNumber('--unit-mark-opacity');
const unitMarkGap = cssNumber('--unit-mark-gap');
const unitDegreeGap = cssNumber('--unit-degree-gap');
const briefCardPad = cssNumber('--brief-card-pad');
const subCardPad = cssNumber('--sub-card-pad');
const mediaScrimAlpha = cssNumber('--media-scrim-alpha');
const baseCoverTitleVw = cssMinVw(htmlForStatic, '--cover-title-size');
const baseSectionTitleVw = cssMinVw(htmlForStatic, '--section-hero-title-size');
const basePageTitleVw = cssMinVw(htmlForStatic, '--page-title-size');
if (!Number.isFinite(radiusSm) || radiusSm < 7 || radiusSm > 9) {
  errors.push('Corner token mismatch: define --radius-sm between 7px and 9px; the XREAL template standard is 8px.');
}
if (!Number.isFinite(chromeBrandGap) || chromeBrandGap < 1.4 || chromeBrandGap > 2.4) {
  errors.push('Chrome spacing mismatch: define --chrome-brand-gap between 1.4vw and 2.4vw; the XREAL standard is 1.6vw so navigation text does not crowd the Logo.');
}
if (!Number.isFinite(chromeContentGap) || chromeContentGap < 20 || chromeContentGap > 32) {
  errors.push('Chrome content-gap mismatch: define --chrome-content-gap between 20px and 32px; the XREAL standard is 24px so the page body does not drift downward.');
}
if (!Number.isFinite(chromeContentGapTight) || chromeContentGapTight < 12 || chromeContentGapTight > 24 || chromeContentGapTight >= chromeContentGap) {
  errors.push('Tight chrome content-gap mismatch: define --chrome-content-gap-tight between 12px and 24px and smaller than --chrome-content-gap; the XREAL standard is 16px.');
}
if (!Number.isFinite(unitMarkOpacity) || unitMarkOpacity < .58 || unitMarkOpacity > .68) {
  errors.push('Unit color mismatch: define --unit-mark-opacity between .58 and .68; the XREAL standard is .62 for consistent neutral unit contrast.');
}
if (!Number.isFinite(unitMarkGap) || unitMarkGap < .14 || unitMarkGap > .24) {
  errors.push('Unit spacing mismatch: define --unit-mark-gap between .14em and .24em; the XREAL standard is .18em for textual units such as in and Hz.');
}
if (!Number.isFinite(unitDegreeGap) || unitDegreeGap < .01 || unitDegreeGap > .07) {
  errors.push('Degree spacing mismatch: define --unit-degree-gap between .01em and .07em; the XREAL standard is .03em so ° stays attached without touching the number.');
}
if (!Number.isFinite(briefCardPad) || briefCardPad < 1.8 || briefCardPad > 2.6) {
  errors.push('S16 card padding mismatch: define --brief-card-pad between 1.8vh and 2.6vh; the XREAL standard is 2.2vh on all four sides.');
}
if (!Number.isFinite(subCardPad) || subCardPad < 1.8 || subCardPad > 2.6) {
  errors.push('S04 card padding mismatch: define --sub-card-pad between 1.8vh and 2.6vh; the XREAL standard is 2.2vh on all four sides.');
}
if (!Number.isFinite(mediaScrimAlpha) || mediaScrimAlpha < .28 || mediaScrimAlpha > .48) {
  errors.push('Media scrim mismatch: define --media-scrim-alpha between .28 and .48; the XREAL standard is .38 for direct inverse text on full-bleed media.');
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

if (/<sub\b[^>]*>\s*(?:°|&deg;)\s*<\/sub>/i.test(htmlForStatic)) {
  errors.push('Unit alignment mismatch: degree symbols must never be subscript. Use a Unicode ° immediately after the number, or <sup class="unit-degree">°</sup>.');
}
const displayUnitRules = [...htmlForStatic.matchAll(/([^{}]*(?:\.unit|\.stat-unit)[^{]*)\{([^}]*)\}/gi)]
  .map((match) => match[2].match(/vertical-align\s*:\s*([^;}]+)/i)?.[1]?.trim().toLowerCase())
  .filter(Boolean)
  .filter((value) => value !== 'text-top' && !value.includes('var('));
if (displayUnitRules.length) {
  errors.push(`Unit alignment mismatch: display-number units must use the shared upper-shoulder alignment vertical-align:text-top; found ${[...new Set(displayUnitRules)].join(', ')}. Inline prose units should remain plain text on the prose baseline.`);
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
  const mediaMatch = slide.tag.match(/\bdata-media-match="([^"]+)"/)?.[1] ?? '';
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

  if (documentLang.startsWith('zh')) {
    const headingBlocks = [...slide.html.matchAll(/<h[1-3]\b[^>]*>[\s\S]*?<\/h[1-3]>/gi)].map((match) => match[0]);
    const italicChineseHeadings = headingBlocks.filter((block) => /<(?:i|em)\b|font-style\s*:\s*italic/i.test(block));
    if (italicChineseHeadings.length) {
      errors.push(`Slide ${slide.idx}: Chinese titles must remain upright. Remove <i>, <em>, or font-style:italic from heading content.`);
    }
  }

  if (/\b\d{1,2}\s*\/\s*(?:\d{1,2}|NN)\b/i.test(visibleText)) {
    errors.push(`Slide ${slide.idx}: visible page number found. XREAL Style uses navigation dots for order and does not render XX / NN counters.`);
  }

  if (!layout) {
    errors.push(`Slide ${slide.idx}: missing data-layout. XREAL Style locked mode requires a registered layout (S01-S08 or S10-S24) or XREAL-COVER-BLACK/XREAL-CLOSING-BLACK.`);
  } else if (!allowedLayouts.has(layout)) {
    errors.push(`Slide ${slide.idx}: data-layout="${layout}" is not registered in swiss-layout-lock.md.`);
  }

  if (layout === 'XREAL-COVER-BLACK' || layout === 'XREAL-CLOSING-BLACK') {
    const isCover = layout === 'XREAL-COVER-BLACK';
    const mediaClass = isCover ? 'xreal-cover-media' : 'xreal-closing-media';
    const mediaRole = isCover ? 'cover-background' : 'closing-background';
    const mediaSlot = mediaRole;
    const matchingMediaTags = [...slide.html.matchAll(new RegExp(`<img\\b(?=[^>]*\\bclass=["'][^"']*\\b${mediaClass}\\b[^"']*["'])[^>]*>`, 'gi'))].map((match) => match[0]);
    if (!/^(?:matched|none)$/.test(mediaMatch)) {
      errors.push(`Slide ${slide.idx}: ${layout} must declare data-media-match="matched" or "none" after auditing the available media pool.`);
    } else if (mediaMatch === 'matched') {
      if (matchingMediaTags.length !== 1) {
        errors.push(`Slide ${slide.idx}: data-media-match="matched" requires exactly one .${mediaClass} background image; found ${matchingMediaTags.length}.`);
      }
      matchingMediaTags.forEach((tag) => {
        if (!/\bsrc=["']images\//i.test(tag)) {
          errors.push(`Slide ${slide.idx}: .${mediaClass} must use a selected local file from images/.`);
        }
        if (!new RegExp(`\\bdata-image-slot=["']${mediaSlot}["']`, 'i').test(tag)) {
          errors.push(`Slide ${slide.idx}: .${mediaClass} must declare data-image-slot="${mediaSlot}".`);
        }
        if (!new RegExp(`\\bdata-media-role=["']${mediaRole}["']`, 'i').test(tag)) {
          errors.push(`Slide ${slide.idx}: .${mediaClass} must declare data-media-role="${mediaRole}".`);
        }
        if (!isCover && !/\bdata-media-kind=["'](?:lifestyle|conceptual|brand-kv)["']/i.test(tag)) {
          errors.push(`Slide ${slide.idx}: closing media must declare data-media-kind="lifestyle", "conceptual", or "brand-kv". Direct product cutouts, white-background product images, and packshots are forbidden on the back cover.`);
        }
        if (!isCover && (!/\bdata-media-fit=["']full-bleed["']/i.test(tag) || !/\bdata-media-contrast=["']darken["']/i.test(tag))) {
          errors.push(`Slide ${slide.idx}: closing media must use data-media-fit="full-bleed" and data-media-contrast="darken" so Thanks and the enterprise Logo remain readable.`);
        }
        if (!/\balt=["'][^"']+["']/i.test(tag)) {
          errors.push(`Slide ${slide.idx}: .${mediaClass} requires a meaningful alt description.`);
        }
      });
    } else if (matchingMediaTags.length) {
      errors.push(`Slide ${slide.idx}: data-media-match="none" cannot include .${mediaClass}; change the declaration to matched or remove the media.`);
    }
  }

  if (layout === 'S16') {
    const briefCardTags = [...slide.html.matchAll(/<(?:article|div)\b(?=[^>]*\bclass="[^"]*\bbrief-card\b[^"]*")[^>]*>/gi)].map((match) => match[0]);
    const accentBriefCards = briefCardTags.filter((tag) => /\bclass="[^"]*\bis-accent\b[^"]*"/i.test(tag));
    if (accentBriefCards.length > 1) {
      errors.push(`Slide ${slide.idx}: Multi-card Brief has ${accentBriefCards.length} accent cards. S16 defaults to equal-weight neutral cards and permits at most one semantic emphasis.`);
    }
    accentBriefCards.forEach((tag) => {
      if (!/\bdata-emphasis="(?:primary|recommended|critical|risk)"/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: .brief-card.is-accent has no registered semantic reason. Add data-emphasis="primary|recommended|critical|risk", or remove is-accent when the cards are equal weight.`);
      }
    });
  }

  if (layout === 'S02') {
    const timelineCount = [...slide.html.matchAll(/<div\b(?=[^>]*\bclass=["'][^"']*\btimeline-v\b[^"']*["'])[^>]*>/gi)].length;
    const headCount = [...slide.html.matchAll(/<div\b(?=[^>]*\bclass=["'][^"']*\btl-head\b[^"']*["'])[^>]*>/gi)].length;
    const nodeCount = [...slide.html.matchAll(/<div\b(?=[^>]*\bclass=["'][^"']*\btl-node\b[^"']*["'])[^>]*>/gi)].length;
    const requiredPerNode = ['tl-axis', 'dot', 'yr', 'multi', 'tl-copy', 'tl-stage', 'tl-impact'];
    if (timelineCount !== 1 || headCount !== 1) {
      errors.push(`Slide ${slide.idx}: S02 requires one .timeline-v and one aligned .tl-head so time, metric, and stage meaning are explicit.`);
    }
    if (nodeCount < 2 || nodeCount > 5) {
      errors.push(`Slide ${slide.idx}: S02 requires 2-5 .tl-node entries; found ${nodeCount}.`);
    }
    requiredPerNode.forEach((className) => {
      const count = [...slide.html.matchAll(new RegExp(`<[^>]+\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'gi'))].length;
      if (count !== nodeCount) {
        errors.push(`Slide ${slide.idx}: S02 requires exactly one .${className} per timeline node; found ${count} for ${nodeCount} node(s).`);
      }
    });
  }

  if (layout === 'S04') {
    const cardMediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass=["'][^"']*\bcard-media-slot\b[^"']*["'])[^>]*>/gi)].map((match) => match[0]);
    const mediaCards = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bsub-card\b[^"']*\bhas-media\b[^"']*["'])[^>]*>/gi)].length;
    if (cardMediaTags.length > 2) {
      errors.push(`Slide ${slide.idx}: S04 uses ${cardMediaTags.length} media cards. Six Cells permits at most 1-2 sparse technical-evidence cards; do not turn every card into an image tile.`);
    }
    if (cardMediaTags.length !== mediaCards) {
      errors.push(`Slide ${slide.idx}: each S04 .sub-card.has-media must contain exactly one .card-media-slot, and media-free cards must not use has-media.`);
    }
    cardMediaTags.forEach((tag) => {
      if (!/\bdata-image-slot=["']s04-card-media["']/i.test(tag) || !/\bdata-media-role=["']technical-evidence["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S04 .card-media-slot must declare data-image-slot="s04-card-media" and data-media-role="technical-evidence".`);
      }
      if (!/\bdata-media-fit=["'](?:inset|inset-prominent)["']/i.test(tag) || !/\bdata-media-contrast=["']none["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S04 technical evidence must use data-media-fit="inset|inset-prominent" and data-media-contrast="none"; inset media does not sit behind text.`);
      }
    });
  }

  if (layout === 'S05') {
    const layerMediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass=["'][^"']*\bstack-card-media\b[^"']*["'])[^>]*>/gi)].map((match) => match[0]);
    const mediaLayers = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bstack-block\b[^"']*\bhas-media\b[^"']*["'])[^>]*>/gi)].length;
    if (layerMediaTags.length > 1) {
      errors.push(`Slide ${slide.idx}: S05 uses ${layerMediaTags.length} media layers. Three Layers permits media in at most one core layer so the hierarchy remains structural.`);
    }
    if (layerMediaTags.length !== mediaLayers) {
      errors.push(`Slide ${slide.idx}: each S05 .stack-block.has-media must contain exactly one .stack-card-media, and media-free layers must not use has-media.`);
    }
    layerMediaTags.forEach((tag) => {
      if (!/\bdata-image-slot=["']s05-layer-media["']/i.test(tag) || !/\bdata-media-role=["']technical-evidence["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S05 .stack-card-media must declare data-image-slot="s05-layer-media" and data-media-role="technical-evidence".`);
      }
      const isInset = /\bdata-media-fit=["']inset["']/i.test(tag) && /\bdata-media-contrast=["']none["']/i.test(tag);
      const isFullBleed = /\bdata-media-fit=["']full-bleed["']/i.test(tag) && /\bdata-media-contrast=["']darken["']/i.test(tag);
      if (!isInset && !isFullBleed) {
        errors.push(`Slide ${slide.idx}: S05 technical evidence must use either inset/none or full-bleed/darken media semantics.`);
      }
      if (isFullBleed && !/\bclass=["'][^"']*\bmedia-full-bleed\b/i.test(slide.html)) {
        errors.push(`Slide ${slide.idx}: S05 full-bleed media requires .media-full-bleed on its .stack-block.`);
      }
    });
  }

  if (layout === 'S19') {
    const bentoMediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass=["'][^"']*\bbento-hero-media\b[^"']*["'])[^>]*>/gi)].map((match) => match[0]);
    const mediaHeroes = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bhero\b[^"']*\bhas-media\b[^"']*["'])[^>]*>/gi)].length;
    if (bentoMediaTags.length > 1 || mediaHeroes > 1) {
      errors.push(`Slide ${slide.idx}: S19 Bento permits contextual media only in its single hero card.`);
    }
    if (bentoMediaTags.length !== mediaHeroes) {
      errors.push(`Slide ${slide.idx}: S19 .hero.has-media must contain exactly one .bento-hero-media.`);
    }
    bentoMediaTags.forEach((tag) => {
      if (!/\bdata-image-slot=["']s19-bento-hero-media["']/i.test(tag) || !/\bdata-media-role=["']context-evidence["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S19 .bento-hero-media must declare data-image-slot="s19-bento-hero-media" and data-media-role="context-evidence".`);
      }
      if (!/\bdata-media-fit=["']full-bleed["']/i.test(tag) || !/\bdata-media-contrast=["']darken["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S19 hero media must use data-media-fit="full-bleed" and data-media-contrast="darken" because inverse text sits directly on the image.`);
      }
    });
  }

  if (layout === 'S17') {
    const grammarTags = [...slide.html.matchAll(/<[^>]+\bdata-system-grammar=["'](flow|hierarchy|network|containment)["'][^>]*>/gi)];
    const nodeCount = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bsystem-node\b[^"']*["'])[^>]*>/gi)].length;
    const linkCount = [...slide.html.matchAll(/<div\b(?=[^>]*\bclass=["'][^"']*\bsystem-link\b[^"']*["'])[^>]*>/gi)].length;
    const classCount = (className) => [...slide.html.matchAll(new RegExp(`<[^>]+\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'gi'))].length;
    ['system-copy', 'system-kicker', 'system-thesis', 'system-summary'].forEach((className) => {
      const count = classCount(className);
      if (count !== 1) {
        errors.push(`Slide ${slide.idx}: S17 requires exactly one .${className}; found ${count}. Keep the left column to one audience-facing conclusion and one explanation.`);
      }
    });
    ['system-roles', 'system-role'].forEach((className) => {
      const count = classCount(className);
      if (count) {
        errors.push(`Slide ${slide.idx}: S17 forbids .${className}; the left column must not duplicate the stages already shown in the relationship graphic.`);
      }
    });
    if (/这里表达的是|不是[^<。！？]{0,12}套圈|图的目的是|(?:this|the)\s+(?:diagram|graphic)\s+(?:shows|means|is intended)/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S17 contains production-note wording. Rewrite visible copy for the audience instead of explaining how the diagram was made.`);
    }
    if (grammarTags.length !== 1) {
      errors.push(`Slide ${slide.idx}: S17 requires exactly one declared data-system-grammar="flow|hierarchy|network|containment". Choose the relationship before drawing it.`);
    } else {
      const grammar = grammarTags[0][1].toLowerCase();
      if (grammar === 'flow') {
        const flowCount = classCount('system-flow');
        if (flowCount !== 1) {
          errors.push(`Slide ${slide.idx}: S17 flow grammar requires exactly one .system-flow container; found ${flowCount}.`);
        }
        if (nodeCount < 3 || nodeCount > 6 || linkCount !== nodeCount - 1) {
          errors.push(`Slide ${slide.idx}: S17 flow grammar requires 3-6 .system-node entries and exactly nodeCount-1 .system-link connectors; found ${nodeCount} nodes and ${linkCount} links.`);
        }
        if (/<circle\b/i.test(slide.html)) {
          errors.push(`Slide ${slide.idx}: S17 flow grammar cannot use concentric circles. Use explicit directional nodes and links; reserve rings for data-system-grammar="containment".`);
        }
      }
      ['system-level', 'system-title', 'system-effect'].forEach((className) => {
        const count = [...slide.html.matchAll(new RegExp(`<[^>]+\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'gi'))].length;
        if (count !== nodeCount) {
          errors.push(`Slide ${slide.idx}: S17 requires one .${className} per system node; found ${count} for ${nodeCount} node(s).`);
        }
      });
    }
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
      errors.push(`Slide ${slide.idx}: XREAL closing must use class="slide accent" for the registered black-base back cover.`);
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
    errors.push(`Slide ${slide.idx}: legacy decorative background found. XREAL cover and closing may use only the black base or a semantically matched official media background.`);
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
    const titleBlockTag = slide.html.match(/<[^>]+\bdata-anim="title-block"[^>]*>/i)?.[0] ?? '';
    if (titleBlockTag && /background(?:-color)?\s*:|\b(?:card-fill|card-ink|card-accent|hero-overlay-block)\b/i.test(titleBlockTag)) {
      errors.push(`Slide ${slide.idx}: S22 image title must be direct high-contrast text. Remove the white/card/panel background from the title block and choose a readable text color or image crop.`);
    }
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

      const chromeGapChecks = (el) => Array.from(el.querySelectorAll('.chrome-min')).flatMap((node) => {
        const next = node.nextElementSibling;
        if (!next) return [];
        if (next.style.marginTop === 'auto' || next.style.marginBottom === 'auto') return [];
        const sameOffsetParent = node.offsetParent && node.offsetParent === next.offsetParent;
        const chromeRect = node.getBoundingClientRect();
        const nextRect = next.getBoundingClientRect();
        const gap = sameOffsetParent
          ? next.offsetTop - (node.offsetTop + node.offsetHeight)
          : nextRect.top - chromeRect.bottom;
        const tight = node.classList.contains('tight');
        const min = tight ? 12 : 20;
        const max = tight ? 24 : 32;
        return gap < min - 1 || gap > max + 1
          ? [{ node: labelFor(node), next: labelFor(next), gap: Math.round(gap), expected: `${min}-${max}px${tight ? ' tight' : ''}` }]
          : [];
      });

      const radiusChecks = (el) => Array.from(el.querySelectorAll([
          '.frame-img', '.card-fill', '.card-ink', '.card-accent', '.sub-card',
          '.stack-block', '.bar-tower .cap',
          '.h-bar-chart .row-track', '.h-bar-chart .row-fill',
          '.bar-row .bar-track', '.bar-row .bar-fill',
          '.hero-ink-col', '.force-card', '.brief-card',
          '.xreal-bento',
        ].join(','))).filter((node) => {
          const r = node.getBoundingClientRect();
          if (r.width < 20 || r.height < 20) return false;
          const radius = parseFloat(getComputedStyle(node).borderTopLeftRadius);
          return !Number.isFinite(radius) || radius < 7 || radius > 9;
        }).map((node) => ({
          node: labelFor(node),
          radius: getComputedStyle(node).borderTopLeftRadius,
        }));

      const s19BentoChecks = (el) => Array.from(el.querySelectorAll('.xreal-bento > article')).filter((node) => {
        const style = getComputedStyle(node);
        return [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomRightRadius,
          style.borderBottomLeftRadius,
        ].some((value) => Math.abs(parseFloat(value)) > .1);
      }).map((node) => ({
        node: labelFor(node),
        radii: [
          getComputedStyle(node).borderTopLeftRadius,
          getComputedStyle(node).borderTopRightRadius,
          getComputedStyle(node).borderBottomRightRadius,
          getComputedStyle(node).borderBottomLeftRadius,
        ].join(' '),
      }));

      const horizontalBarCapsuleChecks = (el) => Array.from(el.querySelectorAll([
        '.h-bar-chart .row-track', '.h-bar-chart .row-fill',
        '.bar-row .bar-track', '.bar-row .bar-fill',
      ].join(','))).filter((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return false;
        const radius = parseFloat(getComputedStyle(node).borderTopLeftRadius);
        return !Number.isFinite(radius) || radius >= rect.height / 2 - .25;
      }).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          node: labelFor(node),
          radius: getComputedStyle(node).borderTopLeftRadius,
          height: `${Math.round(rect.height)}px`,
        };
      });

      const equalCardPaddingChecks = (el) => Array.from(el.querySelectorAll('.sub-card,.brief-card')).filter((node) => {
        const style = getComputedStyle(node);
        const values = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat);
        return values.some((value) => !Number.isFinite(value)) || Math.max(...values) - Math.min(...values) > 1.25;
      }).map((node) => {
        const style = getComputedStyle(node);
        return {
          node: labelFor(node),
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].join(' '),
        };
      });

      const subCardCornerOffsetChecks = (el) => Array.from(el.querySelectorAll('.sub-card .nb-corner')).filter((node) => {
        const style = getComputedStyle(node);
        return Math.abs(parseFloat(style.top) - parseFloat(style.right)) > 1.25;
      }).map((node) => ({
        node: labelFor(node),
        top: getComputedStyle(node).top,
        right: getComputedStyle(node).right,
      }));

      const parseRgb = (value) => {
        const parts = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
        return parts.length === 3 ? parts : null;
      };
      const luminance = (rgb) => {
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      };
      const contrast = (a, b) => {
        const l1 = luminance(a);
        const l2 = luminance(b);
        return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
      };
      const briefContrastChecks = (el) => Array.from(el.querySelectorAll('.brief-card')).flatMap((node) => {
        const style = getComputedStyle(node);
        if (node.classList.contains('is-accent')) {
          const foreground = parseRgb(style.color);
          const background = parseRgb(style.backgroundColor);
          const ratio = foreground && background ? contrast(foreground, background) : 0;
          return ratio < 4.5 ? [{ node: labelFor(node), issue: `accent text contrast is ${ratio.toFixed(2)}:1` }] : [];
        }
        const borderWidth = parseFloat(style.borderTopWidth);
        return style.borderTopStyle === 'none' || !Number.isFinite(borderWidth) || borderWidth < .9
          ? [{ node: labelFor(node), issue: 'neutral card has no visible 1px boundary' }]
          : [];
      });

      const cardMediaChecks = (el) => Array.from(el.querySelectorAll('.card-media-slot,.stack-card-media,.bento-hero-media')).flatMap((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const parent = node.closest('article');
        const parentRect = parent?.getBoundingClientRect();
        const isBento = node.classList.contains('bento-hero-media');
        const mediaFit = node.dataset.mediaFit || '';
        const isFullBleed = mediaFit === 'full-bleed';
        const isProminent = mediaFit === 'inset-prominent';
        const expectedFit = isFullBleed || isProminent ? 'cover' : 'contain';
        const issues = [];
        if (style.objectFit !== expectedFit) issues.push(`object-fit is ${style.objectFit}; expected ${expectedFit}`);
        if (rect.width < 80 || rect.height < 48) issues.push(`rendered media is only ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
        if (isFullBleed) {
          const brightness = Number(style.filter.match(/brightness\(([^)]+)\)/)?.[1]);
          const scrimStyle = parent ? getComputedStyle(parent, '::after') : null;
          const scrimColor = scrimStyle?.backgroundColor || '';
          const scrimImage = scrimStyle?.backgroundImage || '';
          const scrimParts = scrimColor.match(/[\d.]+/g)?.map(Number) ?? [];
          const scrimAlpha = scrimParts.length >= 4 ? scrimParts[3] : (scrimParts.length === 3 ? 1 : NaN);
          if (style.position !== 'absolute') issues.push(`full-bleed media position is ${style.position}; expected absolute placement`);
          if (parentRect && (rect.width / parentRect.width < .95 || rect.height / parentRect.height < .95)) {
            issues.push(`full-bleed coverage is ${(rect.width / parentRect.width).toFixed(2)}× width and ${(rect.height / parentRect.height).toFixed(2)}× height; expected at least 95% on both axes`);
          }
          if (isBento && (!Number.isFinite(scrimAlpha) || scrimAlpha < .28 || scrimAlpha > .48)) {
            issues.push(`dark scrim alpha is ${Number.isFinite(scrimAlpha) ? scrimAlpha : scrimColor || 'missing'}; expected .28-.48`);
          }
          if (!isBento && scrimImage === 'none' && (!Number.isFinite(scrimAlpha) || scrimAlpha < .28)) {
            issues.push('S05 full-bleed media has no visible ::after scrim or gradient protecting its text');
          }
          if (!Number.isFinite(brightness) || brightness < .65 || brightness > .9) {
            issues.push(`image brightness is ${Number.isFinite(brightness) ? brightness : style.filter}; with a registered scrim it should stay within .65-.90 to preserve media detail`);
          }
          if (!isBento && !parent?.querySelector('.layer-icon')) {
            issues.push('S05 full-bleed media removed the .layer-icon; retain the semantic icon unless it conflicts with the media subject');
          }
        } else if (parentRect) {
          const heightRatio = rect.height / parentRect.height;
          const widthRatio = rect.width / parentRect.width;
          const minHeight = isProminent ? .28 : .18;
          if (heightRatio < minHeight || heightRatio > .45) {
            issues.push(`inset height is ${(heightRatio * 100).toFixed(1)}% of its card; expected ${Math.round(minHeight * 100)}%-45% so media remains legible without crowding text`);
          }
          if (isProminent && widthRatio < .8) {
            issues.push(`prominent inset width is ${(widthRatio * 100).toFixed(1)}% of its card; expected at least 80%`);
          }
        }
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const timelineChecks = (el) => Array.from(el.querySelectorAll('.timeline-v')).flatMap((timeline) => {
        const issues = [];
        const timelineRect = timeline.getBoundingClientRect();
        const canvasRect = el.querySelector('.canvas-card')?.getBoundingClientRect();
        if (canvasRect && timelineRect.width / canvasRect.width < .72) {
          issues.push(`timeline uses only ${(timelineRect.width / canvasRect.width * 100).toFixed(1)}% of canvas width; expected at least 72%`);
        }
        const expectedAxisX = timelineRect.left + parseFloat(getComputedStyle(timeline).getPropertyValue('--tl-axis-w')) / 2;
        timeline.querySelectorAll('.tl-node .dot').forEach((dot) => {
          const rect = dot.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          if (rect.width < 8 || rect.height < 8) issues.push(`timeline dot renders at only ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
          if (Math.abs(centerX - expectedAxisX) > 2.5) issues.push(`timeline dot is ${Math.abs(centerX - expectedAxisX).toFixed(1)}px off the axis center`);
        });
        return issues.map((issue) => ({ node: labelFor(timeline), issue }));
      });

      const productIdentityChecks = (el) => Array.from(el.querySelectorAll('.xreal-product-mark')).flatMap((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const issues = [];
        if (node.closest('.chrome-min')) issues.push('product mark is placed inside chrome-min; enterprise XREAL Logo owns the page chrome');
        if (style.objectFit !== 'contain') issues.push(`object-fit is ${style.objectFit}; expected contain to preserve the official mark`);
        if (rect.width < 240 || rect.height < 24) issues.push(`rendered product mark is only ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
        const manifestoBanner = node.closest('.ink-banner-full');
        if (el.dataset.layout === 'S12' && manifestoBanner) {
          const bannerRect = manifestoBanner.getBoundingClientRect();
          const widthRatio = bannerRect.width ? rect.width / bannerRect.width : 0;
          if (widthRatio < .18 || widthRatio > .26) {
            issues.push(`S12 manifesto mark uses ${(widthRatio * 100).toFixed(1)}% of the banner width; expected 18%-26% so it reads as an identity sign-off, not a second headline`);
          }
        }
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const closingMediaChecks = (el) => Array.from(el.querySelectorAll('.xreal-closing-media')).flatMap((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const slideRect = el.getBoundingClientRect();
        const brightness = Number(style.filter.match(/brightness\(([^)]+)\)/)?.[1]);
        const issues = [];
        if (style.objectFit !== 'cover') issues.push(`object-fit is ${style.objectFit}; expected cover`);
        if (rect.width / slideRect.width < .95 || rect.height / slideRect.height < .95) issues.push('media does not cover at least 95% of the closing slide on both axes');
        if (!Number.isFinite(brightness) || brightness < .18 || brightness > .48) issues.push(`brightness is ${Number.isFinite(brightness) ? brightness : style.filter}; expected .18-.48 so Thanks remains dominant without erasing the image`);
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const systemRelationshipChecks = (el) => Array.from(el.querySelectorAll('[data-system-grammar]')).flatMap((node) => {
        const rect = node.getBoundingClientRect();
        const canvasRect = el.querySelector('.canvas-card')?.getBoundingClientRect();
        const copyRect = el.querySelector('.system-copy')?.getBoundingClientRect();
        const issues = [];
        if (canvasRect && rect.width / canvasRect.width < .42) issues.push(`relationship graphic uses only ${(rect.width / canvasRect.width * 100).toFixed(1)}% of the canvas width; expected at least 42%`);
        if (copyRect && Math.abs(copyRect.top - rect.top) > 16) issues.push(`left conclusion and right relationship graphic start ${Math.abs(copyRect.top - rect.top).toFixed(1)}px apart; expected no more than 16px`);
        node.querySelectorAll('.system-node').forEach((systemNode) => {
          const nodeRect = systemNode.getBoundingClientRect();
          if (nodeRect.height < 56) issues.push(`system node renders at only ${Math.round(nodeRect.height)}px high`);
        });
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const unitAlignmentChecks = (el) => Array.from(el.querySelectorAll('.unit,.stat-unit,.unit-degree')).filter((node) => {
        const style = getComputedStyle(node);
        const fontSize = parseFloat(style.fontSize);
        const gapRatio = parseFloat(style.marginLeft) / fontSize;
        const opacity = parseFloat(style.opacity);
        const isDegree = node.classList.contains('unit-degree');
        const gapInvalid = isDegree ? gapRatio < .01 || gapRatio > .07 : gapRatio < .14 || gapRatio > .24;
        return style.verticalAlign !== 'text-top'
          || !Number.isFinite(opacity) || opacity < .58 || opacity > .68
          || !Number.isFinite(gapRatio) || gapInvalid;
      }).map((node) => {
        const style = getComputedStyle(node);
        return {
          node: labelFor(node),
          verticalAlign: style.verticalAlign,
          opacity: style.opacity,
          gapRatio: (parseFloat(style.marginLeft) / parseFloat(style.fontSize)).toFixed(2),
        };
      });

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
          return !Number.isFinite(topLeft) || topLeft < 7 || topLeft > 9
            || !Number.isFinite(topRight) || topRight < 7 || topRight > 9
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

      const dataChartChecks = (el) => {
        const plot = el.querySelector('.chart-plot');
        const bars = Array.from(el.querySelectorAll('.chart-bar'));
        if (!plot || !bars.length) return [];
        const issues = [];
        const plotRect = plot.getBoundingClientRect();
        const ordered = bars.slice().sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        const firstRect = ordered[0].getBoundingClientRect();
        const lastRect = ordered[ordered.length - 1].getBoundingClientRect();
        const leftGap = firstRect.left - plotRect.left;
        const rightGap = plotRect.right - lastRect.right;
        if (leftGap < 20 || rightGap < 20) {
          issues.push(`outer plot safety is ${leftGap.toFixed(1)}px left / ${rightGap.toFixed(1)}px right; expected at least 20px on both sides`);
        }
        bars.forEach((bar, index) => {
          const value = bar.querySelector('.chart-value');
          if (!value) return;
          const barRect = bar.getBoundingClientRect();
          const valueRect = value.getBoundingClientRect();
          const style = getComputedStyle(value);
          const centerDelta = Math.abs((valueRect.left + valueRect.width / 2) - (barRect.left + barRect.width / 2));
          const fullWidthCentered = Math.abs(parseFloat(style.left)) <= 1
            && Math.abs(parseFloat(style.right)) <= 1
            && style.textAlign === 'center';
          if (!fullWidthCentered || centerDelta > 2) {
            issues.push(`bar ${index + 1} value is ${centerDelta.toFixed(1)}px off center and uses left/right/text-align ${style.left}/${style.right}/${style.textAlign}; use a full-width centered label without horizontal transform`);
          }
          if (valueRect.top < plotRect.top - 1) {
            issues.push(`bar ${index + 1} value extends ${(plotRect.top - valueRect.top).toFixed(1)}px above the plot; reserve chart-value headroom`);
          }
        });
        return issues.map((issue) => ({ node: labelFor(plot), issue }));
      };

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
          chromeGapIssues: chromeGapChecks(el),
          radiusIssues: radiusChecks(el),
          s19BentoIssues: s19BentoChecks(el),
          horizontalBarCapsuleIssues: horizontalBarCapsuleChecks(el),
          equalCardPaddingIssues: equalCardPaddingChecks(el),
          subCardCornerOffsetIssues: subCardCornerOffsetChecks(el),
          briefContrastIssues: briefContrastChecks(el),
          cardMediaIssues: cardMediaChecks(el),
          timelineIssues: timelineChecks(el),
          productIdentityIssues: productIdentityChecks(el),
          closingMediaIssues: closingMediaChecks(el),
          systemRelationshipIssues: systemRelationshipChecks(el),
          unitAlignmentIssues: unitAlignmentChecks(el),
          baselineBarIssues: baselineBarChecks(el),
          dataChartIssues: dataChartChecks(el),
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
      for (const issue of m.chromeGapIssues) {
        errors.push(`${prefix}: ${issue.node} leaves ${issue.gap}px before ${issue.next}; expected ${issue.expected}. Keep the page header close to the first content block and remove stacked top margins that push the whole composition downward.`);
      }
      for (const issue of m.radiusIssues) {
        errors.push(`${prefix}: ${issue.node} uses ${issue.radius} corner radius. Card-like elements must use the shared 7-9px token (standard: --radius-sm:8px); page axes and dividers stay straight.`);
      }
      for (const issue of m.s19BentoIssues) {
        errors.push(`${prefix}: ${issue.node} uses inner corner radii ${issue.radii}. S19 Bento rounds only the overall .xreal-bento frame; every direct article must remain square.`);
      }
      for (const issue of m.horizontalBarCapsuleIssues) {
        errors.push(`${prefix}: ${issue.node} uses ${issue.radius} radius at ${issue.height} height. Horizontal bars must remain rounded rectangles, not capsules; increase bar height so radius stays below half the height.`);
      }
      for (const issue of m.equalCardPaddingIssues) {
        errors.push(`${prefix}: ${issue.node} uses padding ${issue.padding}. S04/S16 cards must use one shared token so top, right, bottom, and left padding are equal.`);
      }
      for (const issue of m.subCardCornerOffsetIssues) {
        errors.push(`${prefix}: ${issue.node} uses top ${issue.top} and right ${issue.right}. S04 corner numbers must use the same --sub-card-pad offset on both axes.`);
      }
      for (const issue of m.briefContrastIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Multi-card Brief requires visible neutral-card boundaries; when semantic emphasis is justified, its single accent card must keep high-contrast inverse text.`);
      }
      for (const issue of m.cardMediaIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Card media must use its registered scale: S04 supports inset or prominent inset, S05 supports inset or darkened full-bleed media with its icon retained, and S19 uses a darkened full-bleed hero image.`);
      }
      for (const issue of m.timelineIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S02 must read as a directed timeline with visible aligned nodes, shared metric columns, and explicit stage meaning.`);
      }
      for (const issue of m.productIdentityIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Use the official product mark in product-identity slots while keeping the enterprise XREAL Logo in page chrome; on S12 it remains a subordinate identity sign-off.`);
      }
      for (const issue of m.closingMediaIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Closing media should be a low-interference atmosphere layer behind Thanks, not a product display.`);
      }
      for (const issue of m.systemRelationshipIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S17 must use a top-aligned left conclusion and one dominant relationship structure, not competing information tracks.`);
      }
      for (const issue of m.unitAlignmentIssues) {
        errors.push(`${prefix}: ${issue.node} uses vertical-align ${issue.verticalAlign}, opacity ${issue.opacity}, and gap ${issue.gapRatio}em. KPI/chart units must use the shared upper-right shoulder, .62 neutral opacity, .18em text-unit gap, or .03em degree gap.`);
      }
      for (const issue of m.baselineBarIssues) {
        errors.push(`${prefix}: ${issue.node} uses corner radii ${issue.radii}. Baseline bars may round only the top corners (7-9px); bottom corners must be square and flush to the x-axis.`);
      }
      for (const issue of m.dataChartIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S23 plots must protect edge bars and top labels, and every value must stay centered through the chart-rise animation.`);
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
