import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const symbol = searchParams.get('symbol')
  const intervalParam =
    searchParams.get('interval') || searchParams.get('resolution') || '1h'

  if (!symbol) {
    return NextResponse.json({ status: 'error' })
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${mapResolution(
        intervalParam
      )}&outputsize=500&apikey=${process.env.TWELVEDATA_API_KEY}`
    )

    const data = await res.json()

    if (!data.values) {
      return NextResponse.json({ status: 'no_data' })
    }

    // Convert to Lightweight Charts format
    const formatted = data.values
      .map((item: any) => ({
        time: Math.floor(new Date(item.datetime).getTime() / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: item.volume ? parseFloat(item.volume) : 0,
      }))
      .reverse()

    return NextResponse.json({ status: 'ok', candles: formatted })
  } catch (err) {
    return NextResponse.json({ status: 'error' })
  }
}

function mapResolution(res: string) {
  
  switch (res) {
    case '5':
      return '5min'
    case '15':
      return '15min'
    case '60':
      return '1h'
    case 'W':
      return '1week'
    case 'M':
      return '1month'
    case 'D':
    default:
      return '1day'
  }
}
