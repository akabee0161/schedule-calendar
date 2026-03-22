# Family Calendar Dashboard

家族向けのシンプルなカレンダー・ダッシュボードです。日本の祝日や家族の予定がひと目で分かり、スマホ・PC両方で快適に閲覧できます。

## 技術スタック

- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **日付処理**: date-fns, @holiday-jp/holiday_jp
- **Infrastructure**: AWS CDK v2 (TypeScript) - S3 + CloudFront
- **CI/CD**: GitHub Actions

## ディレクトリ構成

```
├── src/
│   ├── components/
│   │   ├── CalendarGrid.tsx      # 日〜土のグリッド表示
│   │   └── CalendarHeader.tsx    # 年月表示 + ナビゲーション
│   ├── data/
│   │   └── events.ts            # 予定データ（ここを編集して予定管理）
│   ├── hooks/
│   │   └── useCalendar.ts       # 月ナビゲーション付きカスタムフック
│   └── utils/
│       └── calendar.ts          # 日付計算 + 祝日判定ロジック
├── infra/
│   ├── bin/infra.ts             # CDK エントリーポイント
│   ├── lib/calendar-stack.ts    # S3 + CloudFront スタック定義
│   └── test/infra.test.ts       # インフラテスト
├── .github/workflows/
│   └── deploy.yml               # GitHub Actions CI/CD
└── README_DEPLOY.md             # デプロイ手順書
```

## 予定の管理方法（GitOps）

`src/data/events.ts` を直接編集して `main` ブランチに push するだけで、自動ビルド → S3 デプロイ → CloudFront キャッシュ無効化が実行されます。

```typescript
export const events: Record<string, CalendarEvent[]> = {
  "2026-03-23": [
    { title: "歯医者", color: "#3b82f6" },
  ],
};
```

## ローカル開発

```bash
npm install
npm run dev
```

## デプロイ

詳細は [README_DEPLOY.md](README_DEPLOY.md) を参照。

```bash
# フロントエンドビルド
npm run build

# CDK デプロイ
cd infra && npx cdk deploy
```

## カレンダーの特徴

- 日本のカレンダー慣習（日曜始まり、曜日: 日月火水木金土）
- 土曜: 青、日曜・祝日: 赤の色分け
- 当日セルのハイライト（黄色背景）
- holiday-jp による祝日自動判定・祝日名表示
- 予定ラベルの色付き表示
