import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "DeleteItem",
    key: {
      date: util.dynamodb.toDynamoDB(ctx.args.date),
      id: util.dynamodb.toDynamoDB(ctx.args.id),
    },
    returnValues: "ALL_OLD",
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  if (!ctx.result) {
    util.error("Item not found", "NotFound");
  }
  return ctx.result;
}
