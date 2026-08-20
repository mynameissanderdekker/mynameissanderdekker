/**
 * Upload videos + poster images to Sanity & update project heroVideo blocks
 * Run with: node upload-videos.mjs
 */
import { createClient } from '@sanity/client'
import { createReadStream, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TOKEN = process.env.SANITY_WRITE_TOKEN

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
})

const videos = [
  {
    videoFile: path.join(__dirname, "Upload/My name is Sander Dekker - The Social Landscape.mp4"),
    posterFile: path.join(__dirname, "Upload/The-Social-Landscape.jpg"),
    projectSlug: 'the-social-landscape',
    label: 'The Social Landscape',
  },
  {
    videoFile: path.join(__dirname, "Upload/My name is Sander Dekker - 'the Project'.mp4"),
    posterFile: path.join(__dirname, "Upload/The-Social-Media-Project.jpg"),
    projectSlug: 'the-social-media-project',
    label: 'The Social Media Project',
  },
]

for (const video of videos) {
  console.log(`\n▶ Processing "${video.label}"...`)

  // 1. Upload video if file exists
  let videoUrl = null
  if (existsSync(video.videoFile)) {
    console.log(`  Uploading video...`)
    const videoAsset = await client.assets.upload('file', createReadStream(video.videoFile), {
      filename: path.basename(video.videoFile),
      contentType: 'video/mp4',
    })
    videoUrl = videoAsset.url
    console.log(`  ✓ Video: ${videoUrl}`)
  } else {
    console.log(`  ⚠ Video file not found, skipping video upload`)
  }

  // 2. Upload poster image if file exists
  let posterAssetId = null
  if (existsSync(video.posterFile)) {
    console.log(`  Uploading poster image...`)
    const posterAsset = await client.assets.upload('image', createReadStream(video.posterFile), {
      filename: path.basename(video.posterFile),
      contentType: 'image/jpeg',
    })
    posterAssetId = posterAsset._id
    console.log(`  ✓ Poster: ${posterAsset.url}`)
  } else {
    console.log(`  ⚠ Poster file not found: ${path.basename(video.posterFile)}`)
  }

  if (!videoUrl && !posterAssetId) {
    console.log(`  ⚠ Nothing to update for ${video.projectSlug}`)
    continue
  }

  // 3. Fetch the project
  const project = await client.fetch(
    `*[_type == "project" && slug.current == $slug][0]{ _id, pageBuilder }`,
    { slug: video.projectSlug }
  )
  if (!project) { console.error(`  ✗ Project not found: ${video.projectSlug}`); continue }

  // 4. Update heroVideo block (replace or patch)
  const blocks = project.pageBuilder ?? []
  let updated = false
  const newBlocks = blocks.map(block => {
    if (!updated && (block._type === 'heroVideo' || block._type === 'videoEmbed')) {
      updated = true
      const newBlock = {
        ...block,
        _type: 'heroVideo',
        embedUrl: undefined,
      }
      if (videoUrl) newBlock.url = videoUrl
      if (posterAssetId) {
        newBlock.posterImage = {
          _type: 'image',
          asset: { _type: 'reference', _ref: posterAssetId }
        }
      }
      return newBlock
    }
    return block
  })

  if (!updated) {
    console.warn(`  ⚠ No heroVideo/videoEmbed block found in ${video.projectSlug}`)
    continue
  }

  await client.patch(project._id).set({ pageBuilder: newBlocks }).commit()
  console.log(`  ✓ Sanity document updated`)
}

console.log('\n✅ Done! Refresh your browser to see the changes.')
