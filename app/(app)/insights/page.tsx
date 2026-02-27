import { getTransactions } from '@/lib/actions/transaction-actions'
import InsightsClient from './insights-client'

export default async function InsightsPage() {
  const transactions = await getTransactions()
  return <InsightsClient transactions={transactions} />
}
