# Family Calendar Dashboard

家族向けのシンプルなカレンダー・ダッシュボードです。日本の祝日や家族の予定がひと目で分かり、UI から予定の追加・編集・削除ができます。

## 技術スタック

- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Backend**: AWS AppSync (GraphQL), Amazon DynamoDB
- **日付処理**: date-fns, @holiday-jp/holiday_jp
- **Infrastructure**: AWS CDK v2 (TypeScript) - S3 + CloudFront + AppSync + DynamoDB
- **CI/CD**: GitHub Actions

## ディレクトリ構成

```
├── src/
│   ├── components/
│   │   ├── CalendarGrid.tsx      # グリッド表示（日付クリックでモーダルを開く）
│   │   ├── CalendarHeader.tsx    # 年月表示 + ナビゲーション
│   │   └── EventModal.tsx        # 予定の追加・編集・削除モーダル
│   ├── data/
│   │   └── types.ts             # CalendarEvent 型定義
│   ├── hooks/
│   │   ├── useCalendar.ts       # 月ナビゲーション付きカスタムフック
│   │   └── useCalendarEvents.ts # AppSync CRUD + リアルタイム購読
│   ├── lib/
│   │   └── appsync.ts           # GraphQL クライアント + WebSocket 購読
│   └── utils/
│       └── calendar.ts          # 日付計算 + 祝日判定ロジック
├── infra/
│   ├── graphql/
│   │   └── schema.graphql       # GraphQL スキーマ
│   ├── resolvers/               # AppSync JS リゾルバー
│   │   ├── listEvents.js
│   │   ├── createEvent.js
│   │   ├── updateEvent.js
│   │   ├── deleteEvent.js
│   │   └── subscriptionPassthrough.js
│   ├── bin/infra.ts             # CDK エントリーポイント
│   └── lib/calendar-stack.ts    # S3 + CloudFront + DynamoDB + AppSync スタック定義
├── .github/workflows/
│   └── deploy.yml               # GitHub Actions CI/CD
├── .env.local.sample            # 環境変数テンプレート
└── README_DEPLOY.md             # デプロイ手順書
```

## 予定の管理方法

カレンダーの日付セルをクリックするとモーダルが開きます。

- **追加**: 「＋ 予定を追加」ボタン → タイトル入力 + カラー選択 → 保存
- **編集**: 予定名の右の「編集」ボタン → 変更 → 保存
- **削除**: 編集フォームの「削除」ボタン

予定はリアルタイムで同期されます（家族の誰かが更新すると他の端末にも即反映）。

## ローカル開発

```bash
# 初回セットアップ
cp .env.local.sample .env.local
# .env.local の値を cdk deploy の出力に合わせて編集

npm install
npm run dev
```

## デプロイ

詳細は [README_DEPLOY.md](README_DEPLOY.md) を参照。

`main` ブランチへの push で GitHub Actions が自動ビルド + CDK デプロイを実行します。

## カレンダーの特徴

- 日本のカレンダー慣習（日曜始まり、曜日: 日月火水木金土）
- 土曜: 青、日曜・祝日: 赤の色分け
- 当日セルのハイライト（黄色背景）
- holiday-jp による祝日自動判定・祝日名表示
- 予定ラベルの色付き表示（7色プリセット）
- 楽観的更新で操作が即時反映
