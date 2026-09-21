# CLAUDE.md

このリポジトリで作業する際の指針。日用消耗品の在庫・買い物管理アプリ（consumables-app）。

## コマンド（PowerShell）

```powershell
npm install          # 依存インストール
npm run dev          # 開発サーバー起動 (Vite)
npm run build        # 型チェック + 本番ビルド
npm test             # Vitestでテスト実行（1回)
npm run test:watch   # Vitestをwatchモードで実行
npm run lint         # oxlintで静的解析
npm run preview      # ビルド成果物をローカルで確認
```

## 技術スタック

- React 19 + TypeScript + Vite
- Tailwind CSS v4（`@tailwindcss/vite` プラグイン、CSS-firstコンフィグ。`src/index.css` の `@theme` でブランドカラー等を定義）
- データ永続化: Dexie.js（IndexedDBラッパー）。バックエンドなし、全データは端末内。
- ルーティング: react-router-dom（`HashRouter`。静的ホスティングでもリロード時に404にならないよう採用）
- テスト: Vitest + Testing Library（jsdom環境）
- PWA: `vite-plugin-pwa`（フェーズ4で導入予定）

## ディレクトリ構成と設計方針

```
src/
  domain/        フレームワーク非依存の純粋関数。DB・UIに依存しない。全てユニットテストを書く。
  db/            Dexieスキーマ定義（schema.ts）、DBインスタンス（db.ts）、初期データ（seed.ts, defaultCategories.ts）
  types/         ドメイン型定義（Category, Item, Store, ItemStorePrice, StockLog, Purchase, ShoppingListEntry）
  repositories/  Dexieへの薄いアクセス層。CRUDのI/Oのみを担い、計算ロジックは持たない。
  hooks/         dexie-react-hooksのuseLiveQueryでrepositories/dbをReactに接続する薄いフック。
  pages/         画面コンポーネント（Dashboard, Items, ShoppingList, Settings）
  components/    ページ間で共有するUI部品（Button, ConfirmDialog, BottomNav, Badge, PageHeader, icons等)
  utils/         日付やID生成などの小さなユーティリティ
```

設計上の決定事項:

- **状態変更・計算ロジックは `domain/` に純粋関数として切り出す**。在庫増減、買い物リスト生成、購入完了処理、消費ペース予測、ダッシュボードの3区分振り分け、バックアップ/復元、CSV変換などはUIやDBから独立させ、Vitestでテストする。UIコンポーネントやrepositoriesはこれらの関数を呼び出すだけにする。
- **在庫は0を下限とする**。一覧の「－」ボタンによる使用記録（`StockLog.type = 'use'`）は在庫が0を下回らないようclampする（`domain/stock.ts` の `nextStockAfterUse`）。手動の「＋」は `type: 'adjust'` として記録し、買い物リストの購入完了処理でのみ `type: 'purchase'` を記録する。
- **カテゴリは常に存在する前提**。初回起動時（`categories`テーブルが空）に「サンプルデータを入れる／空で始める」を選択させ、いずれを選んでも既定の7カテゴリ（キッチン、洗面・バス、トイレ、洗濯、衛生用品、食品ストック、その他）を作成する（`db/defaultCategories.ts`）。
- **品目削除はカスケード削除**。関連する `stockLogs` / `purchases` / `itemStorePrices` / `shoppingListEntries` も同時に削除する（`repositories/itemRepository.ts` の `deleteItem`）。カテゴリ削除は、使用中の品目がある場合は不可（`domain/category.ts` の `canDeleteCategory`）。
- **「よく買う店」と価格情報**: `Item.preferredStoreId` は品目編集フォームでの既定選択に使う任意フィールド。実際の価格比較は `ItemStorePrice`（品目×店舗の組で価格を保持）で行い、複数店の価格を比較して最安値を強調表示する。
- **月次支出グラフは外部チャートライブラリを使わず自前の軽量SVGで実装する方針**（依存最小化のため。フェーズ3で実装）。
- **「そろそろ」提案（予測7日以内）に却下・スヌーズ機能は設けない**（シンプルさ優先の決定）。

## テスト方針

- `domain/*.ts` の各ファイルには対応する `*.test.ts` を必ず用意する。
- repositories・hooks・pages はDexie（IndexedDB）に依存するため、ロジックのユニットテストはdomain層に寄せ、UI層は手動のブラウザ確認で担保する。

## フェーズ進行

1. プロジェクト初期化・DB層・品目CRUD・在庫増減（完了）
2. 買い物リストと購入完了フロー・購入履歴
3. 使用ペース予測・ダッシュボード・支出グラフ
4. バックアップ/復元・CSV出力・PWA対応・仕上げ

## スコープ外（今回やらないこと）

ユーザー登録・ログイン、クラウド同期、複数端末のリアルタイム共有、バーコード読み取り、通販サイト連携、プッシュ通知。将来拡張しやすいよう、DBアクセスは `repositories/` に閉じ込めてある。
