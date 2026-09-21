import type { Purchase } from '../types'

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const HEADER = ['日付', '品目', '店舗', '数量', '単価', '金額']

/**
 * 購入履歴をCSV文字列に変換する。品目名・店舗名は呼び出し側で解決して渡す。
 */
export function purchasesToCsv(
  purchases: Purchase[],
  itemNameById: Map<string, string>,
  storeNameById: Map<string, string>,
): string {
  const rows = purchases.map((p) => {
    const amount = p.unitPrice != null ? p.unitPrice * p.quantity : ''
    return [
      formatDate(p.date),
      itemNameById.get(p.itemId) ?? '',
      p.storeId ? (storeNameById.get(p.storeId) ?? '') : '',
      String(p.quantity),
      p.unitPrice != null ? String(p.unitPrice) : '',
      amount === '' ? '' : String(amount),
    ]
  })

  return [HEADER, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')
}
