import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ result: [] })
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${query}&token=${process.env.FINNHUB_API_KEY}`
    )

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ result: [] })
  }
}
