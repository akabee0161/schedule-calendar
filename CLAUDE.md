# CLAUDE.md

## プロジェクト概要

家族向けカレンダー・ダッシュボード。AWS S3 + CloudFront で配信。予定データ (`events.ts`) は個人情報を含むため git 管理外とし、S3 に直接アップロードする運用。

## 現在の状態

- **Phase 1 (環境構築 + ベースロジック)**: 完了
- **Phase 2 (カレンダーUI)**: 完了
- **Phase 3 (CDK インフラ)**: 完了
- **Phase 4 (GitHub Actions CI/CD)**: 完了
- **リモート**: `origin` → `https://github.com/akabee0161/schedule-calendar.git`

## push 時の注意

- WSL2 環境で Git Credential Manager (GCM) を使用
- `.bashrc` に `export GCM_CREDENTIAL_STORE=gpg` が設定済み（120行目）
- non-interactive shell だと `.bashrc` のインタラクティブチェックでスキップされるため、Bash ツールからは `export GCM_CREDENTIAL_STORE=gpg` を先に実行する必要がある

## 予定データの運用

`src/data/events.ts` は gitignore 済み。編集後は以下で S3 に直接アップロードする：

```bash
npm run upload-events   # CloudFormation から自動でバケット名を取得してアップロード
```

ローカル開発時は先に以下を実行して `public/events.json` を生成する：

```bash
npm run gen-events
npm run dev
```

## 開発コマンド

```bash
# フロントエンド
npm install              # 依存関係インストール
npm run gen-events       # public/events.json を生成（dev 前に実行）
npm run dev              # 開発サーバー起動
npm run build            # プロダクションビルド (dist/ 生成)
npm run upload-events    # events.json を S3 にアップロード（予定更新時）

# インフラ (infra/ ディレクトリ内)
npx cdk synth            # CloudFormation テンプレート生成
npx cdk deploy           # デプロイ
npx cdk destroy          # スタック削除
```

## アーキテクチャ決定事項

- S3 バケットはパブリックアクセス全ブロック、CloudFront OAC 経由のみ
- SPA 対応: CloudFront で 403/404 → index.html にフォールバック
- BucketDeployment で `distributionPaths: ["/*"]` によるキャッシュ無効化
- `RemovalPolicy.DESTROY` + `autoDeleteObjects: true` で検証しやすく設定
- BucketDeployment に `prune: false` を設定し、S3 上の `events.json` を保護
- フロントエンドは `/events.json` をランタイム fetch（`src/hooks/useEvents.ts`）
- `CalendarEvent` 型は `src/data/types.ts` で定義（git 管理）し、`events.ts` からは re-export
