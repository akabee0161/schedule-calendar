import * as cdk from "aws-cdk-lib/core";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import * as path from "path";

export interface CalendarStackProps extends cdk.StackProps {
  distPath: string;
}

export class CalendarStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CalendarStackProps) {
    super(scope, id, props);

    // ─── DynamoDB ────────────────────────────────────────────────────
    // PAY_PER_REQUEST (オンデマンド): 最低料金なし、無料枠内に収まる
    const eventsTable = new dynamodb.Table(this, "EventsTable", {
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ─── AppSync ─────────────────────────────────────────────────────
    // xrayEnabled: false, logConfig NONE でコスト削減
    const api = new appsync.GraphqlApi(this, "CalendarApi", {
      name: "family-calendar-api",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "../graphql/schema.graphql"),
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
      xrayEnabled: false,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.NONE,
        excludeVerboseContent: true,
      },
    });

    const jsRuntime = appsync.FunctionRuntime.JS_1_0_0;

    // DynamoDB データソース
    const eventsDS = api.addDynamoDbDataSource("EventsDS", eventsTable);

    eventsDS.createResolver("ListEventsResolver", {
      typeName: "Query",
      fieldName: "listEvents",
      runtime: jsRuntime,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/listEvents.js"),
      ),
    });

    eventsDS.createResolver("CreateEventResolver", {
      typeName: "Mutation",
      fieldName: "createEvent",
      runtime: jsRuntime,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/createEvent.js"),
      ),
    });

    eventsDS.createResolver("UpdateEventResolver", {
      typeName: "Mutation",
      fieldName: "updateEvent",
      runtime: jsRuntime,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/updateEvent.js"),
      ),
    });

    eventsDS.createResolver("DeleteEventResolver", {
      typeName: "Mutation",
      fieldName: "deleteEvent",
      runtime: jsRuntime,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/deleteEvent.js"),
      ),
    });

    // None データソース: @aws_subscribe サブスクリプション用パススルー
    const noneDS = api.addNoneDataSource("NoneDS");

    const subscriptionResolver = {
      runtime: jsRuntime,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/subscriptionPassthrough.js"),
      ),
    };

    noneDS.createResolver("OnCreateEventResolver", {
      typeName: "Subscription",
      fieldName: "onCreateEvent",
      ...subscriptionResolver,
    });

    noneDS.createResolver("OnUpdateEventResolver", {
      typeName: "Subscription",
      fieldName: "onUpdateEvent",
      ...subscriptionResolver,
    });

    noneDS.createResolver("OnDeleteEventResolver", {
      typeName: "Subscription",
      fieldName: "onDeleteEvent",
      ...subscriptionResolver,
    });

    // ─── S3 バケット ──────────────────────────────────────────────────
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ─── CloudFront ───────────────────────────────────────────────────
    const oac = new cloudfront.S3OriginAccessControl(this, "OAC", {
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(props.distPath)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
    });

    // ─── Outputs ──────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution URL",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: siteBucket.bucketName,
      description: "S3 bucket name",
    });

    new cdk.CfnOutput(this, "AppSyncEndpoint", {
      value: api.graphqlUrl,
      description: "AppSync GraphQL endpoint → VITE_APPSYNC_ENDPOINT",
    });

    if (!api.apiKey) {
      throw new Error(
        "AppSync API key が設定されていません。API_KEY 認証が有効か確認してください。",
      );
    }
    new cdk.CfnOutput(this, "AppSyncApiKey", {
      value: api.apiKey,
      description: "AppSync API Key → VITE_APPSYNC_API_KEY",
    });
  }
}
