export interface ScanOutput {
  results: ScanResult[];
  automationDetails: {
    description: {
      text: string;
    };
  };
}

interface ScanResult {
  message: { text: string };
  level: string;
  locations: ResultLocation[];
  properties: {
    issue_confidence: string;
    issue_severity: string;
  };
}

interface ResultLocation {
  physicalLocation: {
    region: {
      snippet: { text: string };
      startLine: number;
    };
    artifactLocation: { uri: string };
    contextRegion: {
      snippet: { text: string };
      startLine: number;
      endLine: number;
    };
  };
}

export interface GroupedScanResults {
  results: ScanResultsGroupedByMessageText[];
}

// Represents ScanResults grouped by unique finding result message text
export interface ScanResultsGroupedByMessageText {
  messageText: string;
  findings: ScanResult[];
}

export interface SASTIgnoreRuleEntity {
  properties: {
    name: string;
    justification: string;
    ignoreString: string;
  };
}

export interface JupiterOneSastScanIgnoreRule {
  name: string;
  justification: string;
  ignoreString: string;
  scanner: string;
  webLink: string;
}

// NOTE: this is a 'virtual' representation of data from J1, and does not
// strictly represent a specific entity returned from the graph. In fact, it may
// abstract over an arbitrarily complex J1QL query that utilizes aliases to
// return data in this form
export interface JupiterOneECSTaskDefinition {
  createdOn: number;
  type: string;
  entityId: string;
  region: string;
  name: string;
  revision: number;
  arn: string;
  project: string;
  containerImages: string;
  webLink: string;
  accountName: string;
}

// NOTE: this is a 'virtual' representation of data from J1, and does not
// strictly represent a specific entity returned from the graph. In fact, it may
// abstract over an arbitrarily complex J1QL query that utilizes aliases to
// return data in this form
export interface JupiterOneLambdaFunction {
  entityId: string;
  lastModified: number;
  updatedOn: number;
  type: string;
  build: number;
  runtime: string;
  name: string;
  project: string;
  arn: string;
  region: string;
  webLink: string;
  accountName: string;
}
