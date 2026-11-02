// scripts/icon.svg dosyasından uygulama ikonlarını üretir (Playwright gerekir).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'scripts/icon.svg'), 'utf8');

const targets = [
  ['public/icons/apple-touch-icon.png', 180],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
];

const browser = await chromium.launch();
for (const [out, size] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: resolve(root, out), omitBackground: false });
  await page.close();
  console.log('✓', out);
}
await browser.close();
