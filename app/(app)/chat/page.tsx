'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { addTransaction } from '@/lib/actions/transaction-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Send, CheckCircle2, Sparkles, Mic } from 'lucide-react'
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

import { parseTransactionAction } from '@/lib/actions/ai-actions'

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
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice recognition. Please try Chrome, Edge, or Safari.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev + (prev ? ' ' : '') + transcript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setInput('')

    startTransition(async () => {
      const res = await parseTransactionAction(text)

      if (!res.success || !res.parsed) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: res.error || "I couldn't understand that transaction. Try something like \"Paid $500 for marketing\" or \"Received $3,000 from client\".",
          },
        ])
        return
      }

      const parsed = res.parsed
      const assistantMsg: Message = {
        role: 'assistant',
        text: `Got it! Here's what I compiled with AI:`,
        parsed,
      }
      setMessages((m) => [...m, assistantMsg])
      setPendingEntry(parsed)
      setEditEntry({ ...parsed })
    })
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
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={handleVoice}
            disabled={!!pendingEntry || isPending}
            aria-label="Use voice input"
            className={cn(isListening && 'animate-pulse')}
          >
            <Mic className="w-4 h-4" />
          </Button>
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
