'use client'

import { useState, useTransition, useMemo } from 'react'
import { type Transaction, deleteTransaction, updateTransaction, addTransaction } from '@/lib/actions/transaction-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowUpRight, ArrowDownRight, Trash2, Pencil, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'Sales', 'Services', 'Rent', 'Utilities', 'Payroll', 'Marketing',
  'Supplies', 'Travel', 'Meals', 'Software', 'Equipment', 'Taxes',
  'Loans', 'Insurance', 'Other',
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

type EntryForm = {
  date: string
  description: string
  amount: string
  type: 'income' | 'expense'
  category: string
}

const emptyForm = (): EntryForm => ({
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: '',
  type: 'expense',
  category: 'Other',
})

export default function LedgerClient({ transactions: initial }: { transactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<EntryForm>(emptyForm())
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' || t.type === filterType
      const matchCat = filterCategory === 'all' || t.category === filterCategory
      return matchSearch && matchType && matchCat
    })
  }, [transactions, search, filterType, filterCategory])

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setForm({
      date: t.date.split('T')[0],
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      category: t.category,
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    })
  }

  function handleSaveEdit() {
    if (!editingId) return
    startTransition(async () => {
      const data = {
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
      }
      await updateTransaction(editingId, data)
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, ...data } : t))
      )
      setEditingId(null)
    })
  }

  function handleAdd() {
    startTransition(async () => {
      await addTransaction({
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
      })
      setAddOpen(false)
      setForm(emptyForm())
      router.refresh()
    })
  }

  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {transactions.length} total transactions
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm()); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No transactions match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.description}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-normal">{t.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                        {t.type === 'income'
                          ? <ArrowUpRight className="w-3.5 h-3.5" />
                          : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(t.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isPending || !form.description || !form.amount}>
              {isPending ? 'Adding…' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TransactionForm({
  form,
  setForm,
}: {
  form: EntryForm
  setForm: React.Dispatch<React.SetStateAction<EntryForm>>
}) {
  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label>Description</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="e.g. Office rent"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Amount ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Date</Label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={form.type}
          onValueChange={(v) => setForm((f) => ({ ...f, type: v as 'income' | 'expense' }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
