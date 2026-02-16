import { NextResponse } from 'next/server'

const today = new Date()
const SYSTEM_PROMPT = `You are ChartWise’s in-app technical analyst. Use only the provided images and user input. Identify chart patterns, key levels, and indicator signals. Keep it concise, practical, and balanced. If images are unclear, say so. Today is ${today.toLocaleDateString('en-GB')}. Always add: “Not financial advice.”`

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
  const shares = payload?.shares || ''
  const entryPrice = payload?.entryPrice || ''
  const resolution = payload?.resolution || ''
  const mainChart = payload?.mainChart || ''
  const rsiChart = payload?.rsiChart || ''

  if (!symbol || !mainChart || !rsiChart) {
    return NextResponse.json(
      { error: 'Missing symbol or chart images' },
      { status: 400 }
    )
  }

  const hasPosition = Boolean(shares) && Boolean(entryPrice)
  const USER_PROMPT = `Task: Analyze the ${symbol} chart and RSI image (${resolution || 'unknown'} resolution). Identify patterns (head & shoulders, triangles, flags, etc.), spot trendlines and support/resistance, interpret RSI (overbought/oversold), and provide feedback. The user currently holds ${shares || 'N/A'} shares at an entry price of ${entryPrice || 'N/A'}.

Requirements:
- Clearly state any detected pattern(s) or say “No clear pattern.”
- Provide 2–3 key levels (support/resistance).
- Comment on trend direction and momentum.
${hasPosition} ? '- Provide the best possible strategy for managing the existing position based on the provided shares/entry price (e.g., hold/add/reduce conditions, risk control, invalidation levels).
Avoid proposing a new trade setup.
' : '- If possible, outline a cautious trade setup with potential triggers and invalidation.
'}- Give direct buy/sell commands with caution; frame as signals/conditions.
- Keep it under 400 words.`

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
      { error: 'Failed to analyze chart patterns' },
      { status: 500 }
    )
  }
}
