# デプロイ手順

## 前提条件

- AWS CLI が設定済み (`aws configure`)
- Node.js 18 以上
- CDK CLI (`npm install -g aws-cdk`)
- CDK ブートストラップ済み (`cdk bootstrap`)

## 手順

### 1. フロントエンドをビルド

```bash
# プロジェクトルートで実行
npm run build
```

`dist/` ディレクトリにビルド成果物が生成されます。

### 2. CDK デプロイ

```bash
cd infra
npx cdk deploy
```

デプロイ完了後、CloudFront のドメイン名が出力されます。

### 3. 予定を更新する場合

1. `src/data/events.ts` を編集
2. フロントエンドを再ビルド: `npm run build`
3. 再デプロイ: `cd infra && npx cdk deploy`

`BucketDeployment` が自動で S3 にアップロードし、CloudFront のキャッシュを無効化 (`/*`) します。

## その他のコマンド

```bash
# テンプレート差分を確認
cd infra && npx cdk diff

# CloudFormation テンプレートを確認
cd infra && npx cdk synth

# スタックを削除（S3 バケットも含めて全削除）
cd infra && npx cdk destroy
```
