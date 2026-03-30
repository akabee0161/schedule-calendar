/**
 * events.ts から events.json を生成し、S3 にアップロードするスクリプト。
 *
 * バケット名は CloudFormation outputs から自動取得する。
 * 手動指定したい場合は S3_BUCKET_NAME 環境変数で上書き可能。
 *
 * 使い方:
 *   npm run gen-events      # public/events.json を生成 (ローカル dev 用、S3 不要)
 *   npm run upload-events   # CloudFormation から自動取得して S3 にアップロード
 *   S3_BUCKET_NAME=<bucket> npm run upload-events  # バケット名を手動指定
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { rawEvents, expandEvents } from "../src/data/events.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const expanded = expandEvents(rawEvents);
const json = JSON.stringify(expanded, null, 2);

// public/events.json に書き出す (Vite dev server で /events.json として配信される)
const publicDir = join(projectRoot, "public");
mkdirSync(publicDir, { recursive: true });
const localPath = join(publicDir, "events.json");
writeFileSync(localPath, json, "utf-8");
console.log(`Generated: ${localPath}`);

// gen-events として呼ばれた場合はここで終了
if (process.argv[1]?.endsWith("upload-events.ts") === false) process.exit(0);

// バケット名を解決: 環境変数 > CloudFormation outputs
let bucket = process.env.S3_BUCKET_NAME;

if (!bucket) {
  console.log("Resolving bucket name from CloudFormation...");
  const {
    CloudFormationClient,
    DescribeStacksCommand,
  } = await import("@aws-sdk/client-cloudformation");

  const cfn = new CloudFormationClient({ region: "ap-northeast-1" });
  const { Stacks } = await cfn.send(
    new DescribeStacksCommand({ StackName: "FamilyCalendarStack" }),
  );
  bucket = Stacks?.[0]?.Outputs?.find((o) => o.OutputKey === "BucketName")
    ?.OutputValue;

  if (!bucket) {
    console.error(
      "Could not resolve bucket name. Run `npx cdk deploy` first, or set S3_BUCKET_NAME.",
    );
    process.exit(1);
  }
  console.log(`Resolved bucket: ${bucket}`);
}

const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

const client = new S3Client({ region: "ap-northeast-1" });
await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: "events.json",
    Body: json,
    ContentType: "application/json",
  }),
);
console.log(`Uploaded to s3://${bucket}/events.json`);
