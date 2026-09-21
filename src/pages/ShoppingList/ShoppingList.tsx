import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { useAllItemStorePrices } from '../../hooks/useAllItemStorePrices'
import { useItems } from '../../hooks/useItems'
import { usePredictions } from '../../hooks/usePredictions'
import { useShoppingListEntries } from '../../hooks/useShoppingList'
import { useStores } from '../../hooks/useStores'
import { syncShoppingListEntries, type CheckedEntryInput } from '../../domain/shoppingList'
import {
  addManualEntry,
  bulkAddEntries,
  bulkRemoveEntries,
  bulkUpdateReason,
  completePurchase,
  removeEntry,
  setEntryChecked,
  updateEntryQuantity,
} from '../../repositories/shoppingListRepository'
import type { ShoppingListEntry } from '../../types'

const NO_STORE_KEY = '__no_store__'
const REASON_LABEL: Record<string, string> = {
  reorder: '発注点以下',
  soon: 'そろそろ',
  manual: '手動追加',
}

export function ShoppingList() {
  const items = useItems()
  const entries = useShoppingListEntries()
  const stores = useStores()
  const prices = useAllItemStorePrices()
  const daysUntilEmptyByItemId = usePredictions(items)

  const [addingItemId, setAddingItemId] = useState('')
  const [addingQty, setAddingQty] = useState(1)
  const [pendingCompleteStoreKey, setPendingCompleteStoreKey] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    const { toAdd, toRemoveIds, toUpdateReason } = syncShoppingListEntries(
      items,
      entries,
      Date.now(),
      daysUntilEmptyByItemId,
    )
    if (toAdd.length > 0) void bulkAddEntries(toAdd)
    if (toRemoveIds.length > 0) void bulkRemoveEntries(toRemoveIds)
    if (toUpdateReason.length > 0) void bulkUpdateReason(toUpdateReason)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, entries, daysUntilEmptyByItemId])

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const groups = useMemo(() => {
    const map = new Map<string, { store: { id: string; name: string } | null; entries: ShoppingListEntry[] }>()
    for (const entry of entries) {
      const item = itemById.get(entry.itemId)
      const store = item?.preferredStoreId
        ? stores.find((s) => s.id === item.preferredStoreId) ?? null
        : null
      const key = store?.id ?? NO_STORE_KEY
      if (!map.has(key)) {
        map.set(key, { store: store ? { id: store.id, name: store.name } : null, entries: [] })
      }
      map.get(key)!.entries.push(entry)
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a === NO_STORE_KEY ? 1 : b === NO_STORE_KEY ? -1 : 0))
  }, [entries, itemById, stores])

  const itemsNotInList = items.filter((item) => !entries.some((e) => e.itemId === item.id))

  async function handleAddManual() {
    if (!addingItemId || addingQty <= 0) return
    await addManualEntry(addingItemId, addingQty)
    setAddingItemId('')
    setAddingQty(1)
  }

  function buildCheckedInput(groupEntries: ShoppingListEntry[], storeId: string | undefined): CheckedEntryInput[] {
    return groupEntries
      .filter((e) => e.checked)
      .map((e) => {
        const price = storeId
          ? prices.find((p) => p.itemId === e.itemId && p.storeId === storeId)
          : undefined
        return {
          entryId: e.id,
          itemId: e.itemId,
          quantity: e.quantity,
          storeId,
          unitPrice: price?.lastPrice,
        }
      })
  }

  async function handleCompletePurchase(storeKey: string) {
    const group = groups.find(([key]) => key === storeKey)
    if (!group) return
    const [, { store, entries: groupEntries }] = group
    const checkedInput = buildCheckedInput(groupEntries, store?.id)
    if (checkedInput.length === 0) return
    await completePurchase(checkedInput)
    setPendingCompleteStoreKey(null)
  }

  return (
    <div>
      <PageHeader title="買い物リスト" />

      <div className="space-y-6 px-4 py-4">
        {entries.length === 0 && (
          <p className="text-sm text-gray-500">
            買い物リストは空です。在庫が発注点以下になると自動で表示されます。
          </p>
        )}

        {groups.map(([key, { store, entries: groupEntries }]) => {
          const checkedCount = groupEntries.filter((e) => e.checked).length
          return (
            <section key={key} className="rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                <h2 className="text-sm font-semibold">{store?.name ?? 'その他'}</h2>
                <Button
                  className="!min-h-9 !px-3 text-sm"
                  disabled={checkedCount === 0}
                  onClick={() => setPendingCompleteStoreKey(key)}
                >
                  購入完了 ({checkedCount})
                </Button>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {groupEntries.map((entry) => {
                  const item = itemById.get(entry.itemId)
                  if (!item) return null
                  return (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        key={`${entry.id}-${entry.checked}`}
                        type="checkbox"
                        aria-label={`${item.name}を購入済みにする`}
                        defaultChecked={entry.checked}
                        onChange={(e) => setEntryChecked(entry.id, e.target.checked)}
                        className="h-5 w-5 shrink-0 accent-brand"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <Badge
                          tone={
                            entry.reason === 'manual'
                              ? 'neutral'
                              : entry.reason === 'soon'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {REASON_LABEL[entry.reason]}
                        </Badge>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={entry.quantity}
                        onChange={(e) =>
                          updateEntryQuantity(entry.id, Math.max(1, Number(e.target.value)))
                        }
                        aria-label={`${item.name}の購入数`}
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                      <span className="w-6 text-xs text-gray-400">{item.unit}</span>
                      <button
                        type="button"
                        aria-label={`${item.name}をリストから外す`}
                        onClick={() => removeEntry(entry.id)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        削除
                      </button>
                    </li>
                  )
                })}
              </ul>

              <ConfirmDialog
                open={pendingCompleteStoreKey === key}
                title="購入完了にしますか？"
                description="チェックした品目の在庫が加算され、購入履歴に記録されます。"
                confirmLabel="購入完了にする"
                danger={false}
                onConfirm={() => handleCompletePurchase(key)}
                onCancel={() => setPendingCompleteStoreKey(null)}
              />
            </section>
          )
        })}

        <section className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
          <h2 className="mb-2 text-sm font-semibold">品目を手動で追加</h2>
          <div className="flex gap-2">
            <select
              value={addingItemId}
              onChange={(e) => setAddingItemId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">品目を選択</option>
              {itemsNotInList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={addingQty}
              onChange={(e) => setAddingQty(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={handleAddManual} disabled={!addingItemId}>
              追加
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
