/**
 * Upload video poster images to Sanity and print the CDN URLs.
 * Run from the project root: node scripts/upload-posters.mjs
 *
 * Place the images next to this script or adjust the paths below.
 */

import { createReadStream, statSync, existsSync } from 'fs'
import { basename, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_ID = 'u11u127q'
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_WRITE_TOKEN

// ── Adjust these paths if your images are elsewhere ──────────────────────────
const IMAGES = [
  resolve(__dirname, 'TenFifteen.jpg'),
  resolve(__dirname, 'The-Social-Media-Project.jpg'),
  resolve(__dirname, 'The-Zine-Project.jpg'),
  resolve(__dirname, 'Wall.jpg'),
]

async function upload(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  const name = basename(filePath)
  const size = statSync(filePath).size
  const stream = createReadStream(filePath)

  const url = `https://${PROJECT_ID}.api.sanity.io/v2021-06-07/assets/images/${DATASET}?filename=${encodeURIComponent(name)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'image/jpeg',
      'Content-Length': String(size),
    },
    body: stream,
    duplex: 'half',
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Upload failed (${res.status}): ${txt}`)
  }

  const json = await res.json()
  return { name, url: json.document?.url }
}

console.log('Uploading poster images to Sanity…\n')

for (const f of IMAGES) {
  try {
    const { name, url } = await upload(f)
    console.log(`✓  ${name}`)
    console.log(`   ${url}\n`)
  } catch (e) {
    console.error(`✗  ${e.message}\n`)
  }
}

console.log('Done. Paste the URLs above into the "Poster image URL" field on each video block in Sanity Studio.')
