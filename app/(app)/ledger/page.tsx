import { getTransactions } from '@/lib/actions/transaction-actions'
import LedgerClient from './ledger-client'

export default async function LedgerPage() {
  const transactions = await getTransactions()
  return <LedgerClient transactions={transactions} />
}
