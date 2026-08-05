#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/inline-echarts.mjs <input.html> <output.html>');
  process.exit(2);
}

const input = path.resolve(inputArg);
const output = path.resolve(outputArg);
if (input === output) {
  throw new Error('Input and output must be different files so the source deck remains recoverable.');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendorPath = path.join(root, 'assets', 'echarts.min.js');
const marker = '<!-- XREAL_ECHARTS_BUNDLE · 运行 scripts/inline-echarts.mjs 后替换为离线 ECharts 包 -->';
let html = await readFile(input, 'utf8');
const usesECharts = /\bdata-chart-engine=["']echarts["']/i.test(html);

html = html.replace(/<script\b[^>]*\bdata-xreal-echarts-bundle\b[^>]*>[\s\S]*?<\/script>\s*/gi, marker);
if (!html.includes(marker)) {
  throw new Error('XREAL_ECHARTS_BUNDLE marker not found. Start from assets/template-xreal.html.');
}

if (usesECharts) {
  const vendor = await readFile(vendorPath, 'utf8').catch(() => {
    throw new Error('assets/echarts.min.js is missing. Run node scripts/prepare-echarts.mjs first.');
  });
  const safeVendor = vendor.replace(/<\/script/gi, '<\\/script');
  html = html.replace(marker, `<script data-xreal-echarts-bundle data-echarts-version="6.1.0">\n${safeVendor}\n</script>`);
} else {
  html = html.replace(marker, '');
}

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`${usesECharts ? 'Bundled' : 'Skipped'} ECharts: ${output}`);

