import { type SchemaTypeDefinition } from 'sanity'
import { project } from '../schemas/project'
import { zine } from '../schemas/zine'
import { projectSeries } from '../schemas/projectSeries'
import { artwork } from '../schemas/artwork'
import { exhibition } from '../schemas/exhibition'
import { artFair } from '../schemas/artFair'
import { viewingRoom } from '../schemas/viewingRoom'
import { contact } from '../schemas/contact'
import { worksPage } from '../schemas/worksPage'
import { campaignSegment } from '../schemas/campaignSegment'
import { order } from '../schemas/order'
import { shippingZone } from '../schemas/shippingZone'
import { coupon } from '../schemas/coupon'
import { shopSettings } from '../schemas/shopSettings'
import { privateSale } from '../schemas/privateSale'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Content
    project,
    projectSeries,
    // Artworks & sales
    artwork,
    // Context
    exhibition,
    artFair,
    // Private sales & CRM
    viewingRoom,
    contact,
    // Webshop
    order,
    shippingZone,
    coupon,
    shopSettings,
    // Sales
    privateSale,
    // Zines
    zine,
    // Page config
    worksPage,
    campaignSegment,
  ],
}
