import Link from 'next/link'

export default function CheckoutCancelled() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-normal mb-4">Betaling geannuleerd</h1>
      <p className="text-sm text-gray-500 mb-10">
        Je bestelling is niet verwerkt. Je winkelmandje is nog intact.
      </p>
      <Link
        href="/cart"
        className="text-xs tracking-[0.2em] uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
      >
        Terug naar winkelmandje
      </Link>
    </div>
  )
}
