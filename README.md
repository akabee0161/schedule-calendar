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
│   │   ├── types.ts             # CalendarEvent 型定義
│   │   ├── events.ts            # 予定データ（gitignore済み・要セットアップ）
│   │   └── events.ts.sample     # events.ts のテンプレート
│   ├── hooks/
│   │   ├── useCalendar.ts       # 月ナビゲーション付きカスタムフック
│   │   └── useEvents.ts         # S3 から events.json をfetchするフック
│   └── utils/
│       └── calendar.ts          # 日付計算 + 祝日判定ロジック
├── scripts/
│   └── upload-events.ts         # events.ts → events.json 生成 + S3 アップロード
├── infra/
│   ├── bin/infra.ts             # CDK エントリーポイント
│   ├── lib/calendar-stack.ts    # S3 + CloudFront スタック定義
│   └── test/infra.test.ts       # インフラテスト
├── .github/workflows/
│   └── deploy.yml               # GitHub Actions CI/CD
└── README_DEPLOY.md             # デプロイ手順書
```

## 予定の管理方法

予定データ (`events.ts`) は個人情報を含むため **git 管理外** です。ローカルで編集後、S3 に直接アップロードします。

### セットアップ（初回）

```bash
cp src/data/events.ts.sample src/data/events.ts
```

### 予定の編集と反映

```typescript
// src/data/events.ts を編集
const rawEvents: Record<string, CalendarEvent[]> = {
  "2026-04-01": [
    { title: "入学式", color: "#f59e0b" },
  ],
  "2026-04-29/2026-05-05": [
    { title: "GW", color: "#EF9E9E" },
  ],
};
```

編集後、S3 にアップロード（バケット名は CloudFormation から自動取得）：

```bash
npm run upload-events
```

git push は不要です。アップロード後すぐにブラウザに反映されます。

## ローカル開発

```bash
npm install

# events.json をローカル生成（public/events.json に出力）
npm run gen-events

# 開発サーバー起動
npm run dev
```

## デプロイ

詳細は [README_DEPLOY.md](README_DEPLOY.md) を参照。

```bash
# フロントエンドビルド + CDK デプロイ（GitHub Actions が自動実行）
git push origin main
```

## カレンダーの特徴

- 日本のカレンダー慣習（日曜始まり、曜日: 日月火水木金土）
- 土曜: 青、日曜・祝日: 赤の色分け
- 当日セルのハイライト（黄色背景）
- holiday-jp による祝日自動判定・祝日名表示
- 予定ラベルの色付き表示
