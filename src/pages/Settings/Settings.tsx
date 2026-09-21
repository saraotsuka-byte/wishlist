import { useState } from 'react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { canDeleteCategory } from '../../domain/category'
import { useCategories } from '../../hooks/useCategories'
import { useItems } from '../../hooks/useItems'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../repositories/categoryRepository'
import { StoreManager } from './StoreManager'

export function Settings() {
  const categories = useCategories()
  const items = useItems()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    await createCategory(newName.trim())
    setNewName('')
  }

  function startEdit(id: string, name: string) {
    setEditingId(id)
    setEditingName(name)
  }

  async function saveEdit() {
    if (!editingId || !editingName.trim()) return
    await updateCategory(editingId, { name: editingName.trim() })
    setEditingId(null)
  }

  const pendingCategory = categories.find((c) => c.id === pendingDeleteId)
  const canDeletePending = pendingCategory
    ? canDeleteCategory(items, pendingCategory.id)
    : false

  async function confirmDelete() {
    if (pendingDeleteId && canDeletePending) {
      await deleteCategory(pendingDeleteId)
    }
    setPendingDeleteId(null)
  }

  return (
    <div>
      <PageHeader title="設定" />

      <div className="space-y-6 px-4 py-4">
        <section>
          <h2 className="mb-2 text-sm font-semibold">カテゴリ管理</h2>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-2 px-3 py-2">
                {editingId === category.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                    />
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
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{category.name}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(category.id, category.name)}
                      className="text-sm text-brand"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(category.id)}
                      className="text-sm text-red-600"
                    >
                      削除
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新しいカテゴリ名"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={handleAdd}>追加</Button>
          </div>
        </section>

        <StoreManager />

        <section>
          <h2 className="mb-2 text-sm font-semibold">データ管理</h2>
          <p className="text-sm text-gray-500">
            バックアップ／復元、CSV出力は次のフェーズで実装予定です。
          </p>
        </section>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="このカテゴリを削除しますか？"
        description={
          canDeletePending
            ? 'この操作は取り消せません。'
            : 'このカテゴリを使用している品目があるため削除できません。先に品目のカテゴリを変更してください。'
        }
        confirmLabel="削除する"
        confirmDisabled={!canDeletePending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
