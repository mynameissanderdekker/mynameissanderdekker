import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="site-main">
        {children}
      </main>
      <Footer />
    </>
  )
}
