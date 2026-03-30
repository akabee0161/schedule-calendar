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

### 2. events.ts を用意

```bash
cp src/data/events.ts.sample src/data/events.ts
# src/data/events.ts を編集して予定を入力
```

### 3. CDK デプロイ（インフラ構築）

```bash
cd infra && npx cdk deploy
```

デプロイ完了後、CloudFront のドメイン名と S3 バケット名が出力されます。

### 4. events.json を S3 にアップロード

```bash
npm run upload-events
```

バケット名は CloudFormation outputs から自動取得されます。

### 5. GitHub Actions の設定

GitHub の Settings > Secrets に以下を登録してください：

| Secret 名 | 値 |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS アクセスキー ID |
| `AWS_SECRET_ACCESS_KEY` | AWS シークレットアクセスキー |

## 予定の更新

コードの変更（UI修正など）は `main` ブランチへの push で GitHub Actions が自動デプロイします。

**予定データの更新は git push 不要** です：

```bash
# src/data/events.ts を編集後
npm run upload-events   # S3 に直接アップロード → 即時反映
```

## CI/CD の動作

`main` ブランチへの push 時に GitHub Actions が以下を実行します：

1. フロントエンドビルド (`npm run build`)
2. CDK デプロイ (`npx cdk deploy`)
   - `dist/` の内容を S3 にアップロード
   - CloudFront キャッシュを無効化 (`/*`)
   - **`events.json` は上書きしない** (`prune: false` 設定済み)

## その他のコマンド

```bash
# テンプレート差分を確認
cd infra && npx cdk diff

# CloudFormation テンプレートを確認
cd infra && npx cdk synth

# スタックを削除（S3 バケットも含めて全削除）
cd infra && npx cdk destroy
```
