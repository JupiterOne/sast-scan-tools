# sast-scan-tool

NodeJS functions and scripts for using [AppThreat/sast-scan](https://github.com/AppThreat/sast-scan) to
perform static code scans against Lambda and ECS resources discovered in target AWS accounts.

## Example script usage (using locally available .aws/config)

This script example will:

* query JupiterOne for lambda functions created or updated in the last 30 days
* retrieve their associated zipfiles  (you will need Lambda.GetFunction permissions)
* scan the unzipped code with `sast-scan`
* ingest the output into JupiterOne as Finding entities

```bash
env J1_API_TOKEN=eyJhoCJ1... J1_ACCOUNT=mycorp AWS_SDK_LOAD_CONFIG=true ./bin/scan-lambda.ts
```

## Outputs

JupiterOne Findings, which will minimally have the following properties:

* remediated (boolean)
* federal (boolean)
* tag.Project
* tag.AccountName

as well as a HAS relationship with the Lambda that was scanned.
