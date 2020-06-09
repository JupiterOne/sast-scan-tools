import { filterGroupedScanResults, rankSeverity } from "../src/filter";

require("require-self-ref");

/* eslint-disable @typescript-eslint/no-var-requires */

test("filterGroupScanResults groups scan results when tuning filter array is empty", async () => {
  const scanResults = require("~/test/fixtures/all-mapper-report.json");
  const groupedResults = require("~/test/fixtures/all-mapper-grouped-report.json");
  const res = filterGroupedScanResults(scanResults, []);
  expect(res).toEqual(groupedResults);
});

test("filterGroupScanResults filters and groups scan results when tuning filter array is non-empty", async () => {
  const scanResults = require("~/test/fixtures/all-mapper-report.json");
  const groupedResults = require("~/test/fixtures/all-mapper-grouped-report.json");
  const tuningRules = require("~/test/fixtures/sast-scan-ignore-rules.json");
  const res = filterGroupedScanResults(scanResults, tuningRules);
  expect(res.results.length).toBeLessThan(groupedResults.results.length);
});

test("rankSeverity correctly ranks highest seen issue severity among grouped findings", async () => {
  expect(
    rankSeverity(require("~/test/fixtures/mapper-grouped-findings-medium.json"))
  ).toBe("MEDIUM");
  expect(
    rankSeverity(require("~/test/fixtures/mapper-grouped-findings-high.json"))
  ).toBe("HIGH");
});
