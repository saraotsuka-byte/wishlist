import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { SearchIcon } from '../../components/icons'
import { MonthlyExpenseChart } from '../../components/MonthlyExpenseChart'
import { PageHeader } from '../../components/PageHeader'
import { type DashboardCategory, groupItemsByCategory } from '../../domain/dashboard'
import { computeMonthlyExpenses } from '../../domain/expense'
import { useAllPurchases } from '../../hooks/usePurchases'
import { useCategories } from '../../hooks/useCategories'
import { useItems } from '../../hooks/useItems'
import { usePredictions } from '../../hooks/usePredictions'
import type { Item } from '../../types'

const SECTION_META: Record<
  DashboardCategory,
  { title: string; tone: 'danger' | 'warning' | 'success'; empty: string }
> = {
  urgent: { title: '今すぐ買うべき', tone: 'danger', empty: '発注点を下回っている品目はありません。' },
  soon: { title: 'そろそろ買う', tone: 'warning', empty: '間もなく切れそうな品目はありません。' },
  sufficient: { title: '十分ある', tone: 'success', empty: '該当する品目はありません。' },
}

export function Dashboard() {
  const items = useItems()
  const categories = useCategories()
  const purchases = useAllPurchases()
  const daysUntilEmptyByItemId = usePredictions(items)

  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = categoryId === 'all' || item.categoryId === categoryId
      return matchesQuery && matchesCategory
    })
  }, [items, query, categoryId])

  const groups = useMemo(
    () => groupItemsByCategory(filteredItems, daysUntilEmptyByItemId),
    [filteredItems, daysUntilEmptyByItemId],
  )

  const monthlyExpenses = useMemo(
    () => computeMonthlyExpenses(purchases, Date.now(), 6),
    [purchases],
  )

  function categoryName(item: Item) {
    return categories.find((c) => c.id === item.categoryId)?.name
  }

  return (
    <div>
      <PageHeader title="ホーム" />

      <div className="space-y-6 px-4 py-4">
        <div className="space-y-3">
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

        {(['urgent', 'soon', 'sufficient'] as const).map((key) => {
          const meta = SECTION_META[key]
          const sectionItems = groups[key]
          return (
            <section key={key} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{meta.title}</h2>
                <Badge tone={meta.tone}>{sectionItems.length}件</Badge>
              </div>
              {sectionItems.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">{meta.empty}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sectionItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/items/${item.id}`}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900"
                      >
                        <span>
                          {item.name}
                          {categoryName(item) && (
                            <span className="ml-2 text-xs text-gray-400">{categoryName(item)}</span>
                          )}
                        </span>
                        <span className="text-gray-500">
                          在庫 {item.stock}
                          {item.unit}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}

        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-2 text-sm font-semibold">月ごとの支出</h2>
          <MonthlyExpenseChart data={monthlyExpenses} />
        </section>
      </div>
    </div>
  )
}
