import type {
  Category,
  Item,
  ItemStorePrice,
  Purchase,
  ShoppingListEntry,
  StockLog,
  Store,
} from '../types'

export const BACKUP_VERSION = 1

export interface BackupPayload {
  categories: Category[]
  stores: Store[]
  items: Item[]
  itemStorePrices: ItemStorePrice[]
  stockLogs: StockLog[]
  purchases: Purchase[]
  shoppingListEntries: ShoppingListEntry[]
}

export interface BackupData extends BackupPayload {
  version: number
  exportedAt: number
}

export function serializeBackup(payload: BackupPayload, exportedAt: number): BackupData {
  return { version: BACKUP_VERSION, exportedAt, ...payload }
}

const REQUIRED_ARRAY_KEYS: (keyof BackupPayload)[] = [
  'categories',
  'stores',
  'items',
  'itemStorePrices',
  'stockLogs',
  'purchases',
  'shoppingListEntries',
]

export type ParseBackupResult =
  | { valid: true; data: BackupData }
  | { valid: false; error: string }

/**
 * JSONから読み込んだ値がバックアップデータとして妥当かを検証する。
 * バージョンが未対応、または必須フィールドが欠けている場合はエラーを返す。
 */
export function parseBackup(value: unknown): ParseBackupResult {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'JSON形式が不正です。' }
  }
  const obj = value as Record<string, unknown>

  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) {
    return { valid: false, error: '対応していないバックアップのバージョンです。' }
  }

  for (const key of REQUIRED_ARRAY_KEYS) {
    if (!Array.isArray(obj[key])) {
      return { valid: false, error: `必要なデータ（${key}）が見つかりません。` }
    }
  }

  return {
    valid: true,
    data: {
      version: obj.version,
      exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : Date.now(),
      categories: obj.categories as Category[],
      stores: obj.stores as Store[],
      items: obj.items as Item[],
      itemStorePrices: obj.itemStorePrices as ItemStorePrice[],
      stockLogs: obj.stockLogs as StockLog[],
      purchases: obj.purchases as Purchase[],
      shoppingListEntries: obj.shoppingListEntries as ShoppingListEntry[],
    },
  }
}
