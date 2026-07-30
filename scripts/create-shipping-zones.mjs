// Maak shipping zones aan in Sanity
// Uitvoeren vanuit project-root: node scripts/create-shipping-zones.mjs

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET,
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
  apiVersion: '2024-01-01',
})

const zones = [
  {
    _id:      'shippingZone-nl',
    _type:    'shippingZone',
    zoneName: 'Nederland',
    regions:  ['NL'],
    active:   true,
    shippingMethods: [
      {
        _key:       'nl-klein',
        methodType: 'flat_rate',
        title:      'Klein — publicatie / zine (≤ 2 kg)',
        cost:       5.50,
      },
      {
        _key:       'nl-middel',
        methodType: 'flat_rate',
        title:      'Middel — artwork (≤ 10 kg)',
        cost:       10.00,
      },
      {
        _key:       'nl-groot',
        methodType: 'flat_rate',
        title:      'Groot — artwork (> 10 kg)',
        cost:       20.00,
      },
      {
        _key:       'nl-pickup',
        methodType: 'local_pickup',
        title:      'Ophalen in Amsterdam',
        cost:       0,
      },
    ],
  },
  {
    _id:      'shippingZone-eu',
    _type:    'shippingZone',
    zoneName: 'Europa',
    regions:  ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','PL','PT','RO','SK','SI','ES','SE','NO','CH','GB'],
    active:   true,
    shippingMethods: [
      {
        _key:       'eu-klein',
        methodType: 'flat_rate',
        title:      'Klein — publicatie / zine (≤ 2 kg)',
        cost:       14.00,
      },
      {
        _key:       'eu-middel',
        methodType: 'flat_rate',
        title:      'Middel — artwork (≤ 10 kg)',
        cost:       30.00,
      },
      {
        _key:       'eu-groot',
        methodType: 'flat_rate',
        title:      'Groot — artwork (> 10 kg)',
        cost:       45.00,
      },
    ],
  },
  {
    _id:      'shippingZone-world',
    _type:    'shippingZone',
    zoneName: 'Wereld',
    regions:  ['*'],
    active:   true,
    shippingMethods: [
      {
        _key:       'world-klein',
        methodType: 'flat_rate',
        title:      'Klein — publicatie / zine (≤ 2 kg)',
        cost:       37.00,
      },
      {
        _key:       'world-middel',
        methodType: 'flat_rate',
        title:      'Middel — artwork (≤ 10 kg)',
        cost:       95.00,
      },
      {
        _key:       'world-groot',
        methodType: 'flat_rate',
        title:      'Groot — artwork (> 10 kg) — op aanvraag',
        cost:       0,
      },
    ],
  },
]

console.log('Shipping zones aanmaken...\n')

for (const zone of zones) {
  try {
    await client.createOrReplace(zone)
    console.log(`✓ ${zone.zoneName} (${zone.shippingMethods.length} methoden)`)
  } catch (err) {
    console.error(`✗ ${zone.zoneName}: ${err.message}`)
  }
}

console.log('\nKlaar! Herlaad de Studio → Settings → Shipping Zones om ze te zien.')
