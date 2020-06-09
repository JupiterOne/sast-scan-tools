# JupiterOne Tools for SAST-Scan

## Overview

The ingest functions exposed by this package will ingest the output of [AppThreat/sast-scan][1]. The scan output will be rendered in the JupiterOne graph as the following entities/relationships:

## Entities

The following entity resources are ingested:

| SAST Resource      | \_type of the Entity   | \_class of the Entity |
| ------------------ | ---------------------- | --------------------- |
| Grouped finding    | `sast_scan_finding`    | `Finding`             |

| Finding properties | Description                                    |
| ------------------ | ---------------------------------------------- |
| tag.AccountName    | AWS Tag for the account of the scanned item.   |
| tag.Project        | AWS Tag for the project/repo of scanned item.  |
| tag.Production     | AWS boolean Tag, item has production account.  |
| tag.Federal        | AWS boolean Tag, item has federal account.     |
| severity           | Highest severity level seen in finding group.  |
| displayName        | Scan message text for finding group.           |
| targetType         | What kind of AWS resource was scanned.         |
| targetWebLink      | AWS Console link to scanned resource.          |
| occurrences        | Times finding occurs within group.             |
| remediated         | boolean flag indicating finding is fixed.      |
| open               | boolean flag indicating finding is open.       |
| details            | reminder to check rawData for scan details.    |

## Relationships

The following relationships are created:

| From                  | Relationship | To                     |
| --------------------- | ------------ | ---------------------- |
| `aws_lambda_function` | **HAS**      | `sast_scan_finding`    |

[1]: https://github.com/AppThreat/sast-scan
