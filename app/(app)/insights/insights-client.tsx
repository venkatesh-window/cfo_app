'use client'

import { useMemo } from 'react'
import { type Transaction } from '@/lib/actions/transaction-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'

const COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280',
]

function formatCurrency(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

export default function InsightsClient({ transactions }: { transactions: Transaction[] }) {
  const { monthlyData, categoryExpenses, categoryIncome, topExpenseCategories } = useMemo(() => {
    // Monthly income vs expense
    const monthMap: Record<string, { month: string; income: number; expense: number; profit: number }> = {}
    for (const t of transactions) {
      const key = format(startOfMonth(parseISO(t.date.split('T')[0])), 'MMM yyyy')
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0, profit: 0 }
      if (t.type === 'income') monthMap[key].income += Number(t.amount)
      else monthMap[key].expense += Number(t.amount)
    }
    const monthlyData = Object.values(monthMap)
      .map((m) => ({ ...m, profit: m.income - m.expense }))
      .slice(-6)

    // Expense by category
    const expMap: Record<string, number> = {}
    const incMap: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type === 'expense') expMap[t.category] = (expMap[t.category] || 0) + Number(t.amount)
      else incMap[t.category] = (incMap[t.category] || 0) + Number(t.amount)
    }
    const categoryExpenses = Object.entries(expMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    const categoryIncome = Object.entries(incMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    const topExpenseCategories = categoryExpenses.slice(0, 5)

    return { monthlyData, categoryExpenses, categoryIncome, topExpenseCategories }
  }, [transactions])

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <div className="text-center py-20 text-muted-foreground">
          <p>No data yet. Add some transactions to see your insights.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Visual breakdown of your financial performance.</p>
      </div>

      {/* Monthly Overview Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Net Profit Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Net Profit Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Net Profit']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Net Profit"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563EB' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryExpenses.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No expenses recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryExpenses.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Income Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Income by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryIncome.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No income recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryIncome}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryIncome.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top expense categories table */}
      {topExpenseCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topExpenseCategories.map((c, i) => {
                const pct = totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">{pct.toFixed(1)}%</span>
                        <span className="font-semibold text-foreground">${c.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
