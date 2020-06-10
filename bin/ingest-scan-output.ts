#!/usr/bin/env yarn ts-node
import fs from "fs";
import { processFindingUpserts } from "../src/jupiterone";
import { filterGroupedScanResults } from "../src/filter";
import JupiterOneClient from "@jupiterone/jupiterone-client-nodejs";

// NOTE: This script expects the paths to 3 input files as arguments,
// in addition to J1 environment variables:

function printUsage(): void {
  console.error(`Usage:
    /usr/bin/env 
      J1_API_TOKEN=<token> 
      J1_ACCOUNT=<account> 
      ./bin/ingest-scan-output.ts 
        $PWD/test/fixtures/j1-lambda-function.json
        $PWD/test/fixtures/all-mapper-report.json
        $PWD/test/fixtures/sast-scan-ignore-rules.json`);
}

// The first input file is the literal JSON output of J1QL query data of the form:
/* ```
  Find aws_lambda_function as f
  RETURN
    f._id as entityId,
    f._type as type,
    f.lastModified as lastModified,
    f.updatedOn as updatedOn,
    f.tag.Build as build,
    f.runtime as runtime,
    f.name as name,
    f.arn as arn,
    f.region as region,
    f.webLink as webLink,
    f.tag.AccountName as accountName,
    f.tag.Project as project
  ```
*/

// The second file is the output of sast-scan, the 'all-*.json' file which
// summarizes all findings regardless of scanner type

// The third file is the literal JSON output of J1QL query data of the form:
// Find sast_scan_ignore_rule

async function run(): Promise<void> {
  const { J1_API_TOKEN: accessToken, J1_ACCOUNT: account } = process.env;

  if (process.argv.length < 5) {
    printUsage();
    process.exit(2);
  }

  const [, , lambdaJsonFile, scanJsonFile, rulesJsonFile] = process.argv;

  if (
    !fs.existsSync(lambdaJsonFile) ||
    !fs.existsSync(scanJsonFile) ||
    !fs.existsSync(rulesJsonFile)
  ) {
    console.error("Could not find one or more files!");
    printUsage();
    process.exit(3);
  }

  if (!accessToken || !account) {
    console.error(
      "Missing one or both of J1_API_TOKEN and/or J1_ACCOUNT env vars!"
    );
    printUsage();
    process.exit(2);
  }

  const lambda = require(lambdaJsonFile); // eslint-disable-line @typescript-eslint/no-var-requires
  const scanReport = require(scanJsonFile); // eslint-disable-line @typescript-eslint/no-var-requires
  const tuningRules = require(rulesJsonFile); // eslint-disable-line @typescript-eslint/no-var-requires

  const groupedReport = filterGroupedScanResults(scanReport, tuningRules);

  console.log(
    "ingesting data from filtered and grouped report, relative to provided lambda entity..."
  );
  console.log(
    `${groupedReport.results.length} total grouped, filtered results`
  );

  const j1Client = new JupiterOneClient({ account, accessToken, dev: true });
  await j1Client.init();

  await processFindingUpserts(j1Client, groupedReport, lambda);
  console.log("OK");
}

run().catch(console.error);
