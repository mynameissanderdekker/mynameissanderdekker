'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { media } from 'sanity-plugin-media'

import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schema } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'
import { StudioLayout } from './src/sanity/components/StudioLayout'
import { withShippedNotification, withStatusHistory } from './src/sanity/actions/orderActions'
import { PressReleasePreviewAction, SendPressReleaseAction } from './src/sanity/actions/pressReleaseActions'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  studio: {
    components: { layout: StudioLayout },
  },
  document: {
    actions: (prev, ctx) => {
      if (ctx.schemaType === 'order') {
        return prev.map(action =>
          action.action === 'publish'
            ? withShippedNotification(withStatusHistory(action))
            : action
        )
      }
      if (ctx.schemaType === 'pressRelease') {
        return [...prev, PressReleasePreviewAction, SendPressReleaseAction]
      }
      return prev
    },
  },
  plugins: [
    structureTool({ structure }),
    media(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})
