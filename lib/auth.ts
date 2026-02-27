import { cookies } from 'next/headers'
import sql from './db'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

export type User = {
  id: number
  name: string
  phone_or_email: string
  created_at: string
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hash] = stored.split(':')
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer
    const storedKey = Buffer.from(hash, 'hex')
    return timingSafeEqual(derivedKey, storedKey)
  } catch {
    return false
  }
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `
  return sessionId
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session_id')?.value
    if (!sessionId) return null

    const rows = await sql`
      SELECT u.id, u.name, u.phone_or_email, u.created_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${sessionId}
        AND s.expires_at > NOW()
    `
    return (rows[0] as User) ?? null
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session_id')?.value
    if (sessionId) {
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    }
    cookieStore.delete('session_id')
  } catch {
    // ignore
  }
}
