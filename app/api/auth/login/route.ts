import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneOrEmail, password } = body

    if (!phoneOrEmail || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const rows = await sql`SELECT * FROM users WHERE phone_or_email = ${phoneOrEmail}`
    const user = rows[0] as { id: number; password_hash: string } | undefined

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const sessionId = await createSession(user.id)

    const response = NextResponse.json({ ok: true })
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
