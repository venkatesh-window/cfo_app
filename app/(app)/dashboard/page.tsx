import { getTransactions } from '@/lib/actions/transaction-actions'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const transactions = await getTransactions()
  return <DashboardClient transactions={transactions} userName={user.name} />
}
