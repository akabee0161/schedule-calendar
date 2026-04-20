# CLAUDE.md

## プロジェクト概要

家族向けカレンダー・ダッシュボード。AWS S3 + CloudFront で配信。予定データは DynamoDB に保存し、AppSync (GraphQL) 経由で CRUD 操作する。UI から予定の追加・編集・削除が可能。

## 現在の状態

- **Phase 1 (環境構築 + ベースロジック)**: 完了
- **Phase 2 (カレンダーUI)**: 完了
- **Phase 3 (CDK インフラ)**: 完了
- **Phase 4 (GitHub Actions CI/CD)**: 完了
- **Phase 5 (AppSync + DynamoDB CRUD)**: 完了
- **リモート**: `origin` → `https://github.com/akabee0161/schedule-calendar.git`

## push 時の注意

- WSL2 環境で Git Credential Manager (GCM) を使用
- `.bashrc` に `export GCM_CREDENTIAL_STORE=gpg` が設定済み（120行目）
- non-interactive shell だと `.bashrc` のインタラクティブチェックでスキップされるため、Bash ツールからは `export GCM_CREDENTIAL_STORE=gpg` を先に実行する必要がある

## 初回セットアップ（新環境）

```bash
cp .env.local.sample .env.local
# .env.local に AppSync のエンドポイントと API キーを設定
npm install
npm run dev
```

## 開発コマンド

```bash
# フロントエンド
npm install        # 依存関係インストール
npm run dev        # 開発サーバー起動（要 .env.local）
npm run build      # プロダクションビルド (dist/ 生成)

# インフラ (infra/ ディレクトリ内)
npx cdk synth      # CloudFormation テンプレート生成
npx cdk deploy     # デプロイ（初回 or インフラ変更時）
npx cdk destroy    # スタック削除
```

## 環境変数

`.env.local`（gitignore 済み）に以下を設定する：

| 変数名 | 説明 | 取得元 |
|---|---|---|
| `VITE_APPSYNC_ENDPOINT` | AppSync GraphQL エンドポイント | CDK deploy の Output |
| `VITE_APPSYNC_API_KEY` | AppSync API キー | CDK deploy の Output |

GitHub Actions の Secrets にも同じ値を登録する（CI ビルド用）。

## アーキテクチャ決定事項

- S3 バケットはパブリックアクセス全ブロック、CloudFront OAC 経由のみ
- SPA 対応: CloudFront で 403/404 → index.html にフォールバック
- BucketDeployment で `distributionPaths: ["/*"]` によるキャッシュ無効化
- `RemovalPolicy.DESTROY` + `autoDeleteObjects: true` で検証しやすく設定
- DynamoDB: PAY_PER_REQUEST（オンデマンド）でコスト最小化
- AppSync: API_KEY 認証、X-Ray/ログ無効でコスト最小化
- AppSync サブスクリプション: `@aws_subscribe` + None データソースで実装
- フロントエンドは楽観的更新 + WebSocket サブスクリプションで即時反映
- `CalendarEvent` 型は `src/data/types.ts` で定義（git 管理）
