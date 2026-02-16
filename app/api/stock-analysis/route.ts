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

Analyze ONLY the information visible in the screenshots and provided data.
Do NOT invent news or unseen historical data.

Your objective:
Deliver a structured, professional trading analysis with clear reasoning and actionable levels.

---

Analysis Requirements:

1. Examine visible price action:
   - Trend direction (uptrend, downtrend, range)
   - Market structure (higher highs/lows, lower highs/lows)
   - Breakouts or consolidations
   - Reversal patterns if visible

2. Historical Context:
   - Infer trend strength and structure only from visible chart history.
   - Avoid assumptions beyond the displayed timeframe.

3. W.D. Gann Concepts (if applicable):
   - Price symmetry
   - Angles or geometric movement
   - Time/price relationships
   - Significant swing highs/lows alignment

4. RSI Analysis:
   - Overbought (>70) / Oversold (<30)
   - Divergences (bullish or bearish)
   - Momentum confirmation or weakening

5. Market Sentiment (Chart-Based Only):
   - Strong bullish momentum
   - Distribution
   - Accumulation
   - Exhaustion

6. Identify Trade Setup:
   - Clear Buy / Sell / No Trade
   - Entry zone
   - Target(s)
   - Stop-loss level
   - Estimated risk/reward ratio

7. Identify:
   - Key support levels
   - Key resistance levels

8. Time Cycle Observations:
   - Any visible rhythm or cyclical swing timing in price movement
   - Only if clearly observable from chart

---

Reason step-by-step internally before giving conclusions.
Keep explanations professional but concise.

---

Output Format:

Price Action Analysis:
[Analysis]

W.D. Gann Perspective:
[Analysis or “No clear Gann structure visible.”]

RSI & Momentum:
[Analysis]

Support Levels:
- Level 1:
- Level 2:

Resistance Levels:
- Level 1:
- Level 2:

Trade Setup:
Signal: [Buy / Sell / No Trade]
Entry:
Target 1:
Target 2:
Stop-Loss:
Risk/Reward Estimate:

Time Cycle Notes:
[Brief comment or “No clear cycle detected.”]

Final Summary:
[3–5 sentence trader-focused conclusion]
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
