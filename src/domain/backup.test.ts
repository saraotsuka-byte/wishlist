import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, parseBackup, serializeBackup, type BackupPayload } from './backup'

function emptyPayload(): BackupPayload {
  return {
    categories: [],
    stores: [],
    items: [],
    itemStorePrices: [],
    stockLogs: [],
    purchases: [],
    shoppingListEntries: [],
  }
}

describe('serializeBackup', () => {
  it('バージョンとエクスポート日時を付与する', () => {
    const result = serializeBackup(emptyPayload(), 12345)
    expect(result.version).toBe(BACKUP_VERSION)
    expect(result.exportedAt).toBe(12345)
    expect(result.categories).toEqual([])
  })
})

describe('parseBackup', () => {
  it('正しいバックアップデータを妥当と判定する', () => {
    const backup = serializeBackup(emptyPayload(), 1000)
    const result = parseBackup(JSON.parse(JSON.stringify(backup)))
    expect(result.valid).toBe(true)
  })

  it('オブジェクトでない値は不正', () => {
    expect(parseBackup(null).valid).toBe(false)
    expect(parseBackup('文字列').valid).toBe(false)
  })

  it('versionが数値でない、または新しすぎる場合は不正', () => {
    expect(parseBackup({ version: 'x' }).valid).toBe(false)
    expect(parseBackup({ version: BACKUP_VERSION + 1 }).valid).toBe(false)
  })

  it('必須の配列フィールドが欠けている場合は不正', () => {
    const result = parseBackup({ version: BACKUP_VERSION, categories: [] })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('stores')
    }
  })
})
