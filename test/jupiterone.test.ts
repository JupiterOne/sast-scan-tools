import {
  getJ1SASTScanIgnoreRules,
  getJ1LambdaFunctionEntities,
  getJ1ECSTaskDefinitionEntities,
  processFindingUpserts,
} from "../src/jupiterone";
import JupiterOneClient from "@jupiterone/jupiterone-client-nodejs";
import { GroupedScanResults } from "../src/types";
import uuidV4 from "uuid/v4";

require("require-self-ref");

test("getJ1SASTScanIgnoreRules queries for entities of appropriate type", async () => {
  const j1Client = {
    queryV1: jest.fn().mockResolvedValueOnce([]),
  };

  await getJ1SASTScanIgnoreRules((j1Client as unknown) as JupiterOneClient);
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/sast_scan_ignore_rule/)
  );
});

test("getJ1LambdaFunctions passes appropriate values to queryV1", async () => {
  const j1Client = {
    queryV1: jest.fn().mockResolvedValueOnce([]),
  };

  await getJ1LambdaFunctionEntities(
    (j1Client as unknown) as JupiterOneClient,
    "lifeomic-test",
    "30 days"
  );
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/aws_lambda_function/)
  );
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/tag.AccountName ?= ?'lifeomic-test'/)
  );
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/>= ?date.now ?- ?30 days/)
  );
});

test("getJ1ECSTaskDefinitions passes appropriate values to queryV1", async () => {
  const j1Client = {
    queryV1: jest.fn().mockResolvedValueOnce([]),
  };

  await getJ1ECSTaskDefinitionEntities(
    (j1Client as unknown) as JupiterOneClient,
    "lifeomic-test",
    "7 days"
  );
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/aws_ecs_task_definition/)
  );
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/tag.AccountName ?= ?'lifeomic-test'/)
  );
  expect(j1Client.queryV1).toHaveBeenCalledWith(
    expect.stringMatching(/>= ?date.now ?- ?7 days/)
  );
});

/* eslint-disable @typescript-eslint/no-var-requires */

test("processFindingUpserts creates one finding entity and relationship per groupedResult, with rawData", async () => {
  const j1Client = {
    createEntity: jest.fn().mockResolvedValue({ entity: { _id: uuidV4() } }),
    createRelationship: jest.fn().mockResolvedValue({}),
    upsertEntityRawData: jest.fn().mockResolvedValue({}),
  };

  const groupedResults: GroupedScanResults = require("~/test/fixtures/all-mapper-grouped-report.json");
  const lambdaEntity = require("~/test/fixtures/j1-lambda-function.json");

  await processFindingUpserts(
    (j1Client as unknown) as JupiterOneClient,
    groupedResults,
    lambdaEntity
  );

  const findingsCount = groupedResults.results.length;

  expect(j1Client.createEntity).toHaveBeenCalledTimes(findingsCount);
  expect(j1Client.upsertEntityRawData).toHaveBeenCalledTimes(findingsCount);
  expect(j1Client.createRelationship).toHaveBeenCalledTimes(findingsCount);
});
