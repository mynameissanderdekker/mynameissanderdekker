'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { media } from 'sanity-plugin-media'

import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schema } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'
import { StudioLayout } from './src/sanity/components/StudioLayout'
import { AnalyticsTool, AnalyticsIcon } from './src/sanity/components/AnalyticsTool'
import { TorchSyncTool, TorchSyncIcon } from './src/sanity/components/TorchSyncTool'
import { DashboardTool, DashboardIcon } from './src/sanity/components/DashboardTool'
import { withShippedNotification, withStatusHistory } from './src/sanity/actions/orderActions'
import { PressReleasePreviewAction, SendPressReleaseAction } from './src/sanity/actions/pressReleaseActions'
import { SyncToTorchAction } from './src/sanity/actions/SyncToTorchAction'
import { PullFromTorchAction } from './src/sanity/actions/PullFromTorchAction'

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
      if (ctx.schemaType === 'artwork') {
        return [...prev, SyncToTorchAction, PullFromTorchAction]
      }
      return prev
    },
  },
  plugins: [
    structureTool({ structure }),
    media(),
    visionTool({ defaultApiVersion: apiVersion }),
    {
      name: 'dashboard',
      tools: [
        {
          name: 'dashboard',
          title: 'Dashboard',
          icon: DashboardIcon,
          component: DashboardTool,
        },
      ],
    },
    {
      name: 'analytics',
      tools: [
        {
          name: 'analytics',
          title: 'Analytics',
          icon: AnalyticsIcon,
          component: AnalyticsTool,
        },
      ],
    },
    {
      name: 'torch-sync',
      tools: [
        {
          name: 'torch-sync',
          title: 'Torch Sync',
          icon: TorchSyncIcon,
          component: TorchSyncTool,
        },
      ],
    },
  ],
})
