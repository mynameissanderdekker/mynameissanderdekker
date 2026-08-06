/**
 * generate-press-kit-pdf.mjs
 * Generates public/sander-dekker-press-kit.pdf from public/press-kit.html
 * Uses your installed Chrome — no separate browser download needed.
 *
 * Run once (or after every edit to press-kit.html):
 *   node scripts/generate-press-kit-pdf.mjs
 *
 * Requires puppeteer-core:
 *   npm install --save-dev puppeteer-core
 */

import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath  = resolve(__dirname, '../public/press-kit.html')
const pdfPath   = resolve(__dirname, '../public/sander-dekker-press-kit.pdf')

// Common Chrome locations on macOS
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
]

const executablePath = CHROME_PATHS.find(existsSync)
if (!executablePath) {
  console.error('✗  Chrome not found. Install Chrome or adjust CHROME_PATHS in this script.')
  process.exit(1)
}

console.log(`Using: ${executablePath}`)
console.log('Launching browser…')

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const page = await browser.newPage()

// Load via file:// — Chrome fetches external HTTPS images normally
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30_000 })

// Remove the download bar from the PDF
await page.evaluate(() => {
  document.querySelector('.download-bar')?.remove()
})

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  displayHeaderFooter: false,
})

await browser.close()
console.log('✓  PDF saved → public/sander-dekker-press-kit.pdf')
