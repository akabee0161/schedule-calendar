import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const id = util.autoId();
  const { date, title, color } = ctx.args;
  ctx.stash.item = { id, date, title, color: color ?? null };
  return {
    operation: "PutItem",
    key: {
      date: util.dynamodb.toDynamoDB(date),
      id: util.dynamodb.toDynamoDB(id),
    },
    attributeValues: util.dynamodb.toMapValues({
      title,
      ...(color != null && { color }),
    }),
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.stash.item;
}
