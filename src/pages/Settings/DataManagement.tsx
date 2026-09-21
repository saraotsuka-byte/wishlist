import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { parseBackup, type ParseBackupResult } from '../../domain/backup'
import { purchasesToCsv } from '../../domain/csv'
import { useAllPurchases } from '../../hooks/usePurchases'
import { useCategories } from '../../hooks/useCategories'
import { useItems } from '../../hooks/useItems'
import { useStores } from '../../hooks/useStores'
import { exportAllData, importAllData } from '../../repositories/backupRepository'
import { downloadTextFile } from '../../utils/download'

function timestampForFilename(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function DataManagement() {
  const items = useItems()
  const stores = useStores()
  const categories = useCategories()
  const purchases = useAllPurchases()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pendingRestoreData, setPendingRestoreData] = useState<ParseBackupResult | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoreDone, setRestoreDone] = useState(false)

  async function handleExportBackup() {
    const data = await exportAllData()
    downloadTextFile(
      `consumables-backup-${timestampForFilename()}.json`,
      JSON.stringify(data, null, 2),
      'application/json',
    )
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setRestoreError(null)
    setRestoreDone(false)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const result = parseBackup(json)
      if (!result.valid) {
        setRestoreError(result.error)
        return
      }
      setPendingRestoreData(result)
    } catch {
      setRestoreError('ファイルを読み込めませんでした。JSON形式のバックアップファイルを選択してください。')
    }
  }

  async function confirmRestore() {
    if (!pendingRestoreData || !pendingRestoreData.valid) return
    await importAllData(pendingRestoreData.data)
    setPendingRestoreData(null)
    setRestoreDone(true)
  }

  function handleExportCsv() {
    if (purchases.length === 0) return
    const itemNameById = new Map(items.map((i) => [i.id, i.name]))
    const storeNameById = new Map(stores.map((s) => [s.id, s.name]))
    const csv = purchasesToCsv(purchases, itemNameById, storeNameById)
    downloadTextFile(`purchases-${timestampForFilename()}.csv`, `﻿${csv}`, 'text/csv')
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">データ管理</h2>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        カテゴリ {categories.length}件・品目 {items.length}件・購入履歴 {purchases.length}件
      </p>

      <div className="space-y-3">
        <div>
          <Button variant="secondary" onClick={handleExportBackup} className="w-full">
            バックアップをJSONでダウンロード
          </Button>
        </div>

        <div>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            バックアップから復元
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileSelected}
            className="hidden"
          />
          {restoreError && <p className="mt-1 text-xs text-red-600">{restoreError}</p>}
          {restoreDone && (
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">復元が完了しました。</p>
          )}
        </div>

        <div>
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            disabled={purchases.length === 0}
            className="w-full"
          >
            購入履歴をCSVでエクスポート
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingRestoreData !== null}
        title="バックアップから復元しますか？"
        description="現在端末に保存されているすべてのデータが、選択したバックアップの内容で上書きされます。この操作は取り消せません。"
        confirmLabel="復元する（上書きする）"
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestoreData(null)}
      />
    </section>
  )
}
