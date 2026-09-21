import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { MinusIcon, PlusIcon, SearchIcon } from '../../components/icons'
import { PageHeader } from '../../components/PageHeader'
import { isBelowReorderPoint, nextStockAfterPurchase, nextStockAfterUse } from '../../domain/stock'
import { useCategories } from '../../hooks/useCategories'
import { useItems } from '../../hooks/useItems'
import { setItemStock } from '../../repositories/itemRepository'
import { addStockLog } from '../../repositories/stockLogRepository'

export function ItemList() {
  const items = useItems()
  const categories = useCategories()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = categoryId === 'all' || item.categoryId === categoryId
      return matchesQuery && matchesCategory
    })
  }, [items, query, categoryId])

  async function handleDecrement(itemId: string, currentStock: number) {
    const next = nextStockAfterUse(currentStock, 1)
    await setItemStock(itemId, next)
    await addStockLog(itemId, 'use', currentStock - next)
  }

  async function handleIncrement(itemId: string, currentStock: number) {
    const next = nextStockAfterPurchase(currentStock, 1)
    await setItemStock(itemId, next)
    await addStockLog(itemId, 'adjust', 1)
  }

  return (
    <div>
      <PageHeader
        title="品目"
        action={
          <Link to="/items/new">
            <Button className="!min-h-9 !px-3">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="space-y-3 px-4 py-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="品目名で検索"
            aria-label="品目名で検索"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryId('all')}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              categoryId === 'all'
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                categoryId === category.id
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-gray-200 px-4 dark:divide-gray-800">
        {filtered.map((item) => {
          const category = categories.find((c) => c.id === item.categoryId)
          const low = isBelowReorderPoint(item.stock, item.reorderPoint)
          return (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <Link to={`/items/${item.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {category && <span>{category.name}</span>}
                  {low && <Badge tone="danger">要補充</Badge>}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`${item.name}の在庫を1減らす`}
                  disabled={item.stock === 0}
                  onClick={() => handleDecrement(item.id, item.stock)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 disabled:opacity-40 dark:bg-gray-800"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-14 text-center text-sm tabular-nums">
                  {item.stock}
                  <span className="text-gray-400">{item.unit}</span>
                </span>
                <button
                  type="button"
                  aria-label={`${item.name}の在庫を1増やす`}
                  onClick={() => handleIncrement(item.id, item.stock)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="py-10 text-center text-sm text-gray-500">
            該当する品目がありません。
          </li>
        )}
      </ul>
    </div>
  )
}
