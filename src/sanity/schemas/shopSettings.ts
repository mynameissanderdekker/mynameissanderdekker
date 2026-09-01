import { defineField, defineType } from 'sanity'

/**
 * Alleen wat de webshop zelf nodig heeft: waar bestellingen binnenkomen en
 * onder welk adres ze de deur uit gaan.
 *
 * Hier stonden ook BTW-nummer, KvK-nummer en de URL's naar de voorwaarden. Die
 * zijn verhuisd naar **Site Settings → Invoice & business**, waar de factuur ze
 * al leest. Ze stonden op twee plekken en de winkelversie werd nergens
 * opgevraagd — dus je kon hem invullen zonder dat er iets veranderde.
 *
 * Verzendtarieven horen hier evenmin: die staan per zone onder
 * Webshop → Settings → Shipping Zones, en dat is wat het afrekenen gebruikt.
 */
export const shopSettings = defineType({
  name: 'shopSettings',
  title: 'Shop Settings',
  type: 'document',
  liveEdit: false,
  preview: {
    prepare() { return { title: 'Shop Settings' } },
  },
  fields: [
    defineField({
      name: 'orderNotificationEmail',
      title: 'Order notification email',
      description: 'Email address that receives new order notifications',
      type: 'string',
      validation: Rule => Rule.email(),
    }),
    defineField({
      name: 'fromEmail',
      title: 'From email',
      description: 'Sender address for order confirmation emails — must be verified in Resend',
      type: 'string',
      validation: Rule => Rule.email(),
    }),
  ],
})
