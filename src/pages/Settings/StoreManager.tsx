import { useState } from 'react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { canDeleteStore } from '../../domain/store'
import { useItems } from '../../hooks/useItems'
import { useStores } from '../../hooks/useStores'
import { createStore, deleteStore, updateStore } from '../../repositories/storeRepository'

export function StoreManager() {
  const stores = useStores()
  const items = useItems()
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingUrl, setEditingUrl] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    await createStore(newName.trim(), newUrl.trim() || undefined)
    setNewName('')
    setNewUrl('')
  }

  function startEdit(id: string, name: string, url?: string) {
    setEditingId(id)
    setEditingName(name)
    setEditingUrl(url ?? '')
  }

  async function saveEdit() {
    if (!editingId || !editingName.trim()) return
    await updateStore(editingId, { name: editingName.trim(), url: editingUrl.trim() || undefined })
    setEditingId(null)
  }

  const pendingStore = stores.find((s) => s.id === pendingDeleteId)
  const canDeletePending = pendingStore ? canDeleteStore(items, pendingStore.id) : false

  async function confirmDelete() {
    if (pendingDeleteId && canDeletePending) {
      await deleteStore(pendingDeleteId)
    }
    setPendingDeleteId(null)
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">店舗管理</h2>
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {stores.map((store) => (
          <li key={store.id} className="px-3 py-2">
            {editingId === store.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="店名"
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
                <input
                  value={editingUrl}
                  onChange={(e) => setEditingUrl(e.target.value)}
                  placeholder="URL（任意）"
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
                <div className="flex gap-2">
                  <Button className="!min-h-9 !px-3" onClick={saveEdit}>
                    保存
                  </Button>
                  <Button
                    variant="secondary"
                    className="!min-h-9 !px-3"
                    onClick={() => setEditingId(null)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-sm">{store.name}</span>
                <button
                  type="button"
                  onClick={() => startEdit(store.id, store.name, store.url)}
                  className="text-sm text-brand"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(store.id)}
                  className="text-sm text-red-600"
                >
                  削除
                </button>
              </div>
            )}
          </li>
        ))}
        {stores.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-gray-500">店舗が未登録です。</li>
        )}
      </ul>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しい店名"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL（任意）"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <Button onClick={handleAdd}>追加</Button>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="この店舗を削除しますか？"
        description={
          canDeletePending
            ? 'この操作は取り消せません。'
            : 'この店舗をよく買う店として使用している品目があるため削除できません。'
        }
        confirmLabel="削除する"
        confirmDisabled={!canDeletePending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  )
}
