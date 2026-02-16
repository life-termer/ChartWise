import { NextResponse } from 'next/server'

const today = new Date()
const SYSTEM_PROMPT = `You are ChartWise’s in-app market analyst. Use only the provided data, be concise, and avoid speculation. Provide balanced, data-driven insights with clear risk context. If data is stale, explicitly say so. Today is ${today.toLocaleDateString('en-GB')}.`

const UNIVERSE = [
  'SPY',
  'QQQ',
  'TSLA',
  'AAPL',
  'AMZN',
  'NVDA',
  'META',
  'MSFT',
  'GOOGL',
  'AMD',
  ]

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY
  const twelveDataKey = process.env.TWELVEDATA_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OPENAI_API_KEY' },
      { status: 500 }
    )
  }

  if (!twelveDataKey) {
    return NextResponse.json(
      { error: 'Missing TWELVEDATA_API_KEY' },
      { status: 500 }
    )
  }

  try {
    const interval = '1day'
    const outputsize = 120

    const results = await Promise.all(
      UNIVERSE.map(async (symbol) => {
        const res = await fetch(
          `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${twelveDataKey}`
        )
        const data = await res.json()
        if (!data.values) return null

        const candles = data.values
          .map((item: any) => ({
            time: Math.floor(new Date(item.datetime).getTime() / 1000),
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: item.volume ? parseFloat(item.volume) : null,
          }))
          .reverse()

        if (candles.length < 25) return null

        const closes = candles.map((c: any) => c.close)
        const returns = closes.slice(1).map((c: number, i: number) => {
          const prev = closes[i]
          return prev ? (c - prev) / prev : 0
        })

        const latest = candles[candles.length - 1]
        const prev = candles[candles.length - 2]
        const weekAgo = candles[candles.length - 6]
        const monthAgo = candles[candles.length - 21]

        const dayChangePct =
          prev?.close && prev.close !== 0
            ? ((latest.close - prev.close) / prev.close) * 100
            : null
        const weekChangePct =
          weekAgo?.close && weekAgo.close !== 0
            ? ((latest.close - weekAgo.close) / weekAgo.close) * 100
            : null
        const monthChangePct =
          monthAgo?.close && monthAgo.close !== 0
            ? ((latest.close - monthAgo.close) / monthAgo.close) * 100
            : null

        const atr14 = average(
          candles.slice(-14).map((c: any) => c.high - c.low)
        )
        const vol20 = stddev(returns.slice(-20))

        const volumes = candles
          .slice(-20)
          .map((c: any) => c.volume)
          .filter((v: number | null) => v != null) as number[]
        const avgVolume = volumes.length ? average(volumes) : null

        return {
          symbol,
          asOf: new Date(latest.time * 1000).toISOString(),
          latestClose: latest.close,
          dayChangePct,
          weekChangePct,
          monthChangePct,
          atr14,
          vol20,
          avgVolume,
        }
      })
    )

    const filtered = results.filter(Boolean) as Array<{
      symbol: string
      asOf: string
      latestClose: number
      dayChangePct: number | null
      weekChangePct: number | null
      monthChangePct: number | null
      atr14: number
      vol20: number
      avgVolume: number | null
    }>

    const liquid = filtered.filter(
      (r) => r.avgVolume == null || r.avgVolume >= 2_000_000
    )

    const ranked = [...liquid].sort((a, b) => b.vol20 - a.vol20)
    const selected = ranked.slice(0, 5)

    const USER_PROMPT = `Task: Give a brief market update (under 300 words total) of 3–5 liquid and volatile Stocks/ETFs with strong swing trading potential this week/month, using ONLY the provided data.
For each, include:
- Current price (as of now, in USD).
- Recent changes and projections: Short-term (1-3 months) outlook based on trends.
- Analysis: Sentiment (bullish/bearish/neutral), key market indicators (volume, ATR/volatility), and possible reasons for movements.
Investment Advice: I plan to invest $5K monthly. Suggest the best timing for dollar-cost averaging.
Format Strictly:
- Prices: "Ticker: [Current Price] (📈/📉) X% UP/DOWN Today; Y% UP/DOWN This Week."
- Structure response with sections: "Updates" (bullet per ticker), "Analysis Summary", "Investment Recommendations".
- Keep entire response brief, factual, and under 1000 words.

Data (use only this):\n${JSON.stringify(selected, null, 2)}\n
If data is stale, explicitly say so and avoid fabricating prices or percentages.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT },
        ],
        temperature: 0.4,
      }),
    })

    if (!res.ok) {
      let errorPayload: any = null
      try {
        errorPayload = await res.json()
      } catch {
        errorPayload = { message: await res.text() }
      }

      const message =
        errorPayload?.error?.message ||
        errorPayload?.message ||
        'Upstream request failed'

      return NextResponse.json(
        { error: message, upstreamStatus: res.status },
        { status: res.status }
      )
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content?.trim()

    return NextResponse.json({ content: content || '' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate overview' },
      { status: 500 }
    )
  }
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stddev(values: number[]) {
  if (values.length < 2) return 0
  const mean = average(values)
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}
