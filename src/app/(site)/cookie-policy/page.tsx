import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie policy for mynameissanderdekker.com',
}

export default function CookiePolicyPage() {
  return (
    <div className="project-intro" style={{ maxWidth: '720px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '2rem' }}>Cookie Policy</h1>

      <p style={{ color: '#888', marginBottom: '2rem' }}>
        Last updated: July 2026
      </p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.5rem' }}>What are cookies?</h2>
      <p>
        Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences and improve your experience.
      </p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.5rem' }}>Cookies we use</h2>
      <p>This website uses the following types of cookies:</p>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.4rem' }}>Essential cookies</h3>
      <p>
        These cookies are necessary for the website to function. They cannot be switched off. They include cookies that enable bot-detection (via Cloudflare Turnstile) when you use the newsletter sign-up form.
      </p>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.4rem' }}>Payment cookies (third-party)</h3>
      <p>
        When you visit the Stripe checkout to purchase a product, Stripe may set cookies on their domain (stripe.com) to process your payment securely. We do not control these cookies. Please refer to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Stripe&apos;s Privacy Policy</a> for more information.
      </p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.5rem' }}>We do not use</h2>
      <p>
        We do not use tracking cookies, advertising cookies, or analytics cookies. We do not share your data with advertising networks.
      </p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.5rem' }}>Managing cookies</h2>
      <p>
        You can control and delete cookies through your browser settings. Disabling essential cookies may affect the functionality of certain features on this website.
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        For more information about managing cookies, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>www.aboutcookies.org</a>.
      </p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.5rem' }}>Contact</h2>
      <p>
        If you have questions about this cookie policy, please contact us at{' '}
        <a href="mailto:hello@mynameissanderdekker.com" style={{ textDecoration: 'underline' }}>
          hello@mynameissanderdekker.com
        </a>.
      </p>
    </div>
  )
}
