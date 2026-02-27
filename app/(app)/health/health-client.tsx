'use client'

import { useMemo } from 'react'
import { type Transaction } from '@/lib/actions/transaction-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

type HealthIndicator = {
  label: string
  score: number      // 0-100
  weight: number
  status: 'good' | 'warning' | 'poor'
  insight: string
}

function calcScore(indicators: HealthIndicator[]) {
  const totalWeight = indicators.reduce((s, i) => s + i.weight, 0)
  return Math.round(indicators.reduce((s, i) => s + i.score * i.weight, 0) / totalWeight)
}

function getScoreLabel(score: number): { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (score >= 80) return { label: 'Excellent', color: '#10B981', variant: 'default' }
  if (score >= 65) return { label: 'Good', color: '#2563EB', variant: 'default' }
  if (score >= 50) return { label: 'Fair', color: '#F59E0B', variant: 'secondary' }
  return { label: 'Needs Attention', color: '#EF4444', variant: 'destructive' }
}

export default function HealthClient({ transactions }: { transactions: Transaction[] }) {
  const { indicators, overallScore, totalIncome, totalExpenses, netProfit } = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const netProfit = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100

    // Savings Rate (weight 30)
    const savingsScore = Math.min(100, Math.max(0, savingsRate * 2))
    const savingsIndicator: HealthIndicator = {
      label: 'Savings Rate',
      score: savingsScore,
      weight: 30,
      status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'poor',
      insight:
        savingsRate >= 20
          ? `You're saving ${savingsRate.toFixed(1)}% of income — great discipline.`
          : savingsRate >= 10
          ? `Savings rate is ${savingsRate.toFixed(1)}%. Aim for 20%+ for strong reserves.`
          : `Only ${savingsRate.toFixed(1)}% savings rate. Reduce expenses to improve cash reserves.`,
    }

    // Expense Ratio (weight 25)
    const expenseScore = Math.min(100, Math.max(0, (1 - expenseRatio / 100) * 100 + 20))
    const expenseIndicator: HealthIndicator = {
      label: 'Expense Control',
      score: Math.round(expenseScore),
      weight: 25,
      status: expenseRatio < 70 ? 'good' : expenseRatio < 90 ? 'warning' : 'poor',
      insight:
        expenseRatio < 70
          ? `Expenses are ${expenseRatio.toFixed(1)}% of income — well controlled.`
          : expenseRatio < 90
          ? `Expenses are ${expenseRatio.toFixed(1)}% of income. Look for areas to cut.`
          : `Expenses exceed ${expenseRatio.toFixed(1)}% of income — critical to reduce costs.`,
    }

    // Profitability (weight 25)
    const profitScore = netProfit > 0 ? Math.min(100, 50 + (netProfit / Math.max(totalIncome, 1)) * 100) : Math.max(0, 50 + (netProfit / Math.max(totalIncome, 1)) * 100)
    const profitIndicator: HealthIndicator = {
      label: 'Profitability',
      score: Math.round(profitScore),
      weight: 25,
      status: netProfit > 0 ? 'good' : netProfit === 0 ? 'warning' : 'poor',
      insight:
        netProfit > 0
          ? `Your business is profitable with $${netProfit.toLocaleString()} net profit.`
          : netProfit === 0
          ? 'Breaking even. Push to generate surplus for growth.'
          : `Operating at a $${Math.abs(netProfit).toLocaleString()} loss. Review major expenses.`,
    }

    // Diversification (weight 20)
    const incomeCategories = new Set(transactions.filter((t) => t.type === 'income').map((t) => t.category)).size
    const diversScore = Math.min(100, incomeCategories * 25)
    const diversIndicator: HealthIndicator = {
      label: 'Income Diversification',
      score: diversScore,
      weight: 20,
      status: incomeCategories >= 3 ? 'good' : incomeCategories >= 2 ? 'warning' : 'poor',
      insight:
        incomeCategories >= 3
          ? `${incomeCategories} income sources — well diversified.`
          : incomeCategories >= 2
          ? `${incomeCategories} income sources. Consider adding a third stream.`
          : 'Only 1 income source. Diversify to reduce risk.',
    }

    const indicators = [savingsIndicator, expenseIndicator, profitIndicator, diversIndicator]
    const overallScore = calcScore(indicators)
    return { indicators, overallScore, totalIncome, totalExpenses, netProfit }
  }, [transactions])

  const scoreInfo = getScoreLabel(overallScore)
  const radialData = [{ value: overallScore, fill: scoreInfo.color }]

  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Health Score</h1>
        <Card className="text-center py-16">
          <CardContent>
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Add transactions to calculate your financial health score.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Health Score</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A composite score of your business financial health.
        </p>
      </div>

      {/* Score gauge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Gauge */}
            <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="90%"
                  startAngle={225}
                  endAngle={-45}
                  data={[{ value: 100, fill: 'var(--muted)' }, ...radialData]}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={false} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{overallScore}</span>
                <span className="text-xs text-muted-foreground">out of 100</span>
                <Badge
                  variant={scoreInfo.variant}
                  className="mt-1 text-xs"
                  style={{ background: scoreInfo.color, color: '#fff', border: 'none' }}
                >
                  {scoreInfo.label}
                </Badge>
              </div>
            </div>

            {/* Summary numbers */}
            <div className="flex-1 grid grid-cols-3 gap-4 w-full">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Income</p>
                <p className="text-xl font-bold text-accent">${totalIncome.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-destructive">${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Net Profit</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map((ind) => {
          const StatusIcon =
            ind.status === 'good' ? CheckCircle2 : ind.status === 'warning' ? AlertTriangle : XCircle
          const statusColor =
            ind.status === 'good' ? 'text-accent' : ind.status === 'warning' ? 'text-amber-500' : 'text-destructive'
          const barColor =
            ind.status === 'good' ? '#10B981' : ind.status === 'warning' ? '#F59E0B' : '#EF4444'

          return (
            <Card key={ind.label}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{ind.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ind.insight}</p>
                  </div>
                  <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${statusColor}`} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="text-xs font-semibold text-foreground">{ind.score}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${ind.score}%`, background: barColor }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {indicators
              .filter((i) => i.status !== 'good')
              .map((i) => (
                <li key={i.label} className="flex items-start gap-3 text-sm">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${i.status === 'warning' ? 'text-amber-500' : 'text-destructive'}`} />
                  <span className="text-foreground leading-relaxed">{i.insight}</span>
                </li>
              ))}
            {indicators.every((i) => i.status === 'good') && (
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
                <span className="text-foreground">All indicators are healthy. Keep up the great work!</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
