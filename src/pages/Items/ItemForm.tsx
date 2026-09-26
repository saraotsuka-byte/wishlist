import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { useCategories } from '../../hooks/useCategories'
import { useItem } from '../../hooks/useItems'
import { useItemStorePrices } from '../../hooks/useItemStorePrices'
import { useStores } from '../../hooks/useStores'
import { createCategory } from '../../repositories/categoryRepository'
import { createItem, deleteItem, updateItem } from '../../repositories/itemRepository'
import { upsertPrice } from '../../repositories/itemStorePriceRepository'
import { createStore } from '../../repositories/storeRepository'

const NEW_CATEGORY = '__new_category__'
const NEW_STORE = '__new_store__'

export function ItemForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const existing = useItem(id)
  const categories = useCategories()
  const stores = useStores()
  const prices = useItemStorePrices(id)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [unit, setUnit] = useState('')
  const [stock, setStock] = useState('0')
  const [reorderPoint, setReorderPoint] = useState('0')
  const [defaultPurchaseQty, setDefaultPurchaseQty] = useState('1')
  const [note, setNote] = useState('')
  const [storeId, setStoreId] = useState('')
  const [newStoreName, setNewStoreName] = useState('')
  const [referencePrice, setReferencePrice] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setCategoryId(existing.categoryId)
      setUnit(existing.unit)
      setStock(String(existing.stock))
      setReorderPoint(String(existing.reorderPoint))
      setDefaultPurchaseQty(String(existing.defaultPurchaseQty))
      setNote(existing.note ?? '')
      setStoreId(existing.preferredStoreId ?? '')
    } else if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, categories])

  useEffect(() => {
    if (storeId && prices.length > 0) {
      const price = prices.find((p) => p.storeId === storeId)
      if (price) setReferencePrice(String(price.lastPrice))
    }
  }, [storeId, prices])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !unit.trim()) return
    setSaving(true)
    try {
      let finalCategoryId = categoryId
      if (categoryId === NEW_CATEGORY) {
        if (!newCategoryName.trim()) {
          setSaving(false)
          return
        }
        const created = await createCategory(newCategoryName.trim())
        finalCategoryId = created.id
      }

      let finalStoreId = storeId
      if (storeId === NEW_STORE) {
        if (newStoreName.trim()) {
          const created = await createStore(newStoreName.trim())
          finalStoreId = created.id
        } else {
          finalStoreId = ''
        }
      }

      const payload = {
        name: name.trim(),
        categoryId: finalCategoryId,
        unit: unit.trim(),
        stock: Math.max(0, Number(stock) || 0),
        reorderPoint: Math.max(0, Number(reorderPoint) || 0),
        defaultPurchaseQty: Math.max(1, Number(defaultPurchaseQty) || 1),
        note: note.trim() || undefined,
        preferredStoreId: finalStoreId || undefined,
      }

      let itemId = id
      if (isEditing && id) {
        await updateItem(id, payload)
      } else {
        const created = await createItem(payload)
        itemId = created.id
      }

      if (itemId && finalStoreId && referencePrice.trim() !== '') {
        const priceValue = Number(referencePrice)
        if (!Number.isNaN(priceValue) && priceValue >= 0) {
          await upsertPrice(itemId, finalStoreId, priceValue)
        }
      }

      navigate(itemId ? `/items/${itemId}` : '/items')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    await deleteItem(id)
    navigate('/items')
  }

  return (
    <div>
      <PageHeader title={isEditing ? '品目を編集' : '品目を登録'} onBack />

      <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4">
        <div>
          <label htmlFor="item-name" className="mb-1 block text-sm font-medium">
            名前 <span className="text-red-600">*</span>
          </label>
          <input
            id="item-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor="item-category" className="mb-1 block text-sm font-medium">
            カテゴリ
          </label>
          <select
            id="item-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ 新しいカテゴリを追加</option>
          </select>
          {categoryId === NEW_CATEGORY && (
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="新しいカテゴリ名"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          )}
        </div>

        <div>
          <label htmlFor="item-unit" className="mb-1 block text-sm font-medium">
            単位 <span className="text-red-600">*</span>
          </label>
          <input
            id="item-unit"
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="個, 本, 袋, ロールなど"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="item-stock" className="mb-1 block text-sm font-medium">
              現在の在庫
            </label>
            <input
              id="item-stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label htmlFor="item-reorder" className="mb-1 block text-sm font-medium">
              発注点
            </label>
            <input
              id="item-reorder"
              type="number"
              min={0}
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label htmlFor="item-default-qty" className="mb-1 block text-sm font-medium">
              標準購入数
            </label>
            <input
              id="item-default-qty"
              type="number"
              min={1}
              value={defaultPurchaseQty}
              onChange={(e) => setDefaultPurchaseQty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="item-store" className="mb-1 block text-sm font-medium">
            よく買う店（任意）
          </label>
          <select
            id="item-store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">選択しない</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value={NEW_STORE}>+ 新しい店を追加</option>
          </select>
          {storeId === NEW_STORE && (
            <input
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              placeholder="新しい店名"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          )}
        </div>

        {storeId && (
          <div>
            <label htmlFor="item-price" className="mb-1 block text-sm font-medium">
              参考価格（円・任意）
            </label>
            <input
              id="item-price"
              type="number"
              min={0}
              value={referencePrice}
              onChange={(e) => setReferencePrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
        )}

        <div>
          <label htmlFor="item-note" className="mb-1 block text-sm font-medium">
            メモ
          </label>
          <textarea
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {isEditing ? '更新する' : '登録する'}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              削除
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="この品目を削除しますか？"
        description="在庫・購入履歴・使用履歴もすべて削除されます。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
