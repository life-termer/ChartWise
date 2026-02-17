import { NextResponse } from 'next/server'

const today = new Date()
const SYSTEM_PROMPT = `You are ChartWise's in-app technical analyst. Use only the provided images and user input. Identify chart patterns, key levels, and indicator signals. Keep it concise, practical, and balanced. If images are unclear, say so. Today is ${today.toLocaleDateString('en-GB')}. Always add: "Not financial advice."`

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

  const mainChart = payload?.mainChart || ''
  const rsiChart = payload?.rsiChart || ''
  const resolution = payload?.resolution || ''
  const asOf = payload?.asOf || ''
  const latestClose = payload?.latestClose ?? null
  const latestRsi = payload?.latestRsi ?? null
  const latestEma = payload?.latestEma ?? null
  const last30 = payload?.last30 || []

  if (!mainChart || !rsiChart) {
    return NextResponse.json(
      { error: 'Missing chart images' },
      { status: 400 }
    )
  }

  const USER_PROMPT = `
The user provides:
1) A screenshot of the price chart (candlestick chart).
2) A screenshot of the RSI indicator.
3) Structured stock data: \n${JSON.stringify(
{ resolution, asOf, latestClose, latestRsi, latestEma, last30 },
null,
2
)}\n.


`

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
      { error: 'Failed to analyze stock chart' },
      { status: 500 }
    )
  }
}
