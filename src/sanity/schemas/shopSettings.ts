import { defineField, defineType } from 'sanity'

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
    }),
    defineField({
      name: 'vatNumber',
      title: 'VAT number',
      type: 'string',
    }),
    defineField({
      name: 'kvkNumber',
      title: 'KvK number',
      type: 'string',
    }),
    defineField({
      name: 'termsUrl',
      title: 'Terms & Conditions URL',
      description: 'Shown in checkout footer',
      type: 'url',
    }),
    defineField({
      name: 'privacyUrl',
      title: 'Privacy Policy URL',
      type: 'url',
    }),
  ],
})
