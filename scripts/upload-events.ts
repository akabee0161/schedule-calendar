/**
 * events.ts から events.json を生成し、S3 にアップロードするスクリプト。
 *
 * ローカル開発用 (S3_BUCKET_NAME 未設定): public/events.json を生成するだけ
 * 本番アップロード: S3_BUCKET_NAME を指定して実行
 *
 * 使い方:
 *   npm run gen-events                          # public/events.json を生成 (ローカル dev 用)
 *   S3_BUCKET_NAME=<bucket> npm run upload-events  # S3 にアップロード
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

// S3_BUCKET_NAME が指定されている場合は S3 にアップロード
const bucket = process.env.S3_BUCKET_NAME;
if (!bucket) {
  console.log("S3_BUCKET_NAME not set — skipping S3 upload.");
  process.exit(0);
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
