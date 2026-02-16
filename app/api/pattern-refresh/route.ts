import { NextResponse } from 'next/server'

const today = new Date()
const SYSTEM_PROMPT = `You are ChartWise’s in-app technical analyst. Use only the provided images and data. Identify patterns and signal conditions only. Keep it very short. Do not include "Not financial advice."`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OPENAI_API_KEY' },
      { status: 500 }
    )
  }

  let payload: any = null
  try {
    payload = await req.json()
  } catch {
    payload = null
  }

  const symbol = payload?.symbol || ''
  const mainChart = payload?.mainChart || ''
  const rsiChart = payload?.rsiChart || ''
  const resolution = payload?.resolution || ''
  const asOf = payload?.asOf || ''
  const latestClose = payload?.latestClose ?? null
  const latestRsi = payload?.latestRsi ?? null
  const latestEma = payload?.latestEma ?? null
  const last30 = payload?.last30 || []

  if (!symbol || !mainChart || !rsiChart) {
    return NextResponse.json(
      { error: 'Missing symbol or chart images' },
      { status: 400 }
    )
  }

const USER_PROMPT = `
The user provides two screenshots:
1) Price chart (candlesticks)
2) RSI indicator chart
and the following data:\n${JSON.stringify(
{ resolution, asOf, latestClose, latestRsi, latestEma, last30 },
null,
2
)}\n
Your task:
Analyze both images together and determine if there is a clear trading signal.
Focus on:
- Trend direction (uptrend, downtrend, range)
- Key support/resistance levels
- Breakouts or fakeouts
- RSI overbought (>70) / oversold (<30)
- RSI divergence (bullish or bearish)
- Momentum strength or weakness
Rules:
- Be concise (maximum 3-4 sentences).
- Only mention a trade idea if there is a HIGH-PROBABILITY setup.
- If there is no clear signal, say: "No clear high-probability setup at the moment."
- If there is a signal, clearly state:
  - Direction (Buy / Sell)
  - Reason (technical logic)
  - Risk note (brief)
Output format:
Signal: [Buy / Sell / None]
Analysis:
[Short explanation]
Confidence:
[Low / Medium / High].`

  try {
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
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_PROMPT },
              { type: 'image_url', image_url: { url: mainChart } },
              { type: 'image_url', image_url: { url: rsiChart } },
            ],
          },
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
      { error: 'Failed to generate auto analysis' },
      { status: 500 }
    )
  }
}
