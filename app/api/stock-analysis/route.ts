import { NextResponse } from 'next/server'

const today = new Date()
const SYSTEM_PROMPT = `You are ChartWise’s in-app market analyst. Use only the provided data, be concise, and avoid speculation. Provide balanced, data-driven insights with clear risk context. If data is stale, explicitly say so. Today is ${today.toLocaleDateString('en-GB')}.`

export async function POST(req: Request) {
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

  let symbol = ''
  try {
    const body = await req.json()
    symbol = body?.symbol?.toUpperCase?.() || ''
  } catch {
    symbol = ''
  }

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
  }

  try {
    const interval = '1day'
    const outputsize = 200
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${twelveDataKey}`
    )

    const data = await res.json()

    if (!data.values) {
      return NextResponse.json({ error: 'No data available' }, { status: 400 })
    }

    const candles = data.values
      .map((item: any) => ({
        time: Math.floor(new Date(item.datetime).getTime() / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: item.volume ? parseFloat(item.volume) : undefined,
      }))
      .reverse()

    const closes = candles.map((c: any) => c.close)

    const rsiPeriod = 14
    const emaPeriod = 20

    const rsiValues = calculateRSI(closes, rsiPeriod)
    const emaValues = calculateEMA(closes, emaPeriod)

    const latest = candles[candles.length - 1]
    const prev = candles[candles.length - 2]

    const latestClose = latest?.close ?? null
    const prevClose = prev?.close ?? null
    const dayChangePct =
      latestClose != null && prevClose != null && prevClose !== 0
        ? ((latestClose - prevClose) / prevClose) * 100
        : null

    const latestRsi = rsiValues.length ? rsiValues[rsiValues.length - 1] : null
    const latestEma = emaValues.length ? emaValues[emaValues.length - 1] : null

    const last30 = candles.slice(-30).map((c: any) => ({
      time: c.time,
      close: c.close,
      volume: c.volume ?? null,
    }))

    const dataSummary = {
      symbol,
      asOf: new Date(latest?.time * 1000).toISOString(),
      latestClose,
      prevClose,
      dayChangePct,
      latestRsi,
      latestEma,
      last30,
    }

    const USER_PROMPT = `Task: Analyze the current ${symbol} stock chart using the provided data. Focus on trend direction, momentum, and risk. Use the RSI and EMA to support conclusions. Provide a concise, data-driven update under 200 words.

Data (most recent candle is last):\n${JSON.stringify(dataSummary, null, 2)}\n
Requirements:
- Mention the latest close, day % change, and RSI/EMA readings.
- Provide a short outlook for the next 1–4 weeks.
- Include 2–3 key levels or conditions to watch.
- If data is stale, note the as-of time.
- Keep tone professional and balanced.
- Add a brief disclaimer: “Not financial advice.”`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (!aiRes.ok) {
      let errorPayload: any = null
      try {
        errorPayload = await aiRes.json()
      } catch {
        errorPayload = { message: await aiRes.text() }
      }

      const message =
        errorPayload?.error?.message ||
        errorPayload?.message ||
        'Upstream request failed'

      return NextResponse.json(
        { error: message, upstreamStatus: aiRes.status },
        { status: aiRes.status }
      )
    }

    const aiData = await aiRes.json()
    const content = aiData?.choices?.[0]?.message?.content?.trim()

    return NextResponse.json({ content: content || '' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate stock analysis' },
      { status: 500 }
    )
  }
}

function calculateRSI(values: number[], period: number) {
  if (values.length <= period) return []

  const rsi: number[] = []
  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }

  gains /= period
  losses /= period

  rsi.push(100 - 100 / (1 + gains / losses))

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    gains = (gains * (period - 1) + gain) / period
    losses = (losses * (period - 1) + loss) / period

    const rs = gains / losses
    const value = 100 - 100 / (1 + rs)
    rsi.push(value)
  }

  return rsi
}

function calculateEMA(values: number[], period: number) {
  if (values.length < period) return []

  const k = 2 / (period + 1)
  const ema: number[] = []

  const sma = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  ema.push(sma)

  for (let i = period; i < values.length; i++) {
    const prev = ema[ema.length - 1]
    const next = values[i] * k + prev * (1 - k)
    ema.push(next)
  }

  return ema
}
