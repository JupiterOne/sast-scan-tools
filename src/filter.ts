import {
  ScanOutput,
  ScanResultsGroupedByMessageText,
  GroupedScanResults,
  JupiterOneSastScanIgnoreRule,
} from "./types";

export function filterGroupedScanResults(
  scan: ScanOutput,
  tuningRules: JupiterOneSastScanIgnoreRule[]
): GroupedScanResults {
  const filtered: GroupedScanResults = {
    results: [],
  };

  for (const result of scan.results) {
    const msg = result.message.text;

    const ignorable = tuningRules.find((r) => r.ignoreString === msg);
    if (ignorable) {
      // TODO possibly log this fact
      continue;
    }

    const groupedResult = filtered.results.find((r) => r.messageText === msg);
    if (groupedResult) {
      groupedResult.findings.push(result);
    } else {
      filtered.results.push({
        messageText: msg,
        findings: [result],
      });
    }
  }

  return filtered;
}

export function rankSeverity(
  scanResult: ScanResultsGroupedByMessageText
): string {
  const sevPriorities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  let maxSeenSevIndex = 0;

  for (const finding of scanResult.findings) {
    const sevIndex: number =
      sevPriorities.indexOf(finding.properties.issue_severity) || 0;
    if (sevIndex > maxSeenSevIndex) {
      maxSeenSevIndex = sevIndex;
    }
  }
  return sevPriorities[maxSeenSevIndex];
}
