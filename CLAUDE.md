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
- PWA: `vite-plugin-pwa`（`registerType: 'autoUpdate'`。`src/main.tsx` で `virtual:pwa-register` の `registerSW` を呼び出してService Workerを登録する）
- デプロイ: GitHub Pages（`.github/workflows/deploy.yml` が `main` / `claude/youthful-maxwell-c86w1r` へのpushでテスト・ビルド・公開を自動実行）。プロジェクトページとして配信されるため `vite.config.ts` の `base: '/wishlist/'` が必須（リポジトリ名を変更した場合はここも合わせて変更する）。初回のみリポジトリの Settings → Pages → Source を「GitHub Actions」に設定する必要がある（APIで設定する権限がなく手動対応）。

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

- **配色（ブランドカラー）**: `src/index.css` の `--color-brand: #D87474`（コーラル/赤系）。ボタンのhover/active、カテゴリ削除リンク等の「暗い」状態には補助色 `#B33232` を使う。月次支出グラフのバー色と、買い物リストの「手動追加」バッジには補助色のティール（`#74D8D8` / 明るい `#AFE9E9`）を使用する。**「今すぐ買うべき」「そろそろ買う」「十分ある」を表す `Badge` の `danger`/`warning`/`success` トーン（赤・黄・緑、`components/Badge.tsx`）、および削除ボタン等の汎用的な危険色（`red-600`系）・成功メッセージ（`green-700`系）は、これらの配色変更の対象外**（ユーザー指示により、在庫状況を示す3色の意味付けを崩さないため）。PWAアイコン・favicon・マニフェスト/メタタグの `theme_color` も同じブランドカラーに統一する。

- **状態変更・計算ロジックは `domain/` に純粋関数として切り出す**。在庫増減、買い物リスト生成、購入完了処理、消費ペース予測、ダッシュボードの3区分振り分け、バックアップ/復元、CSV変換などはUIやDBから独立させ、Vitestでテストする。UIコンポーネントやrepositoriesはこれらの関数を呼び出すだけにする。
- **在庫は0を下限とする**。一覧の「－」ボタンによる使用記録（`StockLog.type = 'use'`）は在庫が0を下回らないようclampする（`domain/stock.ts` の `nextStockAfterUse`）。手動の「＋」は `type: 'adjust'` として記録し、買い物リストの購入完了処理でのみ `type: 'purchase'` を記録する。
- **カテゴリは常に存在する前提**。初回起動時（`categories`テーブルが空）に「サンプルデータを入れる／空で始める」を選択させ、いずれを選んでも既定の7カテゴリ（キッチン、洗面・バス、トイレ、洗濯、衛生用品、食品ストック、その他）を作成する（`db/defaultCategories.ts`）。
- **品目削除はカスケード削除**。関連する `stockLogs` / `purchases` / `itemStorePrices` / `shoppingListEntries` も同時に削除する（`repositories/itemRepository.ts` の `deleteItem`）。カテゴリ削除は、使用中の品目がある場合は不可（`domain/category.ts` の `canDeleteCategory`）。
- **「よく買う店」と価格情報**: `Item.preferredStoreId` は品目編集フォームでの既定選択に使う任意フィールド。実際の価格比較は `ItemStorePrice`（品目×店舗の組で価格を保持）で行い、複数店の価格を比較して最安値を強調表示する。
- **月次支出グラフは外部チャートライブラリを使わず自前の軽量SVGで実装する方針**（依存最小化のため。フェーズ3で実装）。
- **「そろそろ」提案（予測7日以内）に却下・スヌーズ機能は設けない**（シンプルさ優先の決定）。
- **買い物リストは自動同期方式**。`domain/shoppingList.ts` の `syncShoppingListEntries` が「発注点以下だがリストに未登録の品目」を追加し、「発注点を上回った自動追加(`reason: 'reorder'`)エントリ」を削除対象として返す。手動追加(`isManual: true`)エントリは在庫状況に関わらず残す。買い物リスト画面はitems/entriesの変化を`useEffect`で監視し、この差分を都度DBに反映する。
- **購入完了処理**は `domain/shoppingList.ts` の `planPurchaseCompletion` で在庫加算・`StockLog(type: 'purchase')`保存・`Purchase`保存・リストからの除外をまとめて計算し、`repositories/shoppingListRepository.ts` の `completePurchase` が1つのDexieトランザクションとして適用する。店舗ごとにグルーピングした「購入完了」ボタンから、その店舗のチェック済みエントリのみを渡す。単価は `ItemStorePrice` の該当店舗の最新価格を自動的に使用する。
- **買い物リストのチェックボックスはuncontrolled(`defaultChecked` + `key`)で実装する**。IndexedDBへの書き込みは非同期のため、Reactの制御コンポーネントのままだとチェックした瞬間に一度falseへ巻き戻る視覚的なちらつきが発生する（Playwrightの操作でも「クリックしても状態が変わらない」という形で顕在化した）。`key={entry.id + '-' + entry.checked}` によってDB側の値が確定した時だけ再マウントする方式にして、タップに対する見た目の即時性を確保している。
- **使用ペース予測**は `domain/prediction.ts` の `computeDailyUsageRate` が直近90日以内の `use` ログのみから1日あたり消費量を計算する（`purchase`/`adjust` は集計対象外）。使用記録が2件未満、または記録期間が1日未満の場合は `undefined`（データ不足）を返す。`predictDaysUntilEmpty` が現在庫と消費ペースから残り日数を計算し、`isSoon`（既定7日以内）で「そろそろ」判定する。
- **ダッシュボードの3区分**（`domain/dashboard.ts`）は「発注点以下 → 今すぐ買うべき」「未発注点だが7日以内に切れる予測 → そろそろ買う」「それ以外 → 十分ある」の優先順位で振り分ける。買い物リストの自動同期（`syncShoppingListEntries`）にも同じ予測情報を渡し、「そろそろ」品目を発注点到達前に提案として追加する（却下・スヌーズ機能は設けない）。
- **月次支出グラフ**（`components/MonthlyExpenseChart.tsx`）は外部チャートライブラリを使わず自前の軽量SVGで実装。単一系列の棒グラフのため凡例は省略し、金額はバー上に直接ラベル表示、スクリーンリーダー向けに `sr-only` のデータテーブルを併設する。集計ロジックは `domain/expense.ts` の `computeMonthlyExpenses`（純粋関数）に分離してテストする。
- **バックアップ／復元は全置き換え方式**。`domain/backup.ts` がJSONの妥当性検証（`parseBackup`）を担い、`repositories/backupRepository.ts` の `importAllData` が全テーブルをclearしてからbulkAddし直す（1トランザクション）。復元は取り消せないため、実行前に確認ダイアログを必ず挟む（`pages/Settings/DataManagement.tsx`）。
- **CSV出力**は購入履歴のみを対象とし、`domain/csv.ts` の `purchasesToCsv`（純粋関数、カンマ/改行/ダブルクォートのエスケープを含む）で文字列化する。Excelでの文字化けを防ぐため、ダウンロード時にUTF-8 BOM（`﻿`）を先頭に付与する。
- **PWAアイコン**は依存パッケージを増やさず、`scripts/generate-icons.mjs`（Node標準の`zlib`のみでPNGを直接エンコードする使い切りスクリプト）で `public/icons/icon-192.png` / `icon-512.png` を生成した。アイコンを変更したい場合はこのスクリプトを編集して再実行する（`node scripts/generate-icons.mjs`）。

## テスト方針

- `domain/*.ts` の各ファイルには対応する `*.test.ts` を必ず用意する。
- repositories・hooks・pages はDexie（IndexedDB）に依存するため、ロジックのユニットテストはdomain層に寄せ、UI層は手動のブラウザ確認で担保する。

## フェーズ進行

1. プロジェクト初期化・DB層・品目CRUD・在庫増減（完了）
2. 買い物リストと購入完了フロー・購入履歴（完了）
3. 使用ペース予測・ダッシュボード・支出グラフ（完了）
4. バックアップ/復元・CSV出力・PWA対応・仕上げ（完了）

## スコープ外（今回やらないこと）

ユーザー登録・ログイン、クラウド同期、複数端末のリアルタイム共有、バーコード読み取り、通販サイト連携、プッシュ通知。将来拡張しやすいよう、DBアクセスは `repositories/` に閉じ込めてある。
