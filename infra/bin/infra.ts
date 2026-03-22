#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { CalendarStack } from "../lib/calendar-stack";

const app = new cdk.App();
new CalendarStack(app, "FamilyCalendarStack", {
  description: "Family Calendar Dashboard - S3 + CloudFront",
});
