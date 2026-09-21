import { describe, expect, it } from 'vitest'
import type { Purchase } from '../types'
import { csvEscape, purchasesToCsv } from './csv'

describe('csvEscape', () => {
  it('カンマ・改行・ダブルクォートを含む場合は引用符で囲む', () => {
    expect(csvEscape('通常テキスト')).toBe('通常テキスト')
    expect(csvEscape('a,b')).toBe('"a,b"')
    expect(csvEscape('a"b')).toBe('"a""b"')
    expect(csvEscape('a\nb')).toBe('"a\nb"')
  })
})

describe('purchasesToCsv', () => {
  it('ヘッダーと各行を生成する', () => {
    const purchases: Purchase[] = [
      {
        id: 'p1',
        itemId: 'i1',
        storeId: 's1',
        quantity: 2,
        unitPrice: 100,
        date: new Date(2026, 8, 21).getTime(),
      },
    ]
    const itemNameById = new Map([['i1', '食器用洗剤']])
    const storeNameById = new Map([['s1', '近所のスーパー']])

    const csv = purchasesToCsv(purchases, itemNameById, storeNameById)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('日付,品目,店舗,数量,単価,金額')
    expect(lines[1]).toBe('2026-09-21,食器用洗剤,近所のスーパー,2,100,200')
  })

  it('単価未設定の場合は単価・金額を空にする', () => {
    const purchases: Purchase[] = [
      { id: 'p1', itemId: 'i1', quantity: 1, date: 0 },
    ]
    const csv = purchasesToCsv(purchases, new Map(), new Map())
    const lines = csv.split('\r\n')
    expect(lines[1]).toBe('1970-01-01,,,1,,')
  })

  it('品目名にカンマが含まれる場合はエスケープする', () => {
    const purchases: Purchase[] = [{ id: 'p1', itemId: 'i1', quantity: 1, date: 0 }]
    const csv = purchasesToCsv(purchases, new Map([['i1', 'A,B']]), new Map())
    expect(csv.split('\r\n')[1]).toContain('"A,B"')
  })
})
