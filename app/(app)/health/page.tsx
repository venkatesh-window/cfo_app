import { getTransactions } from '@/lib/actions/transaction-actions'
import HealthClient from './health-client'

export default async function HealthPage() {
  const transactions = await getTransactions()
  return <HealthClient transactions={transactions} />
}
