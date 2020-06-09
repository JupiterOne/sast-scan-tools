# security-sast-scanner

Utilizes [AppThreat/sast-scan](https://github.com/AppThreat/sast-scan) to
perform static code scans for Lambda and ECS resources discovered in target
AWS accounts. See [SEC-820](https://lifeomic.atlassian.net/browse/SEC-820)
for additional details.

This tooling satisfies a security scanning requirement for FedRAMP Moderate,
and must minimally be deployed against any AWS accounts that are in scope for
FedRAMP.

## Process Overview

`sast-scanner` is a long-running periodic ECS task that operates per this diagram:
![diagram](https://www.websequencediagrams.com/files/render?link=sCex9iAO0LzaDyutM1VEhRCSDJSM3qJ6Q8wsi4uuGBlCcK43f0gNCnyfaUe5YQUA)

## Outputs

JupiterOne Findings, which will minimally have the following properties:

* remediated (boolean)
* federal (boolean)
* tag.Project
* tag.AccountName

as well as a HAS relationship with the Lambda or ECS Task that was scanned.
