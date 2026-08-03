import { NextRequest, NextResponse } from 'next/server'
import { getSanityReadClient } from '@/lib/sanityClient'

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json()

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Geen code opgegeven' }, { status: 400 })
    }

    const client = getSanityReadClient()
    const today = new Date().toISOString().split('T')[0]

    const coupon = await client.fetch(
      `*[_type == "coupon" && code == $code && active == true][0]`,
      { code: code.trim().toUpperCase() }
    )

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Ongeldige couponcode' })
    }

    // Check dates
    if (coupon.validFrom && today < coupon.validFrom) {
      return NextResponse.json({ valid: false, error: 'Coupon is nog niet geldig' })
    }
    if (coupon.validUntil && today > coupon.validUntil) {
      return NextResponse.json({ valid: false, error: 'Coupon is verlopen' })
    }

    // Check usage limit
    if (coupon.usageLimit != null && (coupon.usageCount ?? 0) >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Coupon heeft het maximum aantal gebruiken bereikt' })
    }

    // Check minimum order amount
    if (coupon.minOrderAmount != null && orderTotal < coupon.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimale bestelling €${coupon.minOrderAmount.toFixed(2)} vereist`,
      })
    }

    // Calculate discount
    let discountAmount: number
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((orderTotal * coupon.value) / 100 * 100) / 100
    } else {
      discountAmount = Math.min(coupon.value, orderTotal)
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      sanityId: coupon._id,
    })
  } catch (err) {
    console.error('Coupon validation error:', err)
    return NextResponse.json({ valid: false, error: 'Er ging iets mis' }, { status: 500 })
  }
}
