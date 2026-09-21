import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { MinusIcon, PlusIcon } from '../../components/icons'
import { PageHeader } from '../../components/PageHeader'
import { isBelowReorderPoint, nextStockAfterPurchase, nextStockAfterUse } from '../../domain/stock'
import { useCategories } from '../../hooks/useCategories'
import { useItem } from '../../hooks/useItems'
import { useItemStorePrices } from '../../hooks/useItemStorePrices'
import { usePurchasesByItem } from '../../hooks/usePurchases'
import { useStockLogsByItem } from '../../hooks/useStockLogs'
import { useStores } from '../../hooks/useStores'
import { setItemStock } from '../../repositories/itemRepository'
import { addStockLog } from '../../repositories/stockLogRepository'

const LOG_TYPE_LABEL: Record<string, string> = {
  use: '使用',
  purchase: '購入',
  adjust: '手動修正',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useItem(id)
  const categories = useCategories()
  const stores = useStores()
  const prices = useItemStorePrices(id)
  const logs = useStockLogsByItem(id)
  const purchases = usePurchasesByItem(id)

  if (!item) {
    return (
      <div>
        <PageHeader title="品目" onBack />
        <p className="px-4 py-6 text-sm text-gray-500">品目が見つかりませんでした。</p>
      </div>
    )
  }

  const category = categories.find((c) => c.id === item.categoryId)
  const low = isBelowReorderPoint(item.stock, item.reorderPoint)
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.lastPrice)) : undefined
  const nonPurchaseLogs = logs.filter((log) => log.type !== 'purchase')

  async function handleDecrement() {
    if (!item) return
    const next = nextStockAfterUse(item.stock, 1)
    await setItemStock(item.id, next)
    await addStockLog(item.id, 'use', item.stock - next)
  }

  async function handleIncrement() {
    if (!item) return
    const next = nextStockAfterPurchase(item.stock, 1)
    await setItemStock(item.id, next)
    await addStockLog(item.id, 'adjust', 1)
  }

  return (
    <div>
      <PageHeader
        title={item.name}
        onBack
        action={
          <button
            type="button"
            onClick={() => navigate(`/items/${item.id}/edit`)}
            className="text-sm font-medium text-brand"
          >
            編集
          </button>
        }
      />

      <div className="space-y-6 px-4 py-4">
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{category?.name ?? '未分類'}</p>
              {low && (
                <div className="mt-1">
                  <Badge tone="danger">要補充</Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="在庫を1減らす"
                disabled={item.stock === 0}
                onClick={handleDecrement}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-40 dark:bg-gray-800"
              >
                <MinusIcon className="h-5 w-5" />
              </button>
              <span className="w-16 text-center text-xl font-semibold tabular-nums">
                {item.stock}
                <span className="text-sm font-normal text-gray-400">{item.unit}</span>
              </span>
              <button
                type="button"
                aria-label="在庫を1増やす"
                onClick={handleIncrement}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">発注点</dt>
              <dd>
                {item.reorderPoint}
                {item.unit}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">標準購入数</dt>
              <dd>
                {item.defaultPurchaseQty}
                {item.unit}
              </dd>
            </div>
          </dl>
          {item.note && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{item.note}</p>}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">店舗別価格</h2>
          {prices.length === 0 ? (
            <p className="text-sm text-gray-500">価格情報はまだありません。</p>
          ) : (
            <ul className="space-y-2">
              {prices.map((p) => {
                const store = stores.find((s) => s.id === p.storeId)
                const isMin = p.lastPrice === minPrice
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
                  >
                    <span>{store?.name ?? '店舗不明'}</span>
                    <span className={isMin ? 'font-semibold text-green-700 dark:text-green-400' : ''}>
                      ¥{p.lastPrice.toLocaleString()}
                      {isMin && ' (最安)'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">購入履歴</h2>
          {purchases.length === 0 ? (
            <p className="text-sm text-gray-500">まだ購入履歴がありません。</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {purchases.map((purchase) => {
                const store = stores.find((s) => s.id === purchase.storeId)
                return (
                  <li key={purchase.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span>{formatDate(purchase.date)}</span>
                    <span className="text-gray-500">{store?.name ?? '店舗未指定'}</span>
                    <span className="tabular-nums">
                      {purchase.quantity}
                      {item.unit}
                      {purchase.unitPrice != null && ` / ¥${purchase.unitPrice.toLocaleString()}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">使用・調整履歴</h2>
          {nonPurchaseLogs.length === 0 ? (
            <p className="text-sm text-gray-500">まだ履歴がありません。</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {nonPurchaseLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{formatDate(log.date)}</span>
                  <span className="text-gray-500">{LOG_TYPE_LABEL[log.type] ?? log.type}</span>
                  <span className="tabular-nums">
                    {log.type === 'use' ? '-' : '+'}
                    {log.quantity}
                    {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link to="/items" className="block text-center text-sm text-brand">
          品目一覧に戻る
        </Link>
      </div>
    </div>
  )
}
