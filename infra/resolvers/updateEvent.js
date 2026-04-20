import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { id, date, title, color } = ctx.args;
  return {
    operation: "UpdateItem",
    key: {
      date: util.dynamodb.toDynamoDB(date),
      id: util.dynamodb.toDynamoDB(id),
    },
    update: {
      expression:
        color != null
          ? "SET #title = :title, #color = :color"
          : "SET #title = :title REMOVE #color",
      expressionNames: { "#title": "title", "#color": "color" },
      expressionValues: util.dynamodb.toMapValues(
        color != null
          ? { ":title": title, ":color": color }
          : { ":title": title },
      ),
    },
    condition: {
      expression: "attribute_exists(#id)",
      expressionNames: { "#id": "id" },
    },
    returnValues: "ALL_NEW",
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
