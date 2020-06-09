import JupiterOneClient from "@jupiterone/jupiterone-client-nodejs";
import {
  JupiterOneSastScanIgnoreRule,
  GroupedScanResults,
  JupiterOneLambdaFunction,
  JupiterOneECSTaskDefinition,
} from "./types";
import { rankSeverity } from "./filter";

export async function getJ1SASTScanIgnoreRules(
  j1Client: JupiterOneClient
): Promise<JupiterOneSastScanIgnoreRule[]> {
  const res = await j1Client.queryV1("FIND sast_scan_ignore_rule");
  return res.map((i) => i.properties) as JupiterOneSastScanIgnoreRule[];
}

export async function getJ1LambdaFunctionEntities(
  j1Client: JupiterOneClient,
  accountName: string,
  withinLast: string
): Promise<JupiterOneLambdaFunction[]> {
  // withinLast must be a string interpretable by J1's date parsing, like:
  // '30 days', '1 month', etc

  const query = `FIND aws_lambda_function 
  with tag.AccountName='${accountName}' 
  and _createdOn >= date.now - ${withinLast} 
  as f
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
    f.tag.Project as project`;

  const res = await j1Client.queryV1(query);
  return (res as unknown) as JupiterOneLambdaFunction[];
}

export async function getJ1ECSTaskDefinitionEntities(
  j1Client: JupiterOneClient,
  accountName: string,
  withinLast: string
): Promise<JupiterOneECSTaskDefinition[]> {
  const query = `FIND aws_ecs_task_definition with tag.AccountName='${accountName}' and _createdOn >= date.now - ${withinLast} as t
  RETURN
    t._createdOn as createdOn,
    t._id as entityId,
    t._type as type,
    t.region as region,
    t.name as name,
    t.revision as revision,
    t.arn as arn,
    t.containerImages as containerImages,
    t.webLink as webLink,
    t.tag.AccountName as accountName,
    t.tag.Project as project`;
  const res = await j1Client.queryV1(query);
  return (res as unknown) as JupiterOneECSTaskDefinition[];
}

interface FindingEntity {
  entity: {
    _id: string;
  };
}

export async function processFindingUpserts(
  j1Client: JupiterOneClient,
  scan: GroupedScanResults,
  codeEntity: JupiterOneLambdaFunction | JupiterOneECSTaskDefinition
): Promise<void> {
  for (const groupedResult of scan.results) {
    if (!groupedResult.findings.length) {
      continue;
    }
    const { messageText } = groupedResult;
    const highestSeveritySeen = rankSeverity(groupedResult);

    // key must be unique per entity. messageTexts (via grouping) are unique
    const key = `${codeEntity.arn}:sast-scan-finding:${messageText.replace(
      /\W/g,
      ""
    )}`;
    const {
      accountName,
      name,
      region,
      project,
      webLink,
      type: targetType,
    } = codeEntity;

    const findingEntity = (await (j1Client as JupiterOneClient).createEntity(
      key,
      "sast_scan_finding",
      ["Finding"],
      {
        "tag.AccountName": accountName,
        "tag.Project": project,
        "tag.Production": accountName.includes("prod"),
        "tag.Federal": accountName.includes("federal"),
        title: key,
        name,
        region,
        id: key,
        severity: highestSeveritySeen,
        createdOn: new Date().getTime(),
        updatedOn: new Date().getTime(),
        targetWebLink: webLink,
        targetType,
        displayName: messageText,
        occurences: groupedResult.findings.length,
        remediated: false,
        open: true,
        details: "see rawData",
      }
    )) as FindingEntity;

    const findingEntityId = findingEntity.entity._id;

    await j1Client.upsertEntityRawData(
      findingEntityId,
      "default",
      "application/json",
      groupedResult
    );

    await j1Client.createRelationship(
      `j1:${accountName}:workload-has-finding:${codeEntity.entityId}:${findingEntityId}`,
      "workload|has|finding",
      "HAS",
      codeEntity.entityId,
      findingEntityId
    );
  }
}
