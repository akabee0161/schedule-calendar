# CLAUDE.md

## プロジェクト概要

家族向けカレンダー・ダッシュボード。AWS S3 + CloudFront で配信し、予定は `src/data/events.ts` を直接編集する GitOps 運用。

## 現在の状態

- **Phase 1 (環境構築 + ベースロジック)**: 完了
- **Phase 2 (カレンダーUI)**: 完了
- **Phase 3 (CDK インフラ)**: 完了
- **Phase 4 (GitHub Actions CI/CD)**: 完了
- **Git リポジトリ**: 初期コミット済み (`0c750ee`)
- **リモート**: `origin` → `https://github.com/akabee0161/schedule-calendar.git`
- **未完了**: `git push -u origin main` がまだ実行されていない（GCM 認証の問題で中断）

## push 時の注意

- WSL2 環境で Git Credential Manager (GCM) を使用
- `.bashrc` に `export GCM_CREDENTIAL_STORE=gpg` が設定済み（120行目）
- non-interactive shell だと `.bashrc` のインタラクティブチェックでスキップされるため、Bash ツールからは `export GCM_CREDENTIAL_STORE=gpg` を先に実行する必要がある

## 次のアクション

1. `git push -u origin main` を実行してリモートに push する
2. GitHub の Settings > Secrets に `AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` を登録する
3. push 後、GitHub Actions が自動で deploy ワークフローを実行する

## 開発コマンド

```bash
# フロントエンド
npm install          # 依存関係インストール
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド (dist/ 生成)

# インフラ (infra/ ディレクトリ内)
npm run build        # TypeScript コンパイル
npx cdk synth        # CloudFormation テンプレート生成
npx cdk deploy       # デプロイ
npx cdk destroy      # スタック削除
```

## アーキテクチャ決定事項

- S3 バケットはパブリックアクセス全ブロック、CloudFront OAC 経由のみ
- SPA 対応: CloudFront で 403/404 → index.html にフォールバック
- BucketDeployment で `distributionPaths: ["/*"]` によるキャッシュ無効化
- `RemovalPolicy.DESTROY` + `autoDeleteObjects: true` で検証しやすく設定
