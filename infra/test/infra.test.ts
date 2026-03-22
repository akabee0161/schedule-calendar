import * as cdk from "aws-cdk-lib/core";
import { Template } from "aws-cdk-lib/assertions";
import { CalendarStack } from "../lib/calendar-stack";

test("S3 Bucket and CloudFront Distribution created", () => {
  const app = new cdk.App();
  const stack = new CalendarStack(app, "TestStack");
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::S3::Bucket", {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });

  template.resourceCountIs("AWS::CloudFront::Distribution", 1);
});
