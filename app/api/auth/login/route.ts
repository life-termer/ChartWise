import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  const expected = process.env.DASHBOARD_PASSWORD

  if (!expected) {
    return NextResponse.json(
      { error: 'Missing DASHBOARD_PASSWORD' },
      { status: 500 }
    )
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('chartwise_auth', 'authorized', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })

  return res
}
