# CLAUDE.md

## プロジェクト概要

家族向けカレンダー・ダッシュボード。AWS S3 + CloudFront で配信。予定データは DynamoDB に保存し、AppSync (GraphQL) 経由で CRUD 操作する。UI から予定の追加・編集・削除が可能。

同一コードから **2 つの独立したスタック** をデプロイする構成:

- `FamilyCalendarStack`: 家族共有カレンダー
- `PersonalCalendarStack`: 個人用カレンダー

各スタックは独自の S3/CloudFront/DynamoDB/AppSync を持ち、データは完全に分離されている。`infra/lib/calendar-stack.ts` の `CalendarStack` クラスを `infra/bin/infra.ts` で 2 回インスタンス化することで実現。

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
npm run build      # プロダクションビルド (dist/ 生成、ローカル確認用)

# CI 用ビルド（環境ごとに別ディレクトリへ出力）
npx vite build --outDir dist-family    # 家族用 (要 VITE_APPSYNC_* env)
npx vite build --outDir dist-personal  # 個人用 (要 VITE_APPSYNC_* env)

# インフラ (infra/ ディレクトリ内)
npx cdk synth                          # 両スタックの CloudFormation テンプレート生成
npx cdk deploy --all                   # 両スタックをデプロイ
npx cdk deploy FamilyCalendarStack     # 家族用のみデプロイ
npx cdk deploy PersonalCalendarStack   # 個人用のみデプロイ
npx cdk destroy <StackName>            # スタック削除
```

ローカルで `cdk synth` / `cdk deploy` する際は `dist-family/` と `dist-personal/` の両方が存在する必要がある（`s3deploy.Source.asset` が synth 時にパスを評価するため）。両方ビルドしておくか、片方だけ更新したい場合でも両ディレクトリを用意しておくこと。

## 環境変数

`.env.local`（gitignore 済み）に以下を設定する。**ローカル開発は通常どちらか一方の環境を向ける**：

| 変数名 | 説明 | 取得元 |
|---|---|---|
| `VITE_APPSYNC_ENDPOINT` | AppSync GraphQL エンドポイント | CDK deploy の Output |
| `VITE_APPSYNC_API_KEY` | AppSync API キー | CDK deploy の Output |
| `VITE_CALENDAR_TITLE` | ブラウザタブに表示されるサイトタイトル（例: `ファミリーカレンダー` / `パーソナルカレンダー`） | 任意の文字列 |

GitHub Actions の Secrets には **両環境分** を登録する（CI ビルド用）：

| Secret 名 | 用途 |
|---|---|
| `VITE_APPSYNC_ENDPOINT` / `VITE_APPSYNC_API_KEY` | 家族用 (`FamilyCalendarStack`) |
| `VITE_APPSYNC_ENDPOINT_PERSONAL` / `VITE_APPSYNC_API_KEY_PERSONAL` | 個人用 (`PersonalCalendarStack`) |

サイトタイトル (`VITE_CALENDAR_TITLE`) はワークフローで `ファミリーカレンダー` / `パーソナルカレンダー` をハードコードしているため Secrets 不要。

ワークフローは `main` への push 自動トリガーに加え `workflow_dispatch` で **GitHub Actions タブから手動実行** も可能。

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
- `CalendarStack` は `distPath` を props で受け取る再利用可能な構成。`bin/infra.ts` で家族用・個人用の 2 スタックをインスタンス化。スタック名が異なれば S3/DynamoDB/AppSync 等の物理名は CDK が自動で衝突回避する
