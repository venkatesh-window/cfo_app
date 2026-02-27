import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phoneOrEmail, password } = body

    if (!name || !phoneOrEmail || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM users WHERE phone_or_email = ${phoneOrEmail}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with that email/phone already exists.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const rows = await sql`
      INSERT INTO users (name, phone_or_email, password_hash)
      VALUES (${name}, ${phoneOrEmail}, ${passwordHash})
      RETURNING id
    `
    const userId = (rows[0] as { id: number }).id
    const sessionId = await createSession(userId)

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
