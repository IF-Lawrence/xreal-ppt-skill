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
  'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17',
  'S18', 'S19', 'S20', 'S21', 'S22', 'S23', 'S24', 'S25', 'S26', 'S27', 'S28',
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
const contentMode = htmlForSlides.match(/<body\b[^>]*\bdata-content-mode=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
const allowedContentModes = new Set(['source-faithful', 'editorial-summary', 'brief-generated']);
const sourceMode = contentMode === 'source-faithful' || contentMode === 'editorial-summary';
let coverageSummary = null;

if (!allowedContentModes.has(contentMode)) {
  errors.push('Content mode missing or invalid: <body> must declare data-content-mode="source-faithful|editorial-summary|brief-generated".');
}

const slideIds = new Map();
const duplicateSlideIds = new Set();
const slideRefsById = new Map();
for (const slide of slides) {
  const slideId = slide.tag.match(/\bid=["']([^"']+)["']/i)?.[1] ?? '';
  const sourceRefs = (slide.tag.match(/\bdata-source-refs=["']([^"']*)["']/i)?.[1] ?? '')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (slideId) {
    if (slideIds.has(slideId)) duplicateSlideIds.add(slideId);
    slideIds.set(slideId, slide.idx);
    slideRefsById.set(slideId, new Set(sourceRefs));
  } else if (sourceRefs.length) {
    errors.push(`Slide ${slide.idx}: data-source-refs requires a stable section id.`);
  }
}
if (duplicateSlideIds.size) {
  errors.push(`Content coverage mismatch: duplicate slide id(s): ${[...duplicateSlideIds].join(', ')}.`);
}

if (sourceMode) {
  const coveragePath = path.join(deckDir, 'content-coverage.json');
  if (!existsSync(coveragePath)) {
    errors.push(`Content coverage missing: ${contentMode} mode requires ${coveragePath}.`);
  } else {
    try {
      const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
      const items = Array.isArray(coverage.items) ? coverage.items : [];
      if (coverage.version !== 1) {
        errors.push('Content coverage mismatch: content-coverage.json version must be 1.');
      }
      if (coverage.mode !== contentMode) {
        errors.push(`Content coverage mismatch: manifest mode "${coverage.mode ?? ''}" does not match body data-content-mode="${contentMode}".`);
      }
      if (!items.length) {
        errors.push('Content coverage mismatch: source mode requires at least one source item.');
      }

      const itemIds = new Set();
      const itemDispositionById = new Map();
      let includedCount = 0;
      let omittedCount = 0;
      for (const [index, item] of items.entries()) {
        const itemLabel = `content-coverage.json item ${index + 1}`;
        if (!/^SRC-\d{3,}$/i.test(item?.id ?? '')) {
          errors.push(`${itemLabel}: id must use SRC-001 format.`);
          continue;
        }
        if (itemIds.has(item.id)) {
          errors.push(`${itemLabel}: duplicate source id ${item.id}.`);
          continue;
        }
        itemIds.add(item.id);
        itemDispositionById.set(item.id, item.disposition);
        if (typeof item.label !== 'string' || !item.label.trim()) {
          errors.push(`${itemLabel}: label is required for auditability.`);
        }
        if (!['claim', 'data', 'constraint', 'example', 'quote', 'decision', 'action', 'context'].includes(item.kind)) {
          errors.push(`${itemLabel}: kind must be claim, data, constraint, example, quote, decision, action, or context.`);
        }
        if (item.disposition === 'included') {
          includedCount += 1;
          if (!Array.isArray(item.slideIds) || !item.slideIds.length) {
            errors.push(`${itemLabel}: included source item ${item.id} requires at least one slideIds entry.`);
          } else {
            for (const slideId of item.slideIds) {
              if (!slideIds.has(slideId)) {
                errors.push(`${itemLabel}: source item ${item.id} references missing slide id "${slideId}".`);
              } else if (!slideRefsById.get(slideId)?.has(item.id)) {
                errors.push(`${itemLabel}: slide "${slideId}" must include ${item.id} in data-source-refs.`);
              }
            }
          }
        } else if (item.disposition === 'omitted') {
          omittedCount += 1;
          if (typeof item.reason !== 'string' || !item.reason.trim()) {
            errors.push(`${itemLabel}: omitted source item ${item.id} requires a specific reason.`);
          }
          if (contentMode === 'source-faithful' && item.userApproved !== true) {
            errors.push(`${itemLabel}: source-faithful mode cannot omit ${item.id} without userApproved:true.`);
          }
        } else {
          errors.push(`${itemLabel}: disposition must be included or omitted.`);
        }
      }

      for (const [slideId, refs] of slideRefsById.entries()) {
        for (const ref of refs) {
          if (!itemIds.has(ref)) {
            errors.push(`Content coverage mismatch: slide "${slideId}" references unknown source id ${ref}.`);
          } else if (itemDispositionById.get(ref) !== 'included') {
            errors.push(`Content coverage mismatch: slide "${slideId}" references ${ref}, but that item is marked omitted.`);
          }
        }
      }
      coverageSummary = { total: items.length, included: includedCount, omitted: omittedCount };
    } catch (error) {
      errors.push(`Content coverage unreadable: ${error.message}`);
    }
  }
}

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
const hasJapaneseKana = /[\u3040-\u309f\u30a0-\u30ff\u31f0-\u31ff\uff66-\uff9d]/u.test(slideText);
const hasHanContent = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(slideText);
const isJapaneseDeck = documentLang.startsWith('ja');
const isChineseDeck = documentLang.startsWith('zh');
const isEnglishDeck = documentLang.startsWith('en');

if (hasJapaneseKana && !isJapaneseDeck) {
  errors.push('Font context mismatch: Japanese or Japanese-English deck must use <html lang="ja"> so the whole deck uses IBM Plex Sans JP.');
}
if (!isJapaneseDeck && hasHanContent && !isChineseDeck) {
  errors.push('Font context mismatch: Chinese or mixed-language deck must use <html lang="zh-CN"> so the whole deck uses IBM Plex Sans SC.');
}
if (!hasJapaneseKana && !hasHanContent && !isEnglishDeck) {
  errors.push('Font context mismatch: all-English deck must use <html lang="en"> so the whole deck uses XREAL Diatype.');
}

const japaneseTypographyBlock = htmlForStatic.match(/html\[lang\^?=["']ja["']\]\s*\{([^}]*)\}/i)?.[1] ?? '';
const japaneseFontFaces = [...htmlForStatic.matchAll(/@font-face\s*\{[^}]*font-family\s*:\s*["']IBM Plex Sans JP["'][^}]*\}/gi)];
if (isJapaneseDeck) {
  if (japaneseFontFaces.length < 8) {
    errors.push(`Japanese font bundle mismatch: expected 8 IBM Plex Sans JP @font-face declarations; found ${japaneseFontFaces.length}.`);
  }
  if (!/--font-ibm-plex-jp\s*:\s*["']IBM Plex Sans JP["']/i.test(htmlForStatic)) {
    errors.push('Japanese font token missing: define --font-ibm-plex-jp with IBM Plex Sans JP.');
  }
  if (!/--deck-font\s*:\s*var\(--font-ibm-plex-jp\)/i.test(japaneseTypographyBlock)) {
    errors.push('Japanese typography context missing: html[lang^="ja"] must set --deck-font to var(--font-ibm-plex-jp).');
  }
}

const englishTypographyBlock = htmlForStatic.match(/html\[lang\^?=["']en["']\]\s*\{([^}]*)\}/i)?.[1] ?? '';
const englishChromeRatio = Number(englishTypographyBlock.match(/--chrome-label-optical-ratio\s*:\s*([0-9.]+)/i)?.[1]);
if (isEnglishDeck && (!Number.isFinite(englishChromeRatio) || englishChromeRatio < 0.305 || englishChromeRatio > 0.32)) {
  errors.push('English chrome mismatch: XREAL Diatype needs --chrome-label-optical-ratio around .313 so adjacent labels match the XREAL Logo visual height.');
}
if (isEnglishDeck) {
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
  errors.push('Typography hierarchy mismatch: use the fixed role weights only—English display/title/key data 500; Chinese/Japanese or mixed display/title/key data 600; body 400; support text 400/450; labels 500; one core datum may use 700.');
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

  if (isChineseDeck || isJapaneseDeck) {
    const headingBlocks = [...slide.html.matchAll(/<h[1-3]\b[^>]*>[\s\S]*?<\/h[1-3]>/gi)].map((match) => match[0]);
    const italicCjkHeadings = headingBlocks.filter((block) => /<(?:i|em)\b|font-style\s*:\s*italic/i.test(block));
    if (italicCjkHeadings.length) {
      errors.push(`Slide ${slide.idx}: Chinese and Japanese titles must remain upright. Remove <i>, <em>, or font-style:italic from heading content.`);
    }
  }

  if (/\b\d{1,2}\s*\/\s*(?:\d{1,2}|NN)\b/i.test(visibleText)) {
    errors.push(`Slide ${slide.idx}: visible page number found. XREAL Style uses navigation dots for order and does not render XX / NN counters.`);
  }

  if (!layout) {
    errors.push(`Slide ${slide.idx}: missing data-layout. XREAL Style locked mode requires a registered layout (S01-S08 or S11-S28) or XREAL-COVER-BLACK/XREAL-CLOSING-BLACK.`);
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

  if (layout === 'S07') {
    const labelCount = [...slide.html.matchAll(/<span\b(?=[^>]*\bclass=["'][^"']*\brow-lbl\b[^"']*["'])[^>]*>/gi)].length;
    const trackCount = [...slide.html.matchAll(/<span\b(?=[^>]*\bclass=["'][^"']*\brow-track\b[^"']*["'])[^>]*>/gi)].length;
    const fillTags = [...slide.html.matchAll(/<span\b(?=[^>]*\bclass=["'][^"']*\brow-fill\b[^"']*["'])[^>]*>/gi)].map((match) => match[0]);
    const valueCount = [...slide.html.matchAll(/<span\b(?=[^>]*\bclass=["'][^"']*\brow-val\b[^"']*["'])[^>]*>/gi)].length;
    if (labelCount < 5 || labelCount > 10 || trackCount !== labelCount || fillTags.length !== labelCount || valueCount !== labelCount) {
      errors.push(`Slide ${slide.idx}: S07 requires 5-10 complete label + track + fill + value rows; found ${labelCount}/${trackCount}/${fillTags.length}/${valueCount}.`);
    }
    fillTags.forEach((tag, index) => {
      const value = Number(tag.match(/--value\s*:\s*([0-9.]+)%/)?.[1]);
      if (!Number.isFinite(value) || value <= 0 || value > 100) {
        errors.push(`Slide ${slide.idx}: S07 row ${index + 1} must store its persistent width in --value:1%-100%; do not animate by overwriting inline width.`);
      }
      if (/\bwidth\s*:/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S07 row ${index + 1} uses inline width. Use --value so the bar remains visible after animation and in static mode.`);
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

  if (layout === 'S12') {
    const manifestoMediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass=["'][^"']*\bmanifesto-media\b[^"']*["'])[^>]*>/gi)].map((match) => match[0]);
    if (manifestoMediaTags.length > 1) {
      errors.push(`Slide ${slide.idx}: S12 permits at most one contextual manifesto background; found ${manifestoMediaTags.length}.`);
    }
    manifestoMediaTags.forEach((tag) => {
      if (!/\bdata-image-slot=["']s12-manifesto-background["']/i.test(tag) || !/\bdata-media-role=["']context-background["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S12 .manifesto-media must declare data-image-slot="s12-manifesto-background" and data-media-role="context-background".`);
      }
      if (!/\bdata-media-kind=["'](?:lifestyle|conceptual|brand-kv)["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S12 background media must be lifestyle, conceptual, or brand-kv; product cutouts and packshots are not permitted.`);
      }
      if (!/\bdata-media-fit=["']full-bleed["']/i.test(tag) || !/\bdata-media-contrast=["']darken["']/i.test(tag)) {
        errors.push(`Slide ${slide.idx}: S12 background media must use data-media-fit="full-bleed" and data-media-contrast="darken".`);
      }
    });
  }

  if (layout === 'S15') {
    const matrixCount = [...slide.html.matchAll(/<[^>]+\bclass=["'][^"']*\bmatrix-cell\b[^"']*["'][^>]*>/gi)].length;
    const fillCount = [...slide.html.matchAll(/<[^>]+\bclass=["'][^"']*\bmatrix-fill\b[^"']*["'][^>]*>/gi)].length;
    const statCount = [...slide.html.matchAll(/<[^>]+\bclass=["'][^"']*\bhero-stat-bottom\b[^"']*["'][^>]*>/gi)].length;
    if (fillCount !== 1 || statCount !== 1 || matrixCount < 6 || matrixCount > 16) {
      errors.push(`Slide ${slide.idx}: S15 requires one flexible .matrix-fill with 6-16 cells and one .hero-stat-bottom; found ${fillCount} fill / ${matrixCount} cells / ${statCount} stat.`);
    }
  }

  if (layout === 'S14') {
    const classCount = (className) => [...slide.html.matchAll(new RegExp(`<[^>]+\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'gi'))].length;
    const nodeCount = classCount('loop-node');
    const declaredNodeCount = Number(slide.html.match(/<[^>]+\bclass=["'][^"']*\bloop-visual\b[^"']*["'][^>]*\bdata-loop-count=["']([3-5])["'][^>]*>/i)?.[1]);
    const segmentCount = classCount('loop-segment');
    const returnCount = [...slide.html.matchAll(/<[^>]+\bclass=["'][^"']*\bloop-segment\b[^"']*\breturn\b[^"']*["'][^>]*>/gi)].length;
    if (nodeCount < 3 || nodeCount > 5) errors.push(`Slide ${slide.idx}: S14 requires 3-5 HTML .loop-node labels; found ${nodeCount}.`);
    if (declaredNodeCount !== nodeCount) errors.push(`Slide ${slide.idx}: S14 .loop-visual must declare data-loop-count matching its HTML nodes; declared ${Number.isFinite(declaredNodeCount) ? declaredNodeCount : 'none'}, found ${nodeCount}.`);
    if (classCount('loop-core') !== 1) errors.push(`Slide ${slide.idx}: S14 requires exactly one .loop-core conclusion.`);
    if (classCount('loop-track') !== 1 || segmentCount < 4) errors.push(`Slide ${slide.idx}: S14 requires one low-contrast .loop-track and at least four directional .loop-segment paths.`);
    if (returnCount > 1) errors.push(`Slide ${slide.idx}: S14 permits red emphasis only on one semantic return segment; found ${returnCount}.`);
    if (/<circle\b/i.test(slide.html) || /\bloop-(?:dot|label|ring)\b/i.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S14 uses the retired coarse circle/dot/external-label grammar. Use one fine loop, HTML nodes, and a center conclusion.`);
    }
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

  const isStatement = layout === 'S03' || layout === 'XREAL-COVER-BLACK' || layout === 'XREAL-CLOSING-BLACK';
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
    const requiredClasses = ['xreal-line-chart', 'chart-unit', 'chart-legend', 'line-stage', 'chart-y-labels', 'line-plot', 'line-geometry', 'line-chart-svg', 'chart-line', 'line-x-labels', 'line-end-label', 'chart-source'];
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

  if (layout === 'S25') {
    const requiredClasses = ['portfolio-roadmap', 'roadmap-year-axis', 'roadmap-y-axis', 'roadmap-plot', 'roadmap-source'];
    const missing = requiredClasses.filter((name) => !new RegExp(`\\b${name}\\b`).test(slide.html));
    if (missing.length) {
      errors.push(`Slide ${slide.idx}: S25 Portfolio Roadmap Matrix is missing required structure (${missing.map((name) => `.${name}`).join(', ')}).`);
    }
    if (!/\bdata-animate="portfolio-roadmap"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: S25 Portfolio Roadmap Matrix must use data-animate="portfolio-roadmap".`);
    }
    const periodCount = [...slide.html.matchAll(/\bclass="[^"]*\broadmap-period\b[^"]*"/g)].length;
    const laneCount = [...slide.html.matchAll(/\bclass="[^"]*\broadmap-lane\b[^"]*"/g)].length;
    const itemTags = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass="[^"]*\broadmap-item\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    const mediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass="[^"]*\broadmap-media\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    const titleCount = [...slide.html.matchAll(/\bclass="[^"]*\broadmap-title\b[^"]*"/g)].length;
    const metaCount = [...slide.html.matchAll(/\bclass="[^"]*\broadmap-meta\b[^"]*"/g)].length;
    const criticalCount = itemTags.filter((tag) => /\bcritical\b/.test(tag)).length;
    if (periodCount < 2 || periodCount > 4) errors.push(`Slide ${slide.idx}: S25 requires 2-4 .roadmap-period labels; found ${periodCount}.`);
    if (laneCount < 2 || laneCount > 4) errors.push(`Slide ${slide.idx}: S25 requires 2-4 .roadmap-lane bands; found ${laneCount}.`);
    if (itemTags.length < 3 || itemTags.length > 7) errors.push(`Slide ${slide.idx}: S25 requires 3-7 .roadmap-item nodes; found ${itemTags.length}.`);
    if (mediaTags.length !== itemTags.length || titleCount !== itemTags.length || metaCount !== itemTags.length) {
      errors.push(`Slide ${slide.idx}: every S25 item needs one .roadmap-media, .roadmap-title, and .roadmap-meta; found ${itemTags.length} items / ${mediaTags.length} media / ${titleCount} titles / ${metaCount} meta labels.`);
    }
    mediaTags.forEach((tag, index) => {
      if (!/\bdata-image-slot="s25-roadmap-media"/.test(tag) || !/\bdata-media-role="roadmap-evidence"/.test(tag) || !/\bdata-media-fit="(?:cover|contain)"/.test(tag) || !/\bdata-media-contrast="none"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: S25 media ${index + 1} must declare the registered slot, roadmap-evidence role, cover|contain fit, and contrast="none".`);
      }
    });
    itemTags.forEach((tag, index) => {
      for (const key of ['x', 'y', 'w', 'h']) {
        if (!new RegExp(`--${key}\\s*:\\s*[0-9.]+`).test(tag)) errors.push(`Slide ${slide.idx}: S25 item ${index + 1} must declare percentage --${key}.`);
      }
    });
    if (criticalCount > 1) errors.push(`Slide ${slide.idx}: S25 allows at most one semantically justified .critical node; found ${criticalCount}.`);
    if (!/illustrative|示意|scenario/i.test(slide.html)) errors.push(`Slide ${slide.idx}: S25 must identify whether roadmap positions are illustrative/scenario or sourced facts.`);
    if (/\bclass="[^"]*\b(?:pill|badge|chip|tab|ribbon)\b[^"]*"/i.test(slide.html)) errors.push(`Slide ${slide.idx}: S25 contains dashboard/pill component classes. Keep the roadmap flat and structural.`);
  }

  if (layout === 'S26') {
    const requiredClasses = ['milestone-gallery', 'milestone-synthesis', 'milestone-chain', 'milestone-source'];
    const missing = requiredClasses.filter((name) => !new RegExp(`\\b${name}\\b`).test(slide.html));
    if (missing.length) {
      errors.push(`Slide ${slide.idx}: S26 Milestone Gallery is missing required structure (${missing.map((name) => `.${name}`).join(', ')}).`);
    }
    if (!/\bdata-animate="milestone-gallery"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: S26 Milestone Gallery must use data-animate="milestone-gallery".`);
    }
    const entryCount = [...slide.html.matchAll(/\bclass="[^"]*\bmilestone-entry\b[^"]*"/g)].length;
    const yearCount = [...slide.html.matchAll(/\bclass="[^"]*\bmilestone-year\b[^"]*"/g)].length;
    const mediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass="[^"]*\bmilestone-media\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    const titleCount = [...slide.html.matchAll(/\bclass="[^"]*\bmilestone-title\b[^"]*"/g)].length;
    const copyCount = [...slide.html.matchAll(/\bclass="[^"]*\bmilestone-copy\b[^"]*"/g)].length;
    const chainCount = [...slide.html.matchAll(/\bclass="[^"]*\bmilestone-chain-step\b[^"]*"/g)].length;
    if (entryCount < 4 || entryCount > 6) errors.push(`Slide ${slide.idx}: S26 requires 4-6 .milestone-entry columns; found ${entryCount}.`);
    if ([mediaTags.length, titleCount, copyCount].some((count) => count !== entryCount)) {
      errors.push(`Slide ${slide.idx}: every S26 entry needs one media item, title, and copy; found ${entryCount} entries / ${mediaTags.length} media / ${titleCount} titles / ${copyCount} copy blocks.`);
    }
    if (yearCount !== 0 && yearCount !== entryCount) {
      errors.push(`Slide ${slide.idx}: optional .milestone-year labels must appear on every entry or be removed from the whole gallery; found ${yearCount} for ${entryCount} entries.`);
    }
    if (chainCount < 3 || chainCount > 6) errors.push(`Slide ${slide.idx}: S26 requires 3-6 .milestone-chain-step labels; found ${chainCount}.`);
    mediaTags.forEach((tag, index) => {
      if (!/\bdata-image-slot="s26-milestone-media"/.test(tag) || !/\bdata-media-role="milestone-evidence"/.test(tag) || !/\bdata-media-fit="(?:cover|contain)"/.test(tag) || !/\bdata-media-contrast="none"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: S26 media ${index + 1} must declare the registered slot, milestone-evidence role, cover|contain fit, and contrast="none".`);
      }
    });
    if (/\bclass="[^"]*\b(?:pill|badge|tab|button|ribbon)\b[^"]*"/i.test(slide.html)) errors.push(`Slide ${slide.idx}: S26 contains button/ribbon component classes. Use aligned small-radius cards and a hairline synthesis chain.`);
  }

  if (layout === 'S27') {
    const classCount = (name, source = slide.html) => [...source.matchAll(/\bclass="([^"]*)"/g)]
      .filter((match) => match[1].split(/\s+/).includes(name)).length;
    const requiredOnce = ['dense-synthesis', 'dense-thesis', 'dense-columns', 'dense-source'];
    requiredOnce.forEach((name) => {
      const count = classCount(name);
      if (count !== 1) errors.push(`Slide ${slide.idx}: S27 requires exactly one .${name}; found ${count}.`);
    });
    if (!/\bdata-animate="dense-synthesis"/.test(slide.tag)) {
      errors.push(`Slide ${slide.idx}: S27 Dense Synthesis must use data-animate="dense-synthesis".`);
    }
    const panelBlocks = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass="[^"]*\bdense-panel\b[^"]*")[^>]*>([\s\S]*?)<\/article>/g)].map((match) => match[1]);
    const panelCount = panelBlocks.length;
    const titleCount = classCount('dense-panel-title');
    const bodyCount = classCount('dense-panel-body');
    const itemCount = classCount('dense-item');
    const focusCount = [...slide.html.matchAll(/\bclass="([^"]*)"/g)].filter((match) => {
      const classes = match[1].split(/\s+/);
      return classes.includes('dense-item') && classes.includes('is-focus');
    }).length;
    const mediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass="[^"]*\bdense-media\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    if (panelCount !== 3 || titleCount !== 3 || bodyCount !== 3) {
      errors.push(`Slide ${slide.idx}: S27 requires 3 complete .dense-panel regions; found ${panelCount} panels / ${titleCount} titles / ${bodyCount} bodies.`);
    }
    if (itemCount < 7 || itemCount > 12) errors.push(`Slide ${slide.idx}: S27 requires 7-12 .dense-item blocks; found ${itemCount}.`);
    panelBlocks.forEach((panel, index) => {
      const count = classCount('dense-item', panel);
      if (count < 2) errors.push(`Slide ${slide.idx}: S27 panel ${index + 1} has only ${count} .dense-item block(s); each panel needs at least 2.`);
    });
    if (focusCount > 1) errors.push(`Slide ${slide.idx}: S27 allows at most one semantically justified .is-focus item; found ${focusCount}.`);
    if (mediaTags.length > 1) errors.push(`Slide ${slide.idx}: S27 allows at most one semantic media item; found ${mediaTags.length}.`);
    mediaTags.forEach((tag) => {
      if (!/\bdata-image-slot="s27-dense-media"/.test(tag) || !/\bdata-media-role="dense-evidence"/.test(tag) || !/\bdata-media-fit="cover"/.test(tag) || !/\bdata-media-contrast="darken"/.test(tag)) {
        errors.push(`Slide ${slide.idx}: S27 media must declare the dense slot, dense-evidence role, cover fit, and contrast="darken" for the registered focus background.`);
      }
    });
    if (/\bclass="[^"]*\b(?:pill|badge|chip|tab|button|ribbon)\b[^"]*"/i.test(slide.html)) errors.push(`Slide ${slide.idx}: S27 contains dashboard/control classes. Keep the dense synthesis editorial and structural.`);
  }

  if (layout === 'S28') {
    const classCount = (name) => [...slide.html.matchAll(/\bclass="([^"]*)"/g)]
      .filter((match) => match[1].split(/\s+/).includes(name)).length;
    if (classCount('priority-bento') !== 1) errors.push(`Slide ${slide.idx}: S28 requires exactly one .priority-bento.`);
    if (classCount('priority-source') !== 1) errors.push(`Slide ${slide.idx}: S28 requires exactly one .priority-source.`);
    if (!/\bdata-animate="priority-bento"/.test(slide.tag)) errors.push(`Slide ${slide.idx}: S28 Priority Bento must use data-animate="priority-bento".`);
    const bentoTag = slide.html.match(/<div\b(?=[^>]*\bclass="[^"]*\bpriority-bento\b[^"]*")[^>]*>/)?.[0] ?? '';
    const variant = bentoTag.match(/\bdata-bento-variant="([^"]+)"/)?.[1] ?? '';
    const allowedVariants = new Set(['left-focus', 'right-focus', 'panorama', 'center-focus']);
    if (!allowedVariants.has(variant)) errors.push(`Slide ${slide.idx}: S28 .priority-bento must declare data-bento-variant="left-focus|right-focus|panorama|center-focus".`);
    const tileTags = [...slide.html.matchAll(/<article\b(?=[^>]*\bclass="[^"]*\bpriority-tile\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    const primaryTags = tileTags.filter((tag) => /\bclass="[^"]*\bis-primary\b/.test(tag));
    const secondaryTags = tileTags.filter((tag) => /\bclass="[^"]*\bis-secondary\b/.test(tag));
    const supportTags = tileTags.filter((tag) => /\bclass="[^"]*\bis-support\b/.test(tag));
    if (tileTags.length < 5 || tileTags.length > 9) errors.push(`Slide ${slide.idx}: S28 requires 5-9 .priority-tile cards; found ${tileTags.length}.`);
    if (primaryTags.length !== 1) errors.push(`Slide ${slide.idx}: S28 requires exactly one .priority-tile.is-primary; found ${primaryTags.length}.`);
    if (secondaryTags.length < 1 || secondaryTags.length > 4) errors.push(`Slide ${slide.idx}: S28 requires 1-4 .priority-tile.is-secondary cards; found ${secondaryTags.length}.`);
    if (supportTags.length < 2) errors.push(`Slide ${slide.idx}: S28 requires at least 2 .priority-tile.is-support cards; found ${supportTags.length}.`);
    if (primaryTags.length + secondaryTags.length + supportTags.length !== tileTags.length) errors.push(`Slide ${slide.idx}: every S28 tile must declare exactly one hierarchy role: is-primary, is-secondary, or is-support.`);
    const placements = tileTags.map((tag, index) => {
      const read = (name) => Number(tag.match(new RegExp(`--${name}\\s*:\\s*(\\d+)`))?.[1]);
      const box = { index: index + 1, col: read('col'), span: read('span'), row: read('row'), rows: read('rows') };
      if (Object.values(box).slice(1).some((value) => !Number.isInteger(value))) errors.push(`Slide ${slide.idx}: S28 tile ${index + 1} must declare integer --col/--span/--row/--rows values.`);
      if (box.col < 1 || box.span < 1 || box.row < 1 || box.rows < 1 || box.col + box.span - 1 > 12 || box.row + box.rows - 1 > 6) errors.push(`Slide ${slide.idx}: S28 tile ${index + 1} falls outside the registered 12x6 grid.`);
      return box;
    });
    placements.forEach((a, index) => placements.slice(index + 1).forEach((b) => {
      const overlap = a.col < b.col + b.span && a.col + a.span > b.col && a.row < b.row + b.rows && a.row + a.rows > b.row;
      if (overlap) errors.push(`Slide ${slide.idx}: S28 tiles ${a.index} and ${b.index} overlap in the 12x6 grid.`);
    }));
    const areaKinds = new Set(placements.map((box) => box.span * box.rows));
    if (areaKinds.size < 3) errors.push(`Slide ${slide.idx}: S28 needs at least 3 distinct card areas; found ${areaKinds.size}.`);
    const primaryIndex = tileTags.findIndex((tag) => /\bclass="[^"]*\bis-primary\b/.test(tag));
    if (primaryIndex >= 0) {
      const primary = placements[primaryIndex];
      const ratio = primary.span * primary.rows / 72;
      if (primary.span < 3 || primary.rows < 3 || ratio < .25 || ratio > .5) errors.push(`Slide ${slide.idx}: S28 primary tile must be at least 3x3 and occupy 25%-50% of the grid; found ${primary.span}x${primary.rows} (${(ratio * 100).toFixed(1)}%).`);
      const primaryLeft = primary.col - 1;
      const primaryRight = primaryLeft + primary.span;
      const primaryMid = (primaryLeft + primaryRight) / 2;
      const otherPlacements = placements.filter((_, index) => index !== primaryIndex);
      if (variant === 'left-focus' && (primaryMid >= 6 || !otherPlacements.some((box) => box.col - 1 >= primaryRight))) {
        errors.push(`Slide ${slide.idx}: S28 left-focus requires the primary tile to sit left of center with supporting evidence to its right.`);
      }
      if (variant === 'right-focus' && (primaryMid <= 6 || !otherPlacements.some((box) => box.col - 1 + box.span <= primaryLeft))) {
        errors.push(`Slide ${slide.idx}: S28 right-focus requires the primary tile to sit right of center with supporting evidence to its left.`);
      }
      if (variant === 'panorama' && (primary.span < 9 || primary.rows > 3)) {
        errors.push(`Slide ${slide.idx}: S28 panorama requires a wide primary tile spanning at least 9 columns and no more than 3 rows.`);
      }
      if (variant === 'center-focus') {
        const crossesCenter = primaryLeft < 6 && primaryRight > 6;
        const hasLeftEvidence = otherPlacements.some((box) => box.col - 1 + box.span <= primaryLeft);
        const hasRightEvidence = otherPlacements.some((box) => box.col - 1 >= primaryRight);
        if (!crossesCenter || !hasLeftEvidence || !hasRightEvidence) errors.push(`Slide ${slide.idx}: S28 center-focus requires a centered primary tile with non-primary evidence on both sides.`);
      }
    }
    const mediaTags = [...slide.html.matchAll(/<img\b(?=[^>]*\bclass="[^"]*\bpriority-media\b[^"]*")[^>]*>/g)].map((match) => match[0]);
    if (mediaTags.length < 1 || mediaTags.length > 4) errors.push(`Slide ${slide.idx}: S28 requires 1-4 semantic media items; found ${mediaTags.length}.`);
    mediaTags.forEach((tag, index) => {
      const fit = tag.match(/\bdata-media-fit="(cover|contain)"/)?.[1];
      const contrast = tag.match(/\bdata-media-contrast="(darken|none)"/)?.[1];
      if (!/\bdata-image-slot="s28-priority-media"/.test(tag) || !/\bdata-media-role="feature-evidence"/.test(tag) || !fit || !contrast) errors.push(`Slide ${slide.idx}: S28 media ${index + 1} must declare the registered slot, feature-evidence role, fit, and contrast.`);
      if ((fit === 'cover' && contrast !== 'darken') || (fit === 'contain' && contrast !== 'none')) errors.push(`Slide ${slide.idx}: S28 media ${index + 1} must use cover + darken for text overlays or contain + none for inset evidence.`);
    });
    const criticalCount = tileTags.filter((tag) => /\bclass="[^"]*\bis-critical\b/.test(tag)).length;
    if (criticalCount > 1) errors.push(`Slide ${slide.idx}: S28 allows at most one semantically justified .is-critical tile; found ${criticalCount}.`);
    if (/\bclass="[^"]*\b(?:pill|badge|chip|tab|button|ribbon)\b[^"]*"/i.test(slide.html)) errors.push(`Slide ${slide.idx}: S28 contains dashboard/control classes. Keep the Bento editorial and area-led.`);
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
    await page.evaluate(() => {
      if (typeof window.__setLowPowerMode === 'function') {
        window.__setLowPowerMode(true, { persist: false });
      } else {
        document.body.classList.add('low-power');
      }
    });
    await page.waitForTimeout(100);

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
          '.xreal-bento', '.milestone-entry',
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
        if (canvasRect) {
          const widthRatio = timelineRect.width / canvasRect.width;
          if (widthRatio < .72 || widthRatio > .82) {
            issues.push(`timeline uses ${(widthRatio * 100).toFixed(1)}% of canvas width; expected 72%-82% so axes and row rules stay compact`);
          }
        }
        const expectedAxisX = timelineRect.left + parseFloat(getComputedStyle(timeline).getPropertyValue('--tl-axis-w')) / 2;
        timeline.querySelectorAll('.tl-node').forEach((node) => {
          const nodeRect = node.getBoundingClientRect();
          const axisStyle = getComputedStyle(node, '::before');
          if (parseFloat(axisStyle.width) < .5 || Math.abs((nodeRect.left + parseFloat(axisStyle.left)) - expectedAxisX) > 2.5) {
            issues.push('row-local vertical axis is missing or does not align with the node centers');
          }
        });
        timeline.querySelectorAll('.tl-head,.tl-node:not(:last-child)').forEach((row) => {
          const rowRect = row.getBoundingClientRect();
          const ruleStyle = getComputedStyle(row, '::after');
          const ruleStart = rowRect.left + parseFloat(ruleStyle.left);
          if (ruleStyle.display === 'none' || parseFloat(ruleStyle.height) < .5) {
            issues.push('header or row separator is missing its 1px horizontal rule');
          } else if (!Number.isFinite(ruleStart) || ruleStart <= expectedAxisX + 4) {
            issues.push('horizontal row rule intersects the vertical axis; start it to the right of the axis column');
          }
        });
        const headCols = Array.from(timeline.querySelectorAll('.tl-head > span')).slice(1);
        const firstNode = timeline.querySelector('.tl-node');
        const bodyCols = firstNode ? [firstNode.querySelector('.yr'), firstNode.querySelector('.multi'), firstNode.querySelector('.tl-copy')] : [];
        headCols.forEach((head, index) => {
          const body = bodyCols[index];
          if (body && Math.abs(head.getBoundingClientRect().left - body.getBoundingClientRect().left) > 2) {
            issues.push(`column ${index + 1} header is not left-aligned with its timeline values`);
          }
        });
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
        const isManifestoMark = el.dataset.layout === 'S12' && Boolean(node.closest('.ink-banner-full'));
        if (node.closest('.chrome-min')) issues.push('product mark is placed inside chrome-min; enterprise XREAL Logo owns the page chrome');
        if (style.objectFit !== 'contain') issues.push(`object-fit is ${style.objectFit}; expected contain to preserve the official mark`);
        const minWidth = isManifestoMark ? 160 : 240;
        const minHeight = isManifestoMark ? 18 : 24;
        if (rect.width < minWidth || rect.height < minHeight) issues.push(`rendered product mark is only ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
        const manifestoBanner = node.closest('.ink-banner-full');
        if (el.dataset.layout === 'S12' && manifestoBanner) {
          const bannerRect = manifestoBanner.getBoundingClientRect();
          const widthRatio = bannerRect.width ? rect.width / bannerRect.width : 0;
          if (widthRatio < .10 || widthRatio > .16) {
            issues.push(`S12 manifesto mark uses ${(widthRatio * 100).toFixed(1)}% of the identity row; expected 10%-16% so it reads as a quiet sign-off, not a second headline`);
          }
          if (colorVisible(getComputedStyle(manifestoBanner).backgroundColor)) issues.push('S12 identity row uses a visible filled background; keep it transparent over the slide media or black base');
        }
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const matrixFillChecks = (el) => {
        if (el.dataset.layout !== 'S15') return [];
        const matrix = el.querySelector('.matrix-fill');
        const stat = el.querySelector('.hero-stat-bottom');
        if (!matrix || !stat) return [];
        const issues = [];
        const matrixRect = matrix.getBoundingClientRect();
        const statRect = stat.getBoundingClientRect();
        const slideRect = el.getBoundingClientRect();
        const gap = statRect.top - matrixRect.bottom;
        if (matrixRect.height / slideRect.height < .32) issues.push(`matrix field uses only ${(matrixRect.height / slideRect.height * 100).toFixed(1)}% of slide height; let the rows consume the available vertical field`);
        if (gap < 8 || gap > 40) issues.push(`matrix-to-stat gap is ${gap.toFixed(1)}px; expected 8-40px without a loose empty band`);
        return issues.map((issue) => ({ node: labelFor(matrix), issue }));
      };

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

      const manifestoMediaChecks = (el) => Array.from(el.querySelectorAll('.manifesto-media')).flatMap((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const slideRect = el.getBoundingClientRect();
        const scrimStyle = getComputedStyle(el, '::after');
        const alphas = [...scrimStyle.backgroundImage.matchAll(/rgba?\([^)]*?[,\/]\s*([\d.]+)\s*\)/g)].map((match) => Number(match[1]));
        const maxAlpha = alphas.length ? Math.max(...alphas) : NaN;
        const brightness = Number(style.filter.match(/brightness\(([^)]+)\)/)?.[1]);
        const issues = [];
        if (style.objectFit !== 'cover') issues.push(`object-fit is ${style.objectFit}; expected cover`);
        if (rect.width / slideRect.width < .95 || rect.height / slideRect.height < .95) issues.push('media does not cover at least 95% of the S12 slide on both axes');
        if (scrimStyle.backgroundImage === 'none' || !Number.isFinite(maxAlpha) || maxAlpha < .42 || maxAlpha > .62) issues.push(`dark scrim is ${scrimStyle.backgroundImage}; expected a neutral black overlay with .42-.62 peak alpha`);
        if (!Number.isFinite(brightness) || brightness < .65 || brightness > .9) issues.push(`brightness is ${Number.isFinite(brightness) ? brightness : style.filter}; expected .65-.90`);
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const loopDiagramChecks = (el) => Array.from(el.querySelectorAll('.loop-diagram')).flatMap((diagram) => {
        const visual = diagram.querySelector('.loop-visual');
        const nodes = Array.from(diagram.querySelectorAll('.loop-node'));
        const core = diagram.querySelector('.loop-core');
        if (!visual) return [{ node: labelFor(diagram), issue: 'has no .loop-visual relationship area' }];
        const visualRect = visual.getBoundingClientRect();
        const issues = [];
        [...nodes, core].filter(Boolean).forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.left < visualRect.left - 1 || rect.right > visualRect.right + 1 || rect.top < visualRect.top - 1 || rect.bottom > visualRect.bottom + 1) {
            issues.push(`${labelFor(node)} extends outside the loop visual frame`);
          }
        });
        if (visualRect.height / diagram.getBoundingClientRect().height < .9) issues.push('loop visual does not consume the available diagram height');
        return issues.map((issue) => ({ node: labelFor(visual), issue }));
      });

      const systemRelationshipChecks = (el) => Array.from(el.querySelectorAll('[data-system-grammar]')).flatMap((node) => {
        const rect = node.getBoundingClientRect();
        const canvasRect = el.querySelector('.canvas-card')?.getBoundingClientRect();
        const copyRect = el.querySelector('.system-copy')?.getBoundingClientRect();
        const diagramRect = node.closest('.system-diagram')?.getBoundingClientRect();
        const issues = [];
        if (canvasRect && rect.width / canvasRect.width < .42) issues.push(`relationship graphic uses only ${(rect.width / canvasRect.width * 100).toFixed(1)}% of the canvas width; expected at least 42%`);
        if (copyRect && Math.abs(copyRect.top - rect.top) > 16) issues.push(`left conclusion and right relationship graphic start ${Math.abs(copyRect.top - rect.top).toFixed(1)}px apart; expected no more than 16px`);
        if (diagramRect && rect.height / diagramRect.height < .85) issues.push(`relationship graphic uses only ${(rect.height / diagramRect.height * 100).toFixed(1)}% of the available height; expected at least 85%`);
        node.querySelectorAll('.system-node').forEach((systemNode) => {
          const nodeRect = systemNode.getBoundingClientRect();
          if (nodeRect.height < 56) issues.push(`system node renders at only ${Math.round(nodeRect.height)}px high`);
        });
        if (node.dataset.systemGrammar === 'flow') {
          Array.from(node.querySelectorAll(':scope > .system-link')).forEach((link, index) => {
            const arrow = link.querySelector('.material-symbols-outlined');
            const label = Array.from(link.children).find((child) => !child.classList.contains('material-symbols-outlined'));
            const previous = link.previousElementSibling;
            const next = link.nextElementSibling;
            if (!previous?.classList.contains('system-node') || !next?.classList.contains('system-node')) {
              issues.push(`flow connector ${index + 1} is not placed directly between two system nodes`);
              return;
            }
            const linkRect = link.getBoundingClientRect();
            const previousRect = previous.getBoundingClientRect();
            const nextRect = next.getBoundingClientRect();
            if (linkRect.top < previousRect.bottom - 2 || linkRect.bottom > nextRect.top + 2) {
              issues.push(`flow connector ${index + 1} overlaps a node instead of owning the gap between adjacent nodes`);
            }
            if (!arrow) {
              issues.push(`flow connector ${index + 1} has no visible directional arrow`);
            } else {
              const arrowRect = arrow.getBoundingClientRect();
              const arrowSize = parseFloat(getComputedStyle(arrow).fontSize);
              if (!Number.isFinite(arrowSize) || arrowSize < 24) issues.push(`flow connector ${index + 1} arrow renders at ${arrowSize}px; expected at least 24px`);
              const previousLevel = previous.querySelector('.system-level');
              const nextLevel = next.querySelector('.system-level');
              [previousLevel, nextLevel].filter(Boolean).forEach((level, levelIndex) => {
                const levelRect = level.getBoundingClientRect();
                const axisDelta = Math.abs((arrowRect.left + arrowRect.width / 2) - (levelRect.left + levelRect.width / 2));
                if (axisDelta > 4) issues.push(`flow connector ${index + 1} arrow is ${axisDelta.toFixed(1)}px off the ${levelIndex ? 'next' : 'previous'} node stage axis`);
              });
              if (!label) {
                issues.push(`flow connector ${index + 1} has no relation label aligned to the node content column`);
              } else {
                const labelRect = label.getBoundingClientRect();
                const titleRect = previous.querySelector('.system-title')?.getBoundingClientRect();
                if (titleRect && Math.abs(labelRect.left - titleRect.left) > 4) issues.push(`flow connector ${index + 1} relation label starts ${Math.abs(labelRect.left - titleRect.left).toFixed(1)}px away from the node content axis`);
                const arrowToLabelGap = labelRect.left - (arrowRect.left + arrowRect.width / 2);
                if (arrowToLabelGap < 24) issues.push(`flow connector ${index + 1} leaves only ${arrowToLabelGap.toFixed(1)}px from the arrow axis to its relation label`);
              }
            }
          });
        }
        return issues.map((issue) => ({ node: labelFor(node), issue }));
      });

      const unitAlignmentChecks = (el) => Array.from(el.querySelectorAll('.unit,.stat-unit,.unit-degree')).filter((node) => {
        const style = getComputedStyle(node);
        const fontSize = parseFloat(style.fontSize);
        const gapRatio = parseFloat(style.marginLeft) / fontSize;
        const opacity = parseFloat(style.opacity);
        const isDegree = node.classList.contains('unit-degree');
        const isWord = node.classList.contains('unit-word');
        const letterSpacing = style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing) / fontSize;
        const gapInvalid = isDegree ? gapRatio < .01 || gapRatio > .07 : isWord ? gapRatio < .18 || gapRatio > .32 : gapRatio < .14 || gapRatio > .24;
        return style.verticalAlign !== 'text-top'
          || !Number.isFinite(opacity) || opacity < .58 || opacity > .68
          || !Number.isFinite(gapRatio) || gapInvalid
          || (isWord && (!Number.isFinite(letterSpacing) || Math.abs(letterSpacing) > .02));
      }).map((node) => {
        const style = getComputedStyle(node);
        return {
          node: labelFor(node),
          verticalAlign: style.verticalAlign,
          opacity: style.opacity,
          gapRatio: (parseFloat(style.marginLeft) / parseFloat(style.fontSize)).toFixed(2),
          letterSpacing: style.letterSpacing,
        };
      });

      const plotFrameChecks = (plot) => {
        const issues = [];
        const style = getComputedStyle(plot);
        const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat);
        const colors = [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor];
        if (widths.some((width) => !Number.isFinite(width) || width < .75 || width > 1.25) || Math.max(...widths) - Math.min(...widths) > .1) {
          issues.push(`plot frame widths are ${widths.map((width) => Number.isFinite(width) ? width.toFixed(1) : 'invalid').join('/')}; expected one uniform 1px frame`);
        }
        if (new Set(colors).size !== 1) {
          issues.push(`plot frame colors differ across sides (${colors.join(' / ')})`);
        }
        const edgeGridLines = [plot.querySelector('.chart-grid i:first-child'), plot.querySelector('.chart-grid i:last-child')].filter(Boolean);
        if (edgeGridLines.some((line) => parseFloat(getComputedStyle(line).borderTopWidth) > .1)) {
          issues.push('first or last grid line overlaps the outer frame and creates a double stroke');
        }
        return issues;
      };

      const horizontalBarChecks = (el) => {
        const fills = Array.from(el.querySelectorAll('.h-bar-chart .row-fill'));
        const labels = Array.from(el.querySelectorAll('.h-bar-chart .row-lbl'));
        const tracks = Array.from(el.querySelectorAll('.h-bar-chart .row-track'));
        const sharedIssues = [];
        const normalColors = new Set(fills.filter((fill) => !fill.classList.contains('critical')).map((fill) => getComputedStyle(fill).backgroundColor));
        const criticalCount = fills.filter((fill) => fill.classList.contains('critical')).length;
        if (normalColors.size > 1) sharedIssues.push('single-series ranking alternates multiple ordinary fill colors; use one stable neutral series color');
        if (criticalCount > 1) sharedIssues.push(`uses ${criticalCount} critical bars; S07 allows at most one semantically justified red item`);
        labels.forEach((label, index) => {
          const track = tracks[index];
          if (!track) return;
          const gap = track.getBoundingClientRect().left - label.getBoundingClientRect().right;
          if (gap < 16 || gap > 32) sharedIssues.push(`row ${index + 1} leaves ${gap.toFixed(1)}px between label and track; expected 16-32px`);
        });
        return [
          ...sharedIssues.map((issue) => ({ node: labelFor(el.querySelector('.h-bar-chart')), issue })),
          ...fills.flatMap((fill) => {
        const track = fill.closest('.row-track');
        if (!track) return [{ node: labelFor(fill), issue: 'has no .row-track parent' }];
        const declared = parseFloat(getComputedStyle(fill).getPropertyValue('--value'));
        // offsetWidth/clientWidth intentionally ignore an in-flight scaleX reveal so this
        // check verifies the persistent data width rather than the current animation frame.
        const actual = track.clientWidth ? fill.offsetWidth / track.clientWidth * 100 : 0;
        const issues = [];
        if (!Number.isFinite(declared) || declared <= 0 || declared > 100) issues.push(`declares invalid --value ${declared}`);
        if (actual < 1 || Math.abs(actual - declared) > 2) issues.push(`renders at ${actual.toFixed(1)}% while --value is ${Number.isFinite(declared) ? declared : 'invalid'}%; the fill may have collapsed after animation`);
        return issues.map((issue) => ({ node: labelFor(fill), issue }));
          }),
        ];
      };

      const baselineBarChecks = (el) => Array.from(el.querySelectorAll([
          '.bar-tower .body-block',
          '.v-bar-chart .col-bar',
          '.chart-bar',
        ].join(','))).flatMap((node) => {
          const r = node.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return [];
          const style = getComputedStyle(node);
          const topLeft = parseFloat(style.borderTopLeftRadius);
          const topRight = parseFloat(style.borderTopRightRadius);
          const bottomLeft = parseFloat(style.borderBottomLeftRadius);
          const bottomRight = parseFloat(style.borderBottomRightRadius);
          const issues = [];
          if (!Number.isFinite(topLeft) || topLeft < 7 || topLeft > 9
            || !Number.isFinite(topRight) || topRight < 7 || topRight > 9
            || !Number.isFinite(bottomLeft) || Math.abs(bottomLeft) > .1
            || !Number.isFinite(bottomRight) || Math.abs(bottomRight) > .1) {
            issues.push(`uses corner radii ${[
              style.borderTopLeftRadius,
              style.borderTopRightRadius,
              style.borderBottomRightRadius,
              style.borderBottomLeftRadius,
            ].join(' ')}`);
          }
          const towerField = node.closest('.bar-towers');
          if (towerField) {
            const baselineGap = Math.abs(towerField.getBoundingClientRect().bottom - r.bottom);
            if (baselineGap > 1.5) issues.push(`ends ${baselineGap.toFixed(1)}px away from the shared KPI Tower baseline`);
          }
          return issues.map((issue) => ({ node: labelFor(node), issue }));
        });

      const dataChartChecks = (el) => {
        const plot = el.querySelector('.chart-plot');
        const bars = Array.from(el.querySelectorAll('.chart-bar'));
        if (!plot || !bars.length) return [];
        const issues = [];
        const plotRect = plot.getBoundingClientRect();
        issues.push(...plotFrameChecks(plot));
        ['series-1','series-2','series-3','series-4','critical'].forEach((className) => {
          const swatch = el.querySelector(`.chart-swatch.${className}`);
          const bar = el.querySelector(`.chart-bar.${className}`);
          if (swatch && bar && getComputedStyle(swatch).backgroundColor !== getComputedStyle(bar).backgroundColor) {
            issues.push(`${className} legend swatch and bar use different colors`);
          }
        });
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

      const lineChartChecks = (el) => {
        const plot = el.querySelector('.line-plot');
        const geometry = el.querySelector('.line-geometry');
        const points = Array.from(el.querySelectorAll('.chart-point'));
        if (!plot || !geometry || !points.length) return [];
        const issues = [];
        const plotRect = plot.getBoundingClientRect();
        const geometryRect = geometry.getBoundingClientRect();
        const leftGap = geometryRect.left - plotRect.left;
        const rightGap = plotRect.right - geometryRect.right;
        if (leftGap < 28 || rightGap < 28) issues.push(`line geometry safety is ${leftGap.toFixed(1)}px left / ${rightGap.toFixed(1)}px right; expected at least 28px`);
        issues.push(...plotFrameChecks(plot));
        ['series-1','series-2','series-3','critical'].forEach((className) => {
          const swatch = el.querySelector(`.chart-swatch.${className}`);
          const line = el.querySelector(`.chart-line.${className}`);
          if (swatch && line && getComputedStyle(swatch).backgroundColor !== getComputedStyle(line).stroke) {
            issues.push(`${className} legend swatch and line use different colors`);
          }
        });
        points.forEach((point, index) => {
          const rect = point.getBoundingClientRect();
          if (rect.left < plotRect.left - 1 || rect.right > plotRect.right + 1) issues.push(`point ${index + 1} is clipped by the plot boundary`);
        });
        el.querySelectorAll('.line-end-label').forEach((label, index) => {
          const rect = label.getBoundingClientRect();
          if (rect.left < plotRect.left - 1 || rect.right > plotRect.right + 1) issues.push(`end label ${index + 1} extends outside the plot`);
          const style = getComputedStyle(label);
          if (colorVisible(style.backgroundColor)) issues.push(`end label ${index + 1} uses a visible background; terminal values must remain transparent`);
          const seriesClass = Array.from(label.classList).find((name) => /^series-\d+$/.test(name)) || (label.classList.contains('critical') ? 'critical' : '');
          const seriesPoints = seriesClass ? points.filter((point) => point.classList.contains(seriesClass)) : [];
          const endpoint = seriesPoints[seriesPoints.length - 1] || points[index];
          if (endpoint) {
            const pointRect = endpoint.getBoundingClientRect();
            const horizontalGap = pointRect.left - rect.right;
            const verticalGap = pointRect.top - rect.bottom;
            if (horizontalGap < 4 || verticalGap < 4) issues.push(`end label ${index + 1} is not on the upper-left shoulder of its endpoint (${horizontalGap.toFixed(1)}px horizontal / ${verticalGap.toFixed(1)}px vertical gap; expected at least 4px each)`);
          }
        });
        return issues.map((issue) => ({ node: labelFor(plot), issue }));
      };

      const footnoteChecks = (el) => {
        const selector = '.section-hero-foot,.chart-foot,.roadmap-source,.milestone-source,.dense-source,.priority-source';
        const canvas = el.querySelector('.canvas-card');
        if (!canvas) return [];
        const canvasRect = canvas.getBoundingClientRect();
        const canvasStyle = getComputedStyle(canvas);
        const expectedLeft = canvasRect.left + parseFloat(canvasStyle.paddingLeft);
        const contentBottom = canvasRect.bottom - parseFloat(canvasStyle.paddingBottom);
        return Array.from(el.querySelectorAll(selector)).flatMap((node) => {
          const issues = [];
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          const fontSize = parseFloat(style.fontSize);
          const marginBottom = parseFloat(style.marginBottom);
          const borders = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat);
          const paddings = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat);
          if (!Number.isFinite(fontSize) || fontSize < 10.5 || fontSize > 12.5) issues.push(`renders at ${fontSize}px; expected the shared 11-12px source-note role`);
          if (borders.some((value) => !Number.isFinite(value) || value > .1)) issues.push(`uses border widths ${borders.join('/')}; footnotes do not use separator lines`);
          if (paddings.some((value) => !Number.isFinite(value) || value > .5)) issues.push(`uses padding ${paddings.join('/')}; footnotes use the parent layout gap, not internal padding`);
          if (colorVisible(style.backgroundColor)) issues.push('uses a visible background; footnotes remain transparent');
          if (Math.abs(rect.left - expectedLeft) > 2) issues.push(`starts ${Math.abs(rect.left - expectedLeft).toFixed(1)}px away from the canvas content axis`);
          const expectedBottom = contentBottom - marginBottom;
          if (!Number.isFinite(marginBottom) || Math.abs(rect.bottom - expectedBottom) > 2) issues.push(`ends at ${rect.bottom.toFixed(1)}px instead of the shared ${expectedBottom.toFixed(1)}px footnote baseline`);
          Array.from(node.children).forEach((child, index) => {
            const childSize = parseFloat(getComputedStyle(child).fontSize);
            if (!Number.isFinite(childSize) || Math.abs(childSize - fontSize) > .5) issues.push(`child ${index + 1} renders at ${childSize}px instead of inheriting the shared footnote size`);
          });
          return issues.map((issue) => ({ node: labelFor(node), issue }));
        });
      };

      const footerRailChecks = (el) => {
        const canvas = el.querySelector('.canvas-card');
        if (!canvas) return [];
        const canvasRect = canvas.getBoundingClientRect();
        const approved = '.section-hero-foot,.chart-foot,.roadmap-source,.milestone-source,.dense-source,.priority-source';
        return Array.from(canvas.children).flatMap((node) => {
          if (node.matches(approved)) return [];
          const rect = node.getBoundingClientRect();
          if (rect.bottom < canvasRect.top + canvasRect.height * .68 || rect.height > 96) return [];
          const style = getComputedStyle(node);
          const hasTopRule = parseFloat(style.borderTopWidth) > .5 && style.borderTopStyle !== 'none' && colorVisible(style.borderTopColor);
          const isLooseLabNote = node.classList.contains('lab-note');
          if (!hasTopRule && !isLooseLabNote) return [];
          return [{
            node: labelFor(node),
            issue: isLooseLabNote
              ? 'uses a loose .lab-note as a bottom footer without a registered source role'
              : 'uses a small bottom rail with a decorative top divider instead of a registered source note',
          }];
        });
      };

      const portfolioRoadmapChecks = (el) => {
        const plot = el.querySelector('.roadmap-plot');
        const periods = el.querySelector('.roadmap-periods');
        const yAxis = el.querySelector('.roadmap-y-axis');
        const items = Array.from(el.querySelectorAll('.roadmap-item'));
        if (!plot || !items.length) return [];
        const issues = [];
        const plotRect = plot.getBoundingClientRect();
        const periodRect = periods?.getBoundingClientRect();
        if (periodRect && (Math.abs(periodRect.left - plotRect.left) > 2 || Math.abs(periodRect.right - plotRect.right) > 2)) {
          issues.push('top period axis does not align with the roadmap plot boundaries');
        }
        if (yAxis) {
          const axisRect = yAxis.getBoundingClientRect();
          const axisGap = plotRect.left - axisRect.right;
          if (axisRect.width > 80) issues.push(`y-axis label column is ${axisRect.width.toFixed(1)}px wide; expected at most 80px for short labels`);
          if (axisGap < 10 || axisGap > 24) issues.push(`y-axis labels leave ${axisGap.toFixed(1)}px before the plot; expected 10-24px`);
          yAxis.querySelectorAll('span').forEach((label, index) => {
            const style = getComputedStyle(label);
            if (style.justifyContent !== 'flex-start' || style.textAlign !== 'left') issues.push(`y-axis label ${index + 1} is not left-aligned`);
          });
        }
        items.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          if (rect.left < plotRect.left - 1 || rect.right > plotRect.right + 1 || rect.top < plotRect.top - 1 || rect.bottom > plotRect.bottom + 1) {
            issues.push(`item ${index + 1} extends outside the roadmap plot`);
          }
          const media = item.querySelector('.roadmap-media');
          const mediaRect = media?.getBoundingClientRect();
          if (!mediaRect || mediaRect.width < 64 || mediaRect.height < 42) issues.push(`item ${index + 1} media renders below the 64×42px legibility floor`);
          const radius = parseFloat(getComputedStyle(item).borderTopLeftRadius);
          if (!Number.isFinite(radius) || radius < 7 || radius > 9) issues.push(`item ${index + 1} uses ${getComputedStyle(item).borderTopLeftRadius} radius; expected 8px`);
        });
        for (let i = 0; i < items.length; i += 1) {
          const a = items[i].getBoundingClientRect();
          for (let j = i + 1; j < items.length; j += 1) {
            const b = items[j].getBoundingClientRect();
            const overlapW = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const overlapH = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            if (overlapW * overlapH > 16) issues.push(`items ${i + 1} and ${j + 1} overlap by ${Math.round(overlapW)}×${Math.round(overlapH)}px`);
          }
        }
        const rootStyle = getComputedStyle(document.documentElement);
        const allowedLaneColors = new Set(['--paper', '--grey-1', '--grey-2'].map((token) => rootStyle.getPropertyValue(token).trim()).filter(Boolean).map((value) => {
          const probe = document.createElement('span');
          probe.style.color = value;
          document.body.appendChild(probe);
          const normalized = getComputedStyle(probe).color;
          probe.remove();
          return normalized;
        }));
        el.querySelectorAll('.roadmap-lane').forEach((lane, index) => {
          if (!allowedLaneColors.has(getComputedStyle(lane).backgroundColor)) issues.push(`lane ${index + 1} uses a non-neutral background color`);
        });
        if (el.querySelectorAll('.roadmap-item.critical').length > 1) issues.push('more than one roadmap node uses critical red emphasis');
        return issues.map((issue) => ({ node: labelFor(plot), issue }));
      };

      const milestoneGalleryChecks = (el) => {
        const gallery = el.querySelector('.milestone-gallery');
        const entries = Array.from(el.querySelectorAll('.milestone-entry'));
        if (!gallery || !entries.length) return [];
        const issues = [];
        const entryRects = entries.map((entry) => entry.getBoundingClientRect());
        const topSpread = Math.max(...entryRects.map((rect) => rect.top)) - Math.min(...entryRects.map((rect) => rect.top));
        const bottomSpread = Math.max(...entryRects.map((rect) => rect.bottom)) - Math.min(...entryRects.map((rect) => rect.bottom));
        if (topSpread > 2 || bottomSpread > 2) issues.push(`milestone columns do not share common top/bottom edges (${topSpread.toFixed(1)}px / ${bottomSpread.toFixed(1)}px spread)`);
        entries.forEach((entry, index) => {
          const entryRect = entry.getBoundingClientRect();
          const entryStyle = getComputedStyle(entry);
          const media = entry.querySelector('.milestone-media');
          const mediaRect = media?.getBoundingClientRect();
          if (!mediaRect) return;
          const ratio = mediaRect.height / entryRect.height;
          if (ratio < .35 || ratio > .55) issues.push(`entry ${index + 1} media uses ${(ratio * 100).toFixed(1)}% of column height; expected 35%-55%`);
          const radius = parseFloat(getComputedStyle(media).borderTopLeftRadius);
          if (!Number.isFinite(radius) || radius < 7 || radius > 9) issues.push(`entry ${index + 1} media uses ${getComputedStyle(media).borderTopLeftRadius} radius; expected 8px`);
          const cardRadius = parseFloat(entryStyle.borderTopLeftRadius);
          if (!Number.isFinite(cardRadius) || cardRadius < 7 || cardRadius > 9) issues.push(`entry ${index + 1} card uses ${entryStyle.borderTopLeftRadius} radius; expected 8px`);
          const borderWidths = [entryStyle.borderTopWidth, entryStyle.borderRightWidth, entryStyle.borderBottomWidth, entryStyle.borderLeftWidth].map(parseFloat);
          if (borderWidths.some((width) => !Number.isFinite(width) || width < .75 || width > 1.25)) issues.push(`entry ${index + 1} must use one uniform 1px boundary`);
          const paddings = [entryStyle.paddingTop, entryStyle.paddingRight, entryStyle.paddingBottom, entryStyle.paddingLeft].map(parseFloat);
          if (paddings.some((value) => !Number.isFinite(value)) || Math.max(...paddings) - Math.min(...paddings) > 1.25) issues.push(`entry ${index + 1} must use equal padding on all four sides`);
          if (entryStyle.backgroundColor === getComputedStyle(el).backgroundColor) issues.push(`entry ${index + 1} background merges into the slide; use the registered neutral card fill`);
          if (entryStyle.boxShadow !== 'none') issues.push(`entry ${index + 1} uses a box shadow; S26 cards remain flat`);
          if (entry.scrollHeight - entry.clientHeight > 2) issues.push(`entry ${index + 1} text overflows its column`);
        });
        const chain = el.querySelector('.milestone-chain');
        if (chain) {
          const style = getComputedStyle(chain);
          if (colorVisible(style.backgroundColor) || parseFloat(style.borderRadius) > .1) issues.push('milestone chain is rendered as a filled/rounded control instead of a flat hairline sequence');
        }
        return issues.map((issue) => ({ node: labelFor(gallery), issue }));
      };

      const denseSynthesisChecks = (el) => {
        const synthesis = el.querySelector('.dense-synthesis');
        const columns = el.querySelector('.dense-columns');
        const panels = Array.from(el.querySelectorAll('.dense-panel'));
        if (!synthesis || !columns || !panels.length) return [];
        const issues = [];
        const thesisLabel = el.querySelector('.dense-thesis-label');
        const thesisCopy = el.querySelector('.dense-thesis-copy');
        if (thesisLabel && thesisCopy) {
          const axisDelta = Math.abs(thesisLabel.getBoundingClientRect().left - thesisCopy.getBoundingClientRect().left);
          if (axisDelta > 2) issues.push(`thesis label and conclusion are ${axisDelta.toFixed(1)}px off their shared left axis`);
        }
        const panelRects = panels.map((panel) => panel.getBoundingClientRect());
        const topSpread = Math.max(...panelRects.map((rect) => rect.top)) - Math.min(...panelRects.map((rect) => rect.top));
        const bottomSpread = Math.max(...panelRects.map((rect) => rect.bottom)) - Math.min(...panelRects.map((rect) => rect.bottom));
        if (topSpread > 2 || bottomSpread > 2) issues.push(`dense panels do not share common top/bottom edges (${topSpread.toFixed(1)}px / ${bottomSpread.toFixed(1)}px spread)`);
        panels.forEach((panel, index) => {
          const style = getComputedStyle(panel);
          const rect = panel.getBoundingClientRect();
          const radius = parseFloat(style.borderTopLeftRadius);
          const borderWidths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat);
          const paddings = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat);
          if (rect.width < 250) issues.push(`panel ${index + 1} is only ${rect.width.toFixed(1)}px wide; rebalance columns instead of shrinking copy`);
          if (!Number.isFinite(radius) || radius < 7 || radius > 9) issues.push(`panel ${index + 1} uses ${style.borderTopLeftRadius} radius; expected 8px`);
          if (borderWidths.some((width) => !Number.isFinite(width) || width < .75 || width > 1.25)) issues.push(`panel ${index + 1} must use one uniform 1px boundary`);
          if (paddings.some((value) => !Number.isFinite(value)) || Math.max(...paddings) - Math.min(...paddings) > 1.25) issues.push(`panel ${index + 1} must use equal padding on all four sides`);
          if (style.boxShadow !== 'none') issues.push(`panel ${index + 1} uses a box shadow; S27 remains flat`);
          if (panel.scrollHeight - panel.clientHeight > 2) issues.push(`panel ${index + 1} content overflows its region`);
        });
        el.querySelectorAll('.dense-item-copy').forEach((copy, index) => {
          const size = parseFloat(getComputedStyle(copy).fontSize);
          if (!Number.isFinite(size) || size < 15.5) issues.push(`item copy ${index + 1} renders at ${size}px; expected at least 16px`);
        });
        el.querySelectorAll('.dense-item').forEach((item, index) => {
          const style = getComputedStyle(item);
          const borders = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat);
          if (borders.some((width) => Number.isFinite(width) && width > .1)) issues.push(`item ${index + 1} repeats internal divider lines; use spacing and hierarchy inside the panel`);
        });
        const comparison = el.querySelector('.dense-comparison');
        if (comparison) {
          const comparisonItems = Array.from(comparison.querySelectorAll(':scope > .dense-item'));
          if (comparisonItems.length !== 3) issues.push(`dense comparison uses ${comparisonItems.length} items; expected exactly 3 distinct comparison regions`);
          comparisonItems.forEach((item, index) => {
            const itemStyle = getComputedStyle(item);
            const panelColor = getComputedStyle(item.closest('.dense-panel')).backgroundColor;
            if (!colorVisible(itemStyle.backgroundColor) || itemStyle.backgroundColor === panelColor) issues.push(`comparison item ${index + 1} does not have a distinct neutral surface from its parent panel`);
            const kicker = item.querySelector('.dense-item-kicker');
            const mark = item.querySelector('.dense-stage-mark');
            const title = item.querySelector('.dense-item-title');
            if (kicker && mark) {
              const gap = mark.getBoundingClientRect().top - kicker.getBoundingClientRect().bottom;
              if (gap < 0 || gap > 24) issues.push(`comparison item ${index + 1} leaves ${gap.toFixed(1)}px between kicker and stage mark; keep each comparison group compact`);
            }
            if (mark && title) {
              const gap = title.getBoundingClientRect().top - mark.getBoundingClientRect().bottom;
              if (gap < 0 || gap > 28) issues.push(`comparison item ${index + 1} leaves ${gap.toFixed(1)}px between stage mark and capability title; do not distribute one group across the full panel height`);
            }
          });
        }
        el.querySelectorAll('.dense-item-kicker,.dense-progress-num,.dense-thesis-label').forEach((meta, index) => {
          const size = parseFloat(getComputedStyle(meta).fontSize);
          if (!Number.isFinite(size) || size < 13.5) issues.push(`meta label ${index + 1} renders at ${size}px; expected at least 14px`);
        });
        if (el.querySelectorAll('.dense-item.is-focus').length > 1) issues.push('more than one dense item uses high-contrast focus styling');
        if (columns.getBoundingClientRect().height / synthesis.getBoundingClientRect().height < .58) issues.push('three-panel field uses too little of the available synthesis height');
        return issues.map((issue) => ({ node: labelFor(synthesis), issue }));
      };

      const priorityBentoChecks = (el) => {
        const bento = el.querySelector('.priority-bento');
        const tiles = Array.from(el.querySelectorAll('.priority-tile'));
        if (!bento || !tiles.length) return [];
        const issues = [];
        const bentoRect = bento.getBoundingClientRect();
        const bentoStyle = getComputedStyle(bento);
        const colGap = parseFloat(bentoStyle.columnGap);
        const rowGap = parseFloat(bentoStyle.rowGap);
        if (![colGap, rowGap].every(Number.isFinite) || colGap < 11.5 || colGap > 20.5 || rowGap < 11.5 || rowGap > 20.5) issues.push(`grid gaps render at ${colGap}px / ${rowGap}px; expected a consistent 12-20px rhythm`);
        const rects = tiles.map((tile) => tile.getBoundingClientRect());
        rects.forEach((rect, index) => {
          if (rect.left < bentoRect.left - 1 || rect.top < bentoRect.top - 1 || rect.right > bentoRect.right + 1 || rect.bottom > bentoRect.bottom + 1) issues.push(`tile ${index + 1} falls outside the Bento bounds`);
          rects.slice(index + 1).forEach((other, offset) => {
            const overlapX = Math.min(rect.right, other.right) - Math.max(rect.left, other.left);
            const overlapY = Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top);
            if (overlapX > 1 && overlapY > 1) issues.push(`tiles ${index + 1} and ${index + offset + 2} overlap after rendering`);
          });
          const tile = tiles[index];
          const style = getComputedStyle(tile);
          const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(parseFloat);
          if (radii.some((value) => !Number.isFinite(value) || value < 7 || value > 9)) issues.push(`tile ${index + 1} uses corner radii ${radii.join('/')}; expected 8px`);
          const borders = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat);
          const topMax = tile.classList.contains('is-critical') ? 2.25 : 1.25;
          if (!Number.isFinite(borders[0]) || borders[0] < .75 || borders[0] > topMax || borders.slice(1).some((value) => !Number.isFinite(value) || value < .75 || value > 1.25)) issues.push(`tile ${index + 1} does not use the registered flat 1px boundary`);
          const paddings = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat);
          if (paddings.some((value) => !Number.isFinite(value)) || Math.max(...paddings) - Math.min(...paddings) > 1.25) issues.push(`tile ${index + 1} must keep equal padding on all four sides`);
          if (style.boxShadow !== 'none') issues.push(`tile ${index + 1} uses a box shadow`);
          if (tile.scrollHeight - tile.clientHeight > 2 || tile.scrollWidth - tile.clientWidth > 2) issues.push(`tile ${index + 1} content overflows its region`);
        });
        const primary = el.querySelector('.priority-tile.is-primary');
        if (primary) {
          const rect = primary.getBoundingClientRect();
          const ratio = rect.width * rect.height / (bentoRect.width * bentoRect.height);
          if (ratio < .25 || ratio > .5) issues.push(`primary tile uses ${(ratio * 100).toFixed(1)}% of the rendered Bento; expected 25%-50%`);
        }
        const areaKinds = new Set(rects.map((rect) => `${Math.round(rect.width / 8)}x${Math.round(rect.height / 8)}`));
        if (areaKinds.size < 3) issues.push(`only ${areaKinds.size} visibly distinct card areas render; expected at least 3`);
        el.querySelectorAll('.priority-copy').forEach((copy, index) => {
          const size = parseFloat(getComputedStyle(copy).fontSize);
          if (!Number.isFinite(size) || size < 15.5) issues.push(`copy ${index + 1} renders at ${size}px; expected at least 16px`);
        });
        el.querySelectorAll('.priority-kicker').forEach((meta, index) => {
          const size = parseFloat(getComputedStyle(meta).fontSize);
          if (!Number.isFinite(size) || size < 13.5) issues.push(`meta label ${index + 1} renders at ${size}px; expected at least 14px`);
        });
        el.querySelectorAll('.priority-media[data-media-fit="cover"]').forEach((media, index) => {
          const mediaRect = media.getBoundingClientRect();
          const parentRect = media.parentElement?.getBoundingClientRect();
          if (!parentRect || mediaRect.width / parentRect.width < .95 || mediaRect.height / parentRect.height < .95) issues.push(`cover media ${index + 1} does not cover at least 95% of its tile`);
          if (!media.parentElement?.classList.contains('media-darken')) issues.push(`cover media ${index + 1} lacks the registered darkened text-overlay treatment`);
        });
        return issues.map((issue) => ({ node: labelFor(bento), issue }));
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
          horizontalBarIssues: horizontalBarChecks(el),
          productIdentityIssues: productIdentityChecks(el),
          matrixFillIssues: matrixFillChecks(el),
          closingMediaIssues: closingMediaChecks(el),
          manifestoMediaIssues: manifestoMediaChecks(el),
          loopDiagramIssues: loopDiagramChecks(el),
          systemRelationshipIssues: systemRelationshipChecks(el),
          unitAlignmentIssues: unitAlignmentChecks(el),
          baselineBarIssues: baselineBarChecks(el),
          dataChartIssues: dataChartChecks(el),
          lineChartIssues: lineChartChecks(el),
          footnoteIssues: footnoteChecks(el),
          footerRailIssues: footerRailChecks(el),
          portfolioRoadmapIssues: portfolioRoadmapChecks(el),
          milestoneGalleryIssues: milestoneGalleryChecks(el),
          denseSynthesisIssues: denseSynthesisChecks(el),
          priorityBentoIssues: priorityBentoChecks(el),
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
      for (const issue of m.horizontalBarIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S07 bars must retain their declared width after animation and remain visible in static mode.`);
      }
      for (const issue of m.productIdentityIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Use the official product mark in product-identity slots while keeping the enterprise XREAL Logo in page chrome; on S12 it remains a subordinate identity sign-off.`);
      }
      for (const issue of m.matrixFillIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S15 should use its matrix rows to consume the available body height instead of leaving a large dead zone below the grid.`);
      }
      for (const issue of m.closingMediaIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Closing media should be a low-interference atmosphere layer behind Thanks, not a product display.`);
      }
      for (const issue of m.manifestoMediaIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S12 background media must be contextual, full-bleed, and protected by a neutral dark scrim; product cutouts and packshots are not permitted.`);
      }
      for (const issue of m.loopDiagramIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S14 must use one contained fine-line loop with aligned HTML nodes and one center conclusion.`);
      }
      for (const issue of m.systemRelationshipIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S17 must use a top-aligned left conclusion and one dominant relationship structure, not competing information tracks.`);
      }
      for (const issue of m.unitAlignmentIssues) {
        errors.push(`${prefix}: ${issue.node} uses vertical-align ${issue.verticalAlign}, opacity ${issue.opacity}, gap ${issue.gapRatio}em, and letter-spacing ${issue.letterSpacing}. KPI/chart units must use the shared upper-right shoulder; word units also require normal internal tracking.`);
      }
      for (const issue of m.baselineBarIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Baseline bars may round only the top corners (7-9px); bottom corners must be square and flush to the x-axis.`);
      }
      for (const issue of m.dataChartIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S23 plots must protect edge bars and top labels, and every value must stay centered through the chart-rise animation.`);
      }
      for (const issue of m.lineChartIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S24 must inset line geometry, endpoints, and end labels from both plot edges so the complete trend remains visible.`);
      }
      for (const issue of m.footnoteIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Source and explanatory footnotes must share the small type token, canvas axis, nav-safe baseline, transparent surface, and no separator line.`);
      }
      for (const issue of m.footerRailIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. Bottom rails default to absent; keep only necessary source, method, legal/risk, or genuinely additive explanation without a divider line.`);
      }
      for (const issue of m.portfolioRoadmapIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S25 must keep a complete neutral two-axis plot with sparse, legible, non-overlapping media nodes.`);
      }
      for (const issue of m.milestoneGalleryIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S26 must use aligned equal-height 8px cards, 35%-55% media evidence, and a hairline synthesis chain.`);
      }
      for (const issue of m.denseSynthesisIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S27 must preserve one-page comparison through three aligned neutral regions, readable type, and at most one focus block.`);
      }
      for (const issue of m.priorityBentoIssues) {
        errors.push(`${prefix}: ${issue.node} ${issue.issue}. S28 must use a complete non-overlapping 12x6 area hierarchy, flat 8px cards, readable type, and restrained semantic media.`);
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

const coverageMessage = coverageSummary
  ? ` Content coverage: ${coverageSummary.included}/${coverageSummary.total} included, ${coverageSummary.omitted} approved omission(s).`
  : '';
console.log(`XREAL Style deck validation passed: ${slides.length} slide(s).${coverageMessage}`);
