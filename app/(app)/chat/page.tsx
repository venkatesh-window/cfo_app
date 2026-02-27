'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { addTransaction } from '@/lib/actions/transaction-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Send, CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type ParsedEntry = {
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
}

type Message =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; parsed?: ParsedEntry }

const CATEGORIES = [
  'Sales', 'Services', 'Rent', 'Utilities', 'Payroll', 'Marketing',
  'Supplies', 'Travel', 'Meals', 'Software', 'Equipment', 'Taxes',
  'Loans', 'Insurance', 'Other',
]

function parseNaturalLanguage(text: string): ParsedEntry | null {
  const lower = text.toLowerCase()

  // Detect income keywords
  const isIncome =
    /\b(received|earned|got paid|income|revenue|sale|sold|collected|invoiced|payment from|deposit)\b/.test(lower)
  const isExpense =
    /\b(paid|spent|bought|purchased|expense|cost|charge|bill|invoice|subscription|rent|salary|payroll)\b/.test(lower)

  // Extract amount
  const amountMatch = text.match(/\$?([\d,]+(?:\.\d{1,2})?)\s*(?:k|thousand)?/i)
  if (!amountMatch) return null
  let amount = parseFloat(amountMatch[1].replace(/,/g, ''))
  if (/k|thousand/i.test(amountMatch[0])) amount *= 1000

  // Determine type
  const type: 'income' | 'expense' = isIncome && !isExpense ? 'income' : 'expense'

  // Infer category
  let category = 'Other'
  if (/rent|lease/i.test(lower)) category = 'Rent'
  else if (/utility|utilities|electricity|water|internet|phone/i.test(lower)) category = 'Utilities'
  else if (/payroll|salary|wage|staff|employee/i.test(lower)) category = 'Payroll'
  else if (/marketing|ads?|advertising/i.test(lower)) category = 'Marketing'
  else if (/software|subscription|saas/i.test(lower)) category = 'Software'
  else if (/supplies|stationery/i.test(lower)) category = 'Supplies'
  else if (/travel|flight|hotel|accommodation/i.test(lower)) category = 'Travel'
  else if (/meal|food|lunch|dinner|restaurant|coffee/i.test(lower)) category = 'Meals'
  else if (/equipment|machine|hardware/i.test(lower)) category = 'Equipment'
  else if (/tax|taxes|irs|gst|vat/i.test(lower)) category = 'Taxes'
  else if (/loan|mortgage|debt/i.test(lower)) category = 'Loans'
  else if (/insurance/i.test(lower)) category = 'Insurance'
  else if (/sale|sold|revenue|service|invoice|client/i.test(lower)) {
    category = type === 'income' ? 'Sales' : 'Services'
  }

  // Description: remove amount from text
  const description = text
    .replace(/\$[\d,]+(?:\.\d{1,2})?(?:\s*(?:k|thousand))?/gi, '')
    .replace(/[\d,]+(?:\.\d{1,2})?\s*(?:k|thousand)/gi, '')
    .trim()
    .replace(/\s{2,}/g, ' ')
    || text

  const date = new Date().toISOString().split('T')[0]

  return { description, amount, type, category, date }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm your transaction assistant. Just describe what happened — like \"Received $2,500 from client invoice\" or \"Paid $800 for office rent\" — and I'll record it for you.",
    },
  ])
  const [input, setInput] = useState('')
  const [pendingEntry, setPendingEntry] = useState<ParsedEntry | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editEntry, setEditEntry] = useState<ParsedEntry | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setInput('')

    const parsed = parseNaturalLanguage(text)

    if (!parsed) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "I couldn't detect an amount in that message. Try something like \"Paid $500 for marketing\" or \"Received $3,000 from client\".",
        },
      ])
      return
    }

    const assistantMsg: Message = {
      role: 'assistant',
      text: `Got it! Here's what I parsed:`,
      parsed,
    }
    setMessages((m) => [...m, assistantMsg])
    setPendingEntry(parsed)
    setEditEntry({ ...parsed })
  }

  function handleConfirm() {
    if (!editEntry) return
    startTransition(async () => {
      await addTransaction(editEntry)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `Transaction saved! "${editEntry.description}" for $${editEntry.amount.toLocaleString()} (${editEntry.type}) has been added to your ledger.`,
        },
      ])
      setPendingEntry(null)
      setEditEntry(null)
    })
  }

  function handleCancel() {
    setMessages((m) => [
      ...m,
      { role: 'assistant', text: "No problem! Let me know if you'd like to record something else." },
    ])
    setPendingEntry(null)
    setEditEntry(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Transaction</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Describe a transaction in plain English and I'll record it.
        </p>
      </div>

      {/* Chat window */}
      <div className="border border-border rounded-xl bg-card flex flex-col overflow-hidden" style={{ height: '60vh', minHeight: '400px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className="max-w-sm space-y-2">
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  )}
                >
                  {msg.text}
                </div>

                {/* Parsed entry card */}
                {msg.role === 'assistant' && msg.parsed && editEntry && pendingEntry && (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-muted-foreground">Description</label>
                        <input
                          className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background mt-0.5"
                          value={editEntry.description}
                          onChange={(e) => setEditEntry({ ...editEntry, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Amount ($)</label>
                        <input
                          type="number"
                          className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background mt-0.5"
                          value={editEntry.amount}
                          onChange={(e) => setEditEntry({ ...editEntry, amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Type</label>
                        <select
                          className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background mt-0.5"
                          value={editEntry.type}
                          onChange={(e) => setEditEntry({ ...editEntry, type: e.target.value as 'income' | 'expense' })}
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Category</label>
                        <select
                          className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background mt-0.5"
                          value={editEntry.category}
                          onChange={(e) => setEditEntry({ ...editEntry, category: e.target.value })}
                        >
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Date</label>
                        <input
                          type="date"
                          className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background mt-0.5"
                          value={editEntry.date}
                          onChange={(e) => setEditEntry({ ...editEntry, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleConfirm} disabled={isPending} className="flex-1">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {isPending ? 'Saving…' : 'Confirm & Save'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3 flex gap-2 bg-background">
          <Input
            placeholder="e.g. Received $2,500 from client ABC…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !pendingEntry) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={!!pendingEntry || isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !!pendingEntry || isPending}
            size="icon"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick examples */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try saying…</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Received $5,000 from client invoice',
            'Paid $800 office rent for March',
            'Spent $200 on marketing ads',
            'Earned $1,500 from consulting services',
            'Paid $3,200 payroll to team',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              disabled={!!pendingEntry}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
