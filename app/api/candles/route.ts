import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const symbol = searchParams.get('symbol')
  const resolution = searchParams.get('resolution') || 'D'

  if (!symbol) {
    return NextResponse.json({ s: 'no_data' })
  }

  const to = Math.floor(Date.now() / 1000)
  const from = to - 60 * 60 * 24 * 60 // last 60 days

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`
    )

    const data = await res.json()

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ s: 'error' })
  }
}
