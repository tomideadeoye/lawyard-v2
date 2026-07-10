import React from 'react'
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const accent = '#a77c5c'
const dark = '#1e293b'
const muted = '#64748b'
const lightBg = '#f8fafc'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: dark,
  },
  header: {
    backgroundColor: accent,
    padding: 24,
    marginBottom: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRef: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 80,
    color: muted,
    fontSize: 9,
  },
  value: {
    fontWeight: 'bold',
    fontSize: 9,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    color: muted,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  colDesc: {
    flex: 1,
    fontSize: 9,
  },
  colAmount: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: dark,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bankBox: {
    backgroundColor: lightBg,
    padding: 12,
    marginTop: 20,
    borderRadius: 4,
  },
  bankTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 6,
  },
  bankText: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
    fontFamily: 'Courier',
  },
  bankNote: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    marginTop: 24,
  },
})

function InvoicePDF({ contactName, brandName, tierName, amount, reference }: {
  contactName: string
  brandName: string
  tierName: string
  amount: number
  reference: string
}) {
  const issuedDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const fmtAmount = `₦${amount.toLocaleString()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>INVOICE</Text>
          <Text style={styles.headerRef}>{reference}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Issued</Text>
          <Text style={styles.value}>{issuedDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.value}>{contactName} ({brandName})</Text>
        </View>

        <View style={styles.hr} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>Corporate Post — {tierName} Tier</Text>
          <Text style={styles.colAmount}>{fmtAmount}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalValue}>{fmtAmount}</Text>
        </View>

        <View style={styles.bankBox}>
          <Text style={styles.bankTitle}>Payment Instructions</Text>
          <Text style={styles.bankText}>Bank transfer to:</Text>
          <Text style={styles.bankText}>Lawyard Publishing Ltd</Text>
          <Text style={styles.bankText}>GTBank · 0123456789</Text>
          <Text style={styles.bankNote}>
            Use reference {reference} as payment narration.
          </Text>
        </View>

        <Text style={styles.footer}>Lawyard.org — Legal news and insights for Africa</Text>
      </Page>
    </Document>
  )
}

export async function generateInvoicePdf(params: {
  contactName: string
  brandName: string
  tierName: string
  amount: number
  reference: string
}): Promise<Buffer> {
  return renderToBuffer(<InvoicePDF {...params} />)
}
