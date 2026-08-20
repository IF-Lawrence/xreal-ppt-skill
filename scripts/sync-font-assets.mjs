#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const htmlFile = process.argv[2];
const sourceFlag = process.argv.indexOf('--font-source');
const fontSource = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : '';
const apply = process.argv.includes('--apply');

if (!htmlFile || !fontSource) {
  console.error('Usage: node scripts/sync-font-assets.mjs <index.html> --font-source <skill-font-dir> [--apply]');
  process.exit(2);
}

function normalizeFamily(value) {
  return value.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

function parseFace(block) {
  const family = normalizeFamily(block.match(/font-family\s*:\s*([^;}]+)/i)?.[1] ?? '');
  const weight = block.match(/font-weight\s*:\s*([^;}]+)/i)?.[1]?.trim() ?? '400';
  const style = block.match(/font-style\s*:\s*([^;}]+)/i)?.[1]?.trim().toLowerCase() ?? 'normal';
  const url = block.match(/url\(\s*["']?([^"')]+)["']?\s*\)/i)?.[1] ?? '';
  return { block, family, weight, style, url };
}

const absoluteHtml = path.resolve(htmlFile);
const deckDir = path.dirname(absoluteHtml);
const outputFontDir = path.join(deckDir, 'assets', 'fonts');
const html = readFileSync(absoluteHtml, 'utf8');
const facePattern = /@font-face\s*\{[^}]*\}/gi;
const faces = [...html.matchAll(facePattern)].map((match) => parseFace(match[0]));
const localFaces = faces.filter(({ url }) => /^assets\/fonts\/[^/?#]+\.otf$/i.test(url));

if (!localFaces.length) {
  console.error('No local assets/fonts/*.otf @font-face declarations found.');
  process.exit(1);
}

const keptFiles = new Set(localFaces.map(({ url }) => path.basename(url)));
console.log(`Referenced local font faces: ${localFaces.length}`);
for (const face of localFaces) console.log(`  ${face.family} ${face.weight} ${face.style} -> ${path.basename(face.url)}`);

if (!apply) {
  console.log('Dry run only. Re-run with --apply to synchronize the complete OTF files referenced by the final HTML.');
  process.exit(0);
}

mkdirSync(outputFontDir, { recursive: true });
for (const filename of keptFiles) {
  const source = path.resolve(fontSource, filename);
  if (!existsSync(source)) {
    console.error(`Missing full font source: ${source}`);
    process.exit(1);
  }
  copyFileSync(source, path.join(outputFontDir, filename));
}
for (const filename of readdirSync(outputFontDir)) {
  if (/\.otf$/i.test(filename) && !keptFiles.has(filename)) rmSync(path.join(outputFontDir, filename));
}

console.log(`Synchronized ${keptFiles.size} complete OTF files in ${outputFontDir}`);
