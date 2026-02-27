'use server'

import { redirect } from 'next/navigation'
import sql from '../db'
import { getSession } from '../auth'

export type Transaction = {
  id: number
  user_id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  created_at: string
}

export async function getTransactions(): Promise<Transaction[]> {
  const user = await getSession()
  if (!user) redirect('/login')

  const rows = await sql`
    SELECT * FROM transactions
    WHERE user_id = ${user.id}
    ORDER BY date DESC, created_at DESC
  `
  return rows as Transaction[]
}

export async function addTransaction(data: {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}) {
  const user = await getSession()
  if (!user) redirect('/login')

  await sql`
    INSERT INTO transactions (user_id, date, description, amount, type, category)
    VALUES (${user.id}, ${data.date}, ${data.description}, ${data.amount}, ${data.type}, ${data.category})
  `
}

export async function deleteTransaction(id: number) {
  const user = await getSession()
  if (!user) redirect('/login')

  await sql`
    DELETE FROM transactions
    WHERE id = ${id} AND user_id = ${user.id}
  `
}

export async function updateTransaction(
  id: number,
  data: {
    date: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
  }
) {
  const user = await getSession()
  if (!user) redirect('/login')

  await sql`
    UPDATE transactions
    SET date = ${data.date}, description = ${data.description},
        amount = ${data.amount}, type = ${data.type}, category = ${data.category}
    WHERE id = ${id} AND user_id = ${user.id}
  `
}
