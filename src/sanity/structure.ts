import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import React from 'react'
import { OrderCountBadge } from './components/OrderCountBadge'
import { OrderReports } from './components/OrderReports'

// Artwork list with category browsing
function artworkListItem(S: StructureBuilder, categories: string[]) {
  const categoryItems = categories.map((cat) =>
    S.listItem()
      .title(cat)
      .child(
        S.documentTypeList('artwork')
          .title(cat)
          .filter('_type == "artwork" && category == $cat')
          .params({ cat })
          .defaultOrdering([{ field: 'year', direction: 'desc' }])
      )
  )

  return S.listItem()
    .title('Artworks')
    .id('artwork')
    .child(
      S.list()
        .title('Artworks')
        .items([
          S.listItem()
            .title('All works')
            .child(
              S.documentTypeList('artwork')
                .title('All works')
                .defaultOrdering([{ field: 'year', direction: 'desc' }])
            ),
          ...(categoryItems.length > 0 ? [S.divider(), ...categoryItems] : []),
          S.divider(),
          S.listItem()
            .title('No category')
            .child(
              S.documentTypeList('artwork')
                .title('No category')
                .filter('_type == "artwork" && (!defined(category) || category == "")')
                .defaultOrdering([{ field: 'year', direction: 'desc' }])
            ),
        ])
    )
}

// Contacts with filters
function contactsListItem(S: StructureBuilder) {
  return S.listItem()
    .title('Contacts')
    .id('contact')
    .child(
      S.list()
        .title('Contacts')
        .items([
          S.listItem()
            .title('All contacts')
            .child(
              S.documentTypeList('contact')
                .title('All contacts')
                .defaultOrdering([{ field: 'lastName', direction: 'asc' }])
            ),
          S.divider(),
          S.listItem()
            .title('Collectors')
            .child(S.documentTypeList('contact').title('Collectors').filter('_type == "contact" && type == "collector"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.listItem()
            .title('Newsletter')
            .child(S.documentTypeList('contact').title('Newsletter').filter('_type == "contact" && subscribed == true').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.listItem()
            .title('Galleries & Museums')
            .child(S.documentTypeList('contact').title('Galleries & Museums').filter('_type == "contact" && type == "gallery"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.listItem()
            .title('Webshop customers')
            .child(S.documentTypeList('contact').title('Webshop customers').filter('_type == "contact" && type == "webshop_customer"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.divider(),
          S.listItem()
            .title('By country')
            .child(
              S.list()
                .title('By country')
                .items([
                  S.listItem().title('Netherlands (NL)').child(S.documentTypeList('contact').title('Netherlands').filter('_type == "contact" && country == "NL"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Belgium (BE)').child(S.documentTypeList('contact').title('Belgium').filter('_type == "contact" && country == "BE"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Germany (DE)').child(S.documentTypeList('contact').title('Germany').filter('_type == "contact" && country == "DE"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('France (FR)').child(S.documentTypeList('contact').title('France').filter('_type == "contact" && country == "FR"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('United Kingdom (GB)').child(S.documentTypeList('contact').title('United Kingdom').filter('_type == "contact" && country == "GB"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('United States (US)').child(S.documentTypeList('contact').title('United States').filter('_type == "contact" && country == "US"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Denmark (DK)').child(S.documentTypeList('contact').title('Denmark').filter('_type == "contact" && country == "DK"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Austria (AT)').child(S.documentTypeList('contact').title('Austria').filter('_type == "contact" && country == "AT"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Other countries').child(S.documentTypeList('contact').title('Other countries').filter('_type == "contact" && !(country in ["NL","BE","DE","FR","GB","US","DK","AT","FI","IT"])').defaultOrdering([{ field: 'country', direction: 'asc' }])),
                ])
            ),
        ])
    )
}

// Orders with live new-order badge
function orderListItem(S: StructureBuilder) {
  return S.listItem()
    .title('Orders')
    .id('order')
    .icon(() => React.createElement(OrderCountBadge) || React.createElement('span', null, '📦'))
    .child(
      S.documentTypeList('order')
        .title('Orders')
        .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
    )
}

// Settings: singleton + shipping zones
function shopSettingsListItem(S: StructureBuilder) {
  return S.listItem()
    .title('Settings')
    .id('shopSettings')
    .child(
      S.list()
        .title('Settings')
        .items([
          S.listItem()
            .title('Shop Settings')
            .child(S.document().schemaType('shopSettings').documentId('shopSettings').title('Shop Settings')),
          S.listItem()
            .title('Shipping Zones')
            .child(S.documentTypeList('shippingZone').title('Shipping Zones')),
        ])
    )
}

export const structure: StructureResolver = async (S, { getClient }) => {
  const client = getClient({ apiVersion: '2024-01-01' })

  const categories = await client.fetch<string[]>(
    `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`
  ).catch(() => [] as string[])

  return S.list()
    .title('Content')
    .items([

      // ── PAGES ─────────────────────────────────────────────────────────────
      S.divider().title('PAGES'),

      S.listItem()
        .title('Pages')
        .id('pages')
        .child(
          S.documentTypeList('project')
            .title('Pages')
            .filter('_type == "project" && isPage == true')
            .defaultOrdering([{ field: 'order', direction: 'asc' }])
        ),

      // ── WORKS ─────────────────────────────────────────────────────────────
      S.divider().title('WORKS'),

      artworkListItem(S, categories ?? []),
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('projectSeries').title('Project Series'),
      S.documentTypeListItem('zine').title('Zines'),
      S.documentTypeListItem('exhibition').title('Exhibitions'),
      S.documentTypeListItem('artFair').title('Art Fairs'),
      S.documentTypeListItem('viewingRoom').title('Viewing Rooms'),

      // ── SALES & NETWORK ───────────────────────────────────────────────────
      S.divider().title('SALES & NETWORK'),

      contactsListItem(S),
      S.documentTypeListItem('privateSale').title('Private Sales'),

      // ── WEBSHOP ───────────────────────────────────────────────────────────
      S.divider().title('WEBSHOP'),

      orderListItem(S),
      S.documentTypeListItem('coupon').title('Coupons'),
      S.listItem()
        .title('Reports')
        .id('shopReports')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .child(S.component(OrderReports as any).title('Reports')),
      shopSettingsListItem(S),

      // ── CAMPAIGNS ─────────────────────────────────────────────────────────
      S.divider().title('CAMPAIGNS'),

      S.documentTypeListItem('campaignSegment').title('Builder'),

    ])
}
