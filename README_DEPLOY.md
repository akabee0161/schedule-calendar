# デプロイ手順

## 前提条件

- AWS CLI が設定済み (`aws configure`)
- Node.js 18 以上
- CDK CLI (`npm install -g aws-cdk`)
- CDK ブートストラップ済み (`cdk bootstrap`)

## 初回セットアップ

### 1. 依存関係のインストール

```bash
npm install
cd infra && npm install && cd ..
```

### 2. CDK デプロイ（インフラ構築）

```bash
cd infra && npx cdk deploy
```

デプロイ完了後、以下の Outputs が表示されます：

```text
FamilyCalendarStack.AppSyncEndpoint = https://xxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql
FamilyCalendarStack.AppSyncApiKey   = da2-xxxx
FamilyCalendarStack.DistributionDomainName = xxxx.cloudfront.net
```

### 3. 環境変数を設定

```bash
cp .env.local.sample .env.local
# .env.local を編集して上記の値を設定
```

### 4. ローカル動作確認

```bash
npm run dev
```

### 5. GitHub Secrets を登録

GitHub の Settings > Secrets and variables > Actions に以下を登録：

| Secret 名 | 値 |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS アクセスキー ID |
| `AWS_SECRET_ACCESS_KEY` | AWS シークレットアクセスキー |
| `VITE_APPSYNC_ENDPOINT` | CDK Output の AppSyncEndpoint |
| `VITE_APPSYNC_API_KEY` | CDK Output の AppSyncApiKey |

### 6. 初回 push

```bash
git push origin main
```

GitHub Actions が自動でフロントエンドをビルドして S3 + CloudFront にデプロイします。

## 通常のデプロイ（コード変更時）

`main` ブランチへの push で自動実行されます：

1. フロントエンドビルド (`npm run build`、VITE_ 環境変数を Secrets から注入)
2. CDK デプロイ (`npx cdk deploy`)
3. S3 に `dist/` をアップロード
4. CloudFront キャッシュを無効化 (`/*`)

## API キーの更新

AppSync API キーは **365日** で失効します。失効前に以下を実行してください：

```bash
# CDK で新しいキーを発行（expiry を更新してから再デプロイ）
cd infra && npx cdk deploy

# GitHub Secrets の VITE_APPSYNC_API_KEY を新しい値に更新
# .env.local も更新
```

## その他のコマンド

```bash
# テンプレート差分を確認
cd infra && npx cdk diff

# CloudFormation テンプレートを確認
cd infra && npx cdk synth

# スタックを削除（DynamoDB データも含めて全削除）
cd infra && npx cdk destroy
```
