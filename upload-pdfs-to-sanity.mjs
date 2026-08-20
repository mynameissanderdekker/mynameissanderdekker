// Upload split PDFs to Sanity and update project documents
// Run with: node upload-pdfs-to-sanity.mjs

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2021-10-21',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const dir = new URL('.', import.meta.url).pathname

async function uploadAndUpdate(pdfPath, projectId, label) {
  console.log(`\nUploading ${label}...`)
  const buffer = readFileSync(resolve(dir, pdfPath))

  const asset = await client.assets.upload('file', buffer, {
    filename: pdfPath.split('/').pop(),
    contentType: 'application/pdf',
  })

  const pdfUrl = `https://cdn.sanity.io/files/u11u127q/production/${asset._id.replace('file-', '').replace('-pdf', '')}.pdf`
  console.log(`  Uploaded: ${pdfUrl}`)

  await client
    .patch(projectId)
    .set({ 'pageBuilder[_key=="pb-pdf"].pdfUrl': pdfUrl })
    .commit()

  console.log(`  Updated ${projectId} ✓`)
}

await uploadAndUpdate('No8-Warsaw-single-pages.pdf', 'project-warsaw-saga', 'Warsaw SAGA')
await uploadAndUpdate('No9-Asia-single-pages.pdf', 'project-asia', 'A.S.I.A.')

console.log('\nDone!')
