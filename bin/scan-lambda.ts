#!/usr/bin/env yarn ts-node

import { lambda } from "../src/aws";
import {
  getJ1LambdaFunctionEntities,
  processFindingUpserts,
  getJ1SASTScanIgnoreRules,
} from "../src/jupiterone";
import JupiterOneClient from "@jupiterone/jupiterone-client-nodejs";
import { downloadFile, createTempDir, cleanDir } from "../src/fsutils";
import { filterGroupedScanResults } from "../src/filter";
import { ScanOutput } from "../src/types";
import { scanLambda } from "../src/lambda";
import path from "path";

async function run(): Promise<void> {
  const {
    J1_API_TOKEN: accessToken = "",
    J1_ACCOUNT: account = "",
    J1_DEV: useJ1Dev = undefined,
    SAST_DOCKER_IMAGE: sastDockerImage = "quay.io/appthreat/sast-scan",
  } = process.env;

  const j1Client = new JupiterOneClient({
    account,
    accessToken,
    dev: !!useJ1Dev,
  });
  await j1Client.init();

  const awsRegion = lambda.config.region || "us-east-1";

  console.log("retrieving J1 sast ignore rules...");
  const tuningRules = await getJ1SASTScanIgnoreRules(j1Client);
  console.log(`found ${tuningRules.length} rules`);

  console.log("retrieving J1 lambda entities...");
  const entities = await getJ1LambdaFunctionEntities(
    j1Client,
    "jupiterone-dev",
    "30 days"
  );
  console.log(`found ${entities.length} lambda entities from last 30 days`);

  for (const entity of entities) {
    if (entity.region != awsRegion) {
      console.warn(
        `skipping function ${entity.name} in region ${entity.region}, as it is not reachable with the current AWS configuration`
      );
      continue;
    }

    const startTime = Date.now();
    console.log(`\nretrieving function definition for ${entity.name}...`);
    const functionDef = await lambda
      .getFunction({ FunctionName: entity.arn })
      .promise();
    const tempDir = await createTempDir();
    const zipfile = path.join(tempDir, "lambda.zip");

    if (functionDef.Code && functionDef.Code.Location) {
      console.log(`got URL: ${functionDef.Code.Location}`);
      await downloadFile(functionDef.Code.Location, zipfile);
      console.log("wrote file to: " + zipfile);
    } else {
      console.error("Could not retrieve code location!");
    }
    const reportFile = await scanLambda(
      tempDir,
      entity.runtime,
      sastDockerImage
    );
    console.log("Scan report is located at: " + reportFile);
    const stopTime = Date.now();
    const durationSecs = Math.floor((stopTime - startTime) / 1000);
    console.log(`scanning completed in ${durationSecs} seconds.`);

    const scanReport: ScanOutput = require(reportFile); // eslint-disable-line @typescript-eslint/no-var-requires
    const groupedReport = filterGroupedScanResults(scanReport, tuningRules);
    await processFindingUpserts(j1Client, groupedReport, entity);
    await cleanDir(tempDir);
  }
}

run().catch(console.error);
