#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import * as path from "path";
import { CalendarStack } from "../lib/calendar-stack";

const app = new cdk.App();

new CalendarStack(app, "FamilyCalendarStack", {
  description: "Family Calendar Dashboard - S3 + CloudFront",
  distPath: path.join(__dirname, "..", "..", "dist-family"),
});

new CalendarStack(app, "PersonalCalendarStack", {
  description: "Personal Calendar Dashboard - S3 + CloudFront",
  distPath: path.join(__dirname, "..", "..", "dist-personal"),
});
