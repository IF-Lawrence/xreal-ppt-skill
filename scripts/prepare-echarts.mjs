#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '6.1.0';
const SHA256 = 'b66b25aeb4df84e33199dc21694014d336d222cbd9deb0e5a7c14bd6aa0d0fd0';
const URL = `https://cdn.jsdelivr.net/npm/echarts@${VERSION}/dist/echarts.min.js`;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets', 'echarts.min.js');

const response = await fetch(URL);
if (!response.ok) {
  throw new Error(`Failed to download Apache ECharts ${VERSION}: HTTP ${response.status}`);
}
const source = Buffer.from(await response.arrayBuffer());
const digest = createHash('sha256').update(source).digest('hex');
if (digest !== SHA256) {
  throw new Error(`Apache ECharts checksum mismatch: expected ${SHA256}, received ${digest}`);
}
if (!source.toString('utf8', 0, 180).includes('Licensed to the Apache Software Foundation')) {
  throw new Error('Apache ECharts license header is missing from the downloaded bundle.');
}

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, source);
console.log(`Prepared Apache ECharts ${VERSION}: ${output}`);

