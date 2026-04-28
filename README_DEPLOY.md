# デプロイ手順

本リポジトリは同一コードから **2 つのスタック**（家族用 `FamilyCalendarStack` と個人用 `PersonalCalendarStack`）を AWS にデプロイします。各スタックは独立した S3/CloudFront/DynamoDB/AppSync を持ち、データは分離されます。

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

### 2. フロントエンドを 2 種類ビルド

CDK の `BucketDeployment` は `dist-family/` / `dist-personal/` を参照するため、`cdk deploy` 前に両方をビルドします（中身は仮の値で構いません。後で再ビルドします）。

```bash
npx vite build --outDir dist-family
npx vite build --outDir dist-personal
```

### 3. CDK デプロイ（インフラ構築）

```bash
cd infra && npx cdk deploy --all
```

デプロイ完了後、両スタックの Outputs が表示されます：

```text
FamilyCalendarStack.AppSyncEndpoint        = https://xxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql
FamilyCalendarStack.AppSyncApiKey          = da2-xxxx
FamilyCalendarStack.DistributionDomainName = xxxx.cloudfront.net

PersonalCalendarStack.AppSyncEndpoint        = https://yyyy.appsync-api.ap-northeast-1.amazonaws.com/graphql
PersonalCalendarStack.AppSyncApiKey          = da2-yyyy
PersonalCalendarStack.DistributionDomainName = yyyy.cloudfront.net
```

### 4. 環境変数を設定（ローカル開発用）

```bash
cp .env.local.sample .env.local
# .env.local を編集して、ローカル開発で向けたい方の AppSync 値を設定（家族用 or 個人用）
```

### 5. ローカル動作確認

```bash
npm run dev
```

### 6. GitHub Secrets を登録

GitHub の Settings > Secrets and variables > Actions に以下を登録：

| Secret 名 | 値 |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS アクセスキー ID |
| `AWS_SECRET_ACCESS_KEY` | AWS シークレットアクセスキー |
| `VITE_APPSYNC_ENDPOINT` | `FamilyCalendarStack` の AppSyncEndpoint |
| `VITE_APPSYNC_API_KEY` | `FamilyCalendarStack` の AppSyncApiKey |
| `VITE_APPSYNC_ENDPOINT_PERSONAL` | `PersonalCalendarStack` の AppSyncEndpoint |
| `VITE_APPSYNC_API_KEY_PERSONAL` | `PersonalCalendarStack` の AppSyncApiKey |

### 7. 初回 push

```bash
git push origin main
```

GitHub Actions が自動でフロントエンドを 2 種類ビルドし、両スタックを S3 + CloudFront にデプロイします。

## 通常のデプロイ（コード変更時）

`main` ブランチへの push で自動実行されます：

1. 型チェック (`tsc -b`)
2. 家族用フロントエンドビルド (`vite build --outDir dist-family`、家族用 Secrets 注入)
3. 個人用フロントエンドビルド (`vite build --outDir dist-personal`、個人用 Secrets 注入)
4. CDK デプロイ (`npx cdk deploy --all`) で両スタック更新
5. 各 S3 にビルド成果物をアップロード、CloudFront キャッシュを無効化 (`/*`)

## 片方のスタックだけデプロイ／削除したい場合

```bash
# 個人用だけ更新
cd infra && npx cdk deploy PersonalCalendarStack

# 個人用だけ削除（DynamoDB データも全削除）
cd infra && npx cdk destroy PersonalCalendarStack
```

## API キーの更新

AppSync API キーは **365 日** で失効します。失効前に以下を実行してください：

```bash
# CDK で新しいキーを発行（expiry を更新してから再デプロイ）
cd infra && npx cdk deploy --all

# GitHub Secrets の VITE_APPSYNC_API_KEY / VITE_APPSYNC_API_KEY_PERSONAL を新しい値に更新
# .env.local も更新
```

## その他のコマンド

```bash
# テンプレート差分を確認
cd infra && npx cdk diff

# CloudFormation テンプレートを確認
cd infra && npx cdk synth

# 両スタックを削除（DynamoDB データも含めて全削除）
cd infra && npx cdk destroy --all
```
