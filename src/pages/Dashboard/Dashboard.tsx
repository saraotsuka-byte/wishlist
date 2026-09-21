import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { PageHeader } from '../../components/PageHeader'
import { isBelowReorderPoint } from '../../domain/stock'
import { useItems } from '../../hooks/useItems'

export function Dashboard() {
  const items = useItems()
  const lowStockItems = items.filter((item) => isBelowReorderPoint(item.stock, item.reorderPoint))

  return (
    <div>
      <PageHeader title="ホーム" />

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今すぐ買うべき</h2>
            <Badge tone="danger">{lowStockItems.length}件</Badge>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">今のところ発注点を下回っている品目はありません。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowStockItems.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/items/${item.id}`}
                    className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm dark:bg-red-950/40"
                  >
                    <span>{item.name}</span>
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

        <p className="text-center text-xs text-gray-400">
          ダッシュボードの詳細な区分・予測・支出グラフは今後追加されます。
        </p>

        <Link
          to="/items"
          className="block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium dark:border-gray-800"
        >
          品目一覧を見る
        </Link>
      </div>
    </div>
  )
}
