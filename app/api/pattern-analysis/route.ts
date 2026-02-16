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
  const stopLoss = payload?.stopLoss || ''
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

// const USER_PROMPT = `Analyze the screenshots of the ${symbol} chart and RSI image (${resolution || 'unknown'} resolution) based on price action, historical data, W.D. Gann methods, technical indicators, relevant news, and market sentiment. Provide clear buy or sell signals including specific targets and stop-loss levels. Also identify key support and resistance levels visible in the chart. If any time cycles are observable or relevant, explain them as well.

// Be thorough and reason your conclusions step-by-step before giving final trading signals.

// # Steps

// 1. Examine the price action patterns visible in the chart.
// 2. Review historical price data and trends.
// 3. Apply W.D. Gann techniques if applicable.
// 4. Analyze any technical indicators shown (e.g., RSI, MACD).
// 5. Incorporate relevant recent news and market sentiment.
// 6. Identify clear buy/sell signals with rationale.
// 7. Provide target and stop-loss price levels.
// 8. Mark critical support and resistance zones.
// 9. Detect and explain any visible time cycles affecting the price.

// # Output Format

// Provide a structured analysis report covering each aspect in clear sections:

// - Price Action Analysis:
// - Historical Data Overview:
// - W.D. Gann Analysis:
// - Indicators Summary:
// - News and Sentiment Impact:
// - Buy/Sell Signals with Targets and Stop-Loss:
// - Support and Resistance Levels:
// - Time Cycle Insights:
// ${hasPosition
//   ? `- The user currently holds ${shares || 'N/A'} shares at an entry price of ${entryPrice || 'N/A'} with stop loss at ${stopLoss || 'N/A'}. Provide the best possible strategy for managing the existing position based on the provided shares/entry price (e.g., hold/add/reduce conditions, risk control, invalidation levels).`
//   : ''}

// Use concise, clear language aimed at traders. Include numerical levels clearly and highlight final trade recommendations.`
const USER_PROMPT = `The user provides:
1) A screenshot of the price chart (candlesticks).
2) A screenshot of the RSI indicator.
3) Structured position data:
   - Number of shares - ${shares || 'N/A'}
   - Entry price - ${entryPrice || 'N/A'}
   - Stop loss - ${stopLoss || 'N/A'}

Analyze ONLY the information visible in the screenshots and the provided position data.
Do NOT assume unseen data or invent news.
Your objective:
Evaluate the current position and provide risk-focused guidance.
---
Analysis Steps:
1. Assess current market structure:
   - Is the trend aligned with the position?
   - Is momentum strengthening or weakening?
   - Any visible reversal patterns?
2. Evaluate RSI:
   - Overbought / Oversold
   - Divergence
   - Momentum continuation or exhaustion
3. Assess Risk:
   - Distance to stop-loss
   - Logical placement of stop-loss (is it technically justified?)
   - Is stop too tight or too wide?
4. Evaluate Reward Potential:
   - Nearest resistance (for long) or support (for short)
   - Is risk/reward still favorable?
5. Decision Framework:
   Choose ONE:
   - Hold position
   - Tighten stop
   - Take partial profit
   - Exit position
   - Reverse position (only if strong evidence)
---
Output Format:
Market Structure:
[Short technical assessment]
Momentum & RSI:
[Brief analysis]
Risk Assessment:
- Entry:
- Current Price:
- Stop-Loss:
- Technical Validity of Stop:
- Risk Exposure:
Reward Outlook:
- Next Key Level:
- Estimated Upside/Downside:
- Risk/Reward Estimate:
Recommended Action:
[Hold / Tighten Stop / Take Partial / Exit / Reverse]
Adjustment Details (if applicable):
[New stop level or partial take-profit suggestion]
Confidence:
[Low / Medium / High]
Final Summary:
[3–5 sentence professional risk-focused conclusion]`
console.log('USER_PROMPT', USER_PROMPT)

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
