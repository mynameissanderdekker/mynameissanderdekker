import 'grapesjs/dist/css/grapes.min.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Bare layout — geen site-nav, geen footer
  return <>{children}</>
}
