import { util } from "@aws-appsync/utils";

export function request(_ctx) {
  return { operation: "Scan" };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
}
