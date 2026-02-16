import { NextResponse } from 'next/server'

const today = new Date()
const SYSTEM_PROMPT = `You are ChartWise’s in-app technical analyst. Use only the provided images and data. Identify patterns and signal conditions only. Keep it very short. Do NOT give direct buy/sell commands. Today is ${today.toLocaleDateString('en-GB')}. Do not include "Not financial advice."`

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

  const USER_PROMPT = `Task: Provide a very short pattern/signal check for ${symbol} using the chart + RSI images and the data below. Only patterns and signal conditions (no trade setup).

Data:\n${JSON.stringify(
  { resolution, asOf, latestClose, latestRsi, latestEma, last30 },
    null,
    2
  )}\n
Requirements:
- One sentence response.
- Focus on patterns and RSI signal (overbought/oversold/neutral).
- Include 1 key level if visible.
- If data is stale, say so.`

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
