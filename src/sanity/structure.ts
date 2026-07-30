import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import React from 'react'
import { OrderCountBadge } from './components/OrderCountBadge'
import { OrderReports } from './components/OrderReports'
import { MailingListExport } from './components/MailingListExport'

// Artwork list with category browsing (excludes 'book' category → see Publications)
const PUBLICATION_CATEGORIES = ['book']

function artworkListItem(S: StructureBuilder, categories: string[]) {
  const artworkCategories = categories.filter(c => !PUBLICATION_CATEGORIES.includes(c))

  const categoryItems = artworkCategories.map((cat) =>
    S.listItem()
      .title(cat)
      .id(`artwork-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`)
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
        .id('artwork-list')
        .title('Artworks')
        .items([
          S.listItem()
            .title('All works')
            .id('artwork-all')
            .child(
              S.documentTypeList('artwork')
                .title('All works')
                .filter('_type == "artwork" && !(category in $pubCats)')
                .params({ pubCats: PUBLICATION_CATEGORIES })
                .defaultOrdering([{ field: 'year', direction: 'desc' }])
            ),
          ...(categoryItems.length > 0 ? [S.divider(), ...categoryItems] : []),
          S.divider(),
          S.listItem()
            .title('No category')
            .id('artwork-no-category')
            .child(
              S.documentTypeList('artwork')
                .title('No category')
                .filter('_type == "artwork" && (!defined(category) || category == "")')
                .defaultOrdering([{ field: 'year', direction: 'desc' }])
            ),
        ])
    )
}

// Publications: zines + book-category artworks
function publicationsListItem(S: StructureBuilder) {
  return S.listItem()
    .title('Publications')
    .id('publications')
    .child(
      S.list()
        .id('publications-list')
        .title('Publications')
        .items([
          S.listItem()
            .title('Zines')
            .id('publications-zines')
            .child(S.documentTypeList('zine').title('Zines')),
          S.listItem()
            .title('Books')
            .id('publications-books')
            .child(
              S.documentTypeList('artwork')
                .title('Books')
                .filter('_type == "artwork" && category == "book"')
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
        .id('contacts-list')
        .title('Contacts')
        .items([
          S.listItem()
            .title('All contacts')
            .id('contacts-all')
            .child(
              S.documentTypeList('contact')
                .title('All contacts')
                .defaultOrdering([{ field: 'lastName', direction: 'asc' }])
            ),
          S.divider(),
          S.listItem()
            .title('Collectors')
            .id('contacts-collectors')
            .child(S.documentTypeList('contact').title('Collectors').filter('_type == "contact" && type == "collector"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.listItem()
            .title('Newsletter')
            .id('contacts-newsletter')
            .child(S.documentTypeList('contact').title('Newsletter').filter('_type == "contact" && subscribed == true').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.listItem()
            .title('Galleries & Museums')
            .id('contacts-galleries')
            .child(S.documentTypeList('contact').title('Galleries & Museums').filter('_type == "contact" && type == "gallery"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.listItem()
            .title('Webshop customers')
            .id('contacts-webshop')
            .child(S.documentTypeList('contact').title('Webshop customers').filter('_type == "contact" && type == "webshop_customer"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
          S.divider(),
          S.listItem()
            .title('By country')
            .id('contacts-by-country')
            .child(
              S.list()
                .id('contacts-country-list')
                .title('By country')
                .items([
                  S.listItem().title('Netherlands (NL)').id('contacts-nl').child(S.documentTypeList('contact').title('Netherlands').filter('_type == "contact" && country == "NL"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Belgium (BE)').id('contacts-be').child(S.documentTypeList('contact').title('Belgium').filter('_type == "contact" && country == "BE"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Germany (DE)').id('contacts-de').child(S.documentTypeList('contact').title('Germany').filter('_type == "contact" && country == "DE"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('France (FR)').id('contacts-fr').child(S.documentTypeList('contact').title('France').filter('_type == "contact" && country == "FR"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('United Kingdom (GB)').id('contacts-gb').child(S.documentTypeList('contact').title('United Kingdom').filter('_type == "contact" && country == "GB"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('United States (US)').id('contacts-us').child(S.documentTypeList('contact').title('United States').filter('_type == "contact" && country == "US"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Denmark (DK)').id('contacts-dk').child(S.documentTypeList('contact').title('Denmark').filter('_type == "contact" && country == "DK"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Austria (AT)').id('contacts-at').child(S.documentTypeList('contact').title('Austria').filter('_type == "contact" && country == "AT"').defaultOrdering([{ field: 'lastName', direction: 'asc' }])),
                  S.listItem().title('Other countries').id('contacts-other').child(S.documentTypeList('contact').title('Other countries').filter('_type == "contact" && !(country in ["NL","BE","DE","FR","GB","US","DK","AT","FI","IT"])').defaultOrdering([{ field: 'country', direction: 'asc' }])),
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
        .id('shop-settings-list')
        .title('Settings')
        .items([
          S.listItem()
            .title('Shop Settings')
            .id('shop-settings-singleton')
            .child(S.document().schemaType('shopSettings').documentId('shopSettings').title('Shop Settings')),
          S.listItem()
            .title('Shipping Zones')
            .id('shop-settings-shipping')
            .child(S.documentTypeList('shippingZone').title('Shipping Zones')),
        ])
    )
}

export const structure: StructureResolver = async (S, { getClient }) => {
  const client = getClient({ apiVersion: '2024-01-01' })

  const [categories] = await Promise.all([
    client.fetch<string[]>(
      `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`
    ).catch(() => [] as string[]),
  ])

  return S.list()
    .title('Content')
    .items([

      // ── SITE ──────────────────────────────────────────────────────────────
      S.divider().title('SITE'),

      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),

      // ── PAGES ─────────────────────────────────────────────────────────────
      S.divider().title('PAGES'),

      S.listItem()
        .title('About')
        .id('aboutPage')
        .child(S.document().schemaType('aboutPage').documentId('aboutPage').title('About')),

      S.listItem()
        .title('CV')
        .id('cvPage')
        .child(S.document().schemaType('cvPage').documentId('cvPage').title('CV')),

      S.listItem()
        .title('Projects')
        .id('projectsOverview')
        .child(
          S.documentTypeList('project')
            .title('Projects')
            .filter('_type == "project" && isPage == true && !(_id in path("drafts.**"))')
            .defaultOrdering([{ field: 'order', direction: 'asc' }])
        ),

      // Works / Webshop pagina configuratie
      S.listItem()
        .title('Webshop')
        .id('worksPage')
        .child(S.document().schemaType('worksPage').documentId('worksPage').title('Webshop')),


      // ── WORKS ─────────────────────────────────────────────────────────────
      S.divider().title('WORKS'),

      artworkListItem(S, categories ?? []),
      publicationsListItem(S),
      S.documentTypeListItem('projectSeries').title('Project Series'),
      S.documentTypeListItem('viewingRoom').title('Viewing Rooms'),

      // ── SALES & NETWORK ───────────────────────────────────────────────────
      S.divider().title('SALES & NETWORK'),

      contactsListItem(S),
      S.documentTypeListItem('privateSale').title('Private Sales Selections'),
      S.documentTypeListItem('exhibition').title('Exhibitions'),
      S.documentTypeListItem('artFair').title('Art Fairs'),
      S.documentTypeListItem('press').title('Press'),

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

      S.listItem()
        .title('Mailing lists')
        .id('mailingLists')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .child(S.component(MailingListExport as any).title('Mailing lists')),
      S.documentTypeListItem('pressRelease').title('Press releases'),

    ])
}
