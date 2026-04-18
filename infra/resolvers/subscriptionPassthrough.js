// @aws_subscribe が付いたサブスクリプションフィールド用のパススルーリゾルバー
// None データソースを使用する

export function request(_ctx) {
  return { payload: {} };
}

export function response(ctx) {
  return ctx.result;
}
