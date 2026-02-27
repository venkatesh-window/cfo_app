'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import sql from './db'
import { hashPassword, verifyPassword, createSession, deleteSession } from './auth'

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string
  const phoneOrEmail = formData.get('phoneOrEmail') as string
  const password = formData.get('password') as string

  if (!name || !phoneOrEmail || !password) {
    return { error: 'All fields are required.' }
  }

  const existing = await sql`SELECT id FROM users WHERE phone_or_email = ${phoneOrEmail}`
  if (existing.length > 0) {
    return { error: 'An account with that email/phone already exists.' }
  }

  const passwordHash = await hashPassword(password)
  const rows = await sql`
    INSERT INTO users (name, phone_or_email, password_hash)
    VALUES (${name}, ${phoneOrEmail}, ${passwordHash})
    RETURNING id
  `
  const userId = (rows[0] as { id: number }).id
  const sessionId = await createSession(userId)

  const cookieStore = await cookies()
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  redirect('/dashboard')
}

export async function loginAction(formData: FormData) {
  const phoneOrEmail = formData.get('phoneOrEmail') as string
  const password = formData.get('password') as string

  if (!phoneOrEmail || !password) {
    return { error: 'All fields are required.' }
  }

  const rows = await sql`SELECT * FROM users WHERE phone_or_email = ${phoneOrEmail}`
  const user = rows[0] as { id: number; password_hash: string } | undefined

  if (!user) {
    return { error: 'Invalid credentials.' }
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid credentials.' }
  }

  const sessionId = await createSession(user.id)

  const cookieStore = await cookies()
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}
