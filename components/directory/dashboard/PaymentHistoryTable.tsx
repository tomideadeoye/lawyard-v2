'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  plan_name: string
  plan_role: string
  created_at: string
}

interface PaymentHistoryTableProps {
  transactions: Transaction[]
}

const STATUS_STYLES: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  success: 'default',
  completed: 'default',
  pending: 'secondary',
  failed: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  success: 'Paid',
  completed: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

export function PaymentHistoryTable({ transactions }: PaymentHistoryTableProps) {
  return (
    <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          {transactions.length > 0
            ? `Your recent payments and invoices (${transactions.length} total)`
            : 'No payment history yet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t made any payments yet. When you purchase a plan, transactions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="hidden sm:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{tx.plan_name}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                      {tx.reference.slice(0, 12)}…
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {tx.currency === 'USD' ? '$' : '₦'}
                      {Number(tx.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_STYLES[tx.status] ?? 'outline'}>
                        {STATUS_LABELS[tx.status] ?? tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
