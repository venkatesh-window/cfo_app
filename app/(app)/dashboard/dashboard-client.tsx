'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { type Transaction } from '@/lib/actions/transaction-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function DashboardClient({
  transactions,
  userName,
}: {
  transactions: Transaction[]
  userName: string
}) {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)
    const netProfit = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0
    return { totalIncome, totalExpenses, netProfit, savingsRate }
  }, [transactions])

  const recent = transactions.slice(0, 5)

  const firstName = userName.split(' ')[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's an overview of your finances.
          </p>
        </div>
        <Button asChild>
          <Link href="/chat">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(stats.totalIncome)}
          icon={<ArrowUpRight className="w-4 h-4" />}
          iconClass="text-accent"
          sub="All time"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={<ArrowDownRight className="w-4 h-4" />}
          iconClass="text-destructive"
          sub="All time"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(stats.netProfit)}
          icon={<Wallet className="w-4 h-4" />}
          iconClass={stats.netProfit >= 0 ? 'text-accent' : 'text-destructive'}
          sub="Income minus expenses"
        />
        <StatCard
          title="Savings Rate"
          value={`${stats.savingsRate}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          iconClass="text-primary"
          sub="Of total income saved"
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
            <Link href="/ledger" className="flex items-center gap-1 text-sm">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
              <Button asChild size="sm">
                <Link href="/chat">
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first transaction
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === 'income' ? 'bg-accent/10' : 'bg-destructive/10'
                      }`}
                    >
                      {t.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-accent" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.date), { addSuffix: true })} ·{' '}
                        <Badge variant="secondary" className="text-xs font-normal py-0">
                          {t.category}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      t.type === 'income' ? 'text-accent' : 'text-destructive'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
  sub,
}: {
  title: string
  value: string
  icon: React.ReactNode
  iconClass: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <span className={iconClass}>{icon}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}
