import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import sql from '@/lib/db'

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session_id')?.value
    if (sessionId) {
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set('session_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 })
  }
}
