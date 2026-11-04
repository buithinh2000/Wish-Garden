# Wish Garden — AWS-only staging migration

## Verified source checkpoint
- AWS target account: **916004827349**, region: **ap-southeast-1**.
- Repo: `buithinh2000/Wish-Garden`; AWS migration is confined to `aws/**`, `src/participation-v05.js`, and manual GitHub Actions.
- GitHub Pages remains the *existing* preview until AWS endpoint and all visual assets pass live smoke checks. Do not delete the existing working preview prematurely.
- Cloudflare Wish Garden staging from the prior phase has **zero known registered participants**, but a D1 and Worker exist. They must be retired only **after** AWS checks pass. Never touch other BuiTai Cloudflare Workers.
- This change alone **does not deploy any AWS resource**. No AWS direct service connector or Wish Garden-specific GitHub IAM role has been verified.
- Application's prior Cloudflare Turnstile client is replaced with an **AWS-only disabled-by-default participation panel**. No Cloudflare script/token runs.

## Expected AWS components
- CloudFormation stack `wish-garden-staging-site`: private, encrypted, versioned S3 bucket `wish-garden-staging-site-916004827349-sg1`; CloudFront with signed origin access (OAC), HTTPS preview and conservative price class.
- Stack `wish-garden-staging-api`: API Gateway HTTP endpoint + small Python 3.12 Lambda + isolated DynamoDB pay-per-request table `wish-garden-staging-participation-916004827349`, with no registrations enabled.
- `REGISTRATION_ENABLED=false` is enforced at all times by current Lambda implementation: all POST/DELETE operations return 503. The API returns only planning metadata and null community totals; it cannot fabricate registered users.
- No custom domain, Route 53, Cloudflare, EC2, ECS, RDS, SMS, email or paid model API required.
- Important: CloudFront, API Gateway, S3 and DynamoDB can incur real usage costs beyond free allowances. DynamoDB and CloudFront have no guarantee of a fixed monthly cap. Review AWS Budget alerts and stop if unexpected spend.

## IAM + OIDC deployment gate (not yet satisfied)
GitHub Actions runs **only on manual workflow_dispatch**, with `mode=validate` as its default. `mode=deploy` is allowed only from `main`, uses GitHub OIDC and requires a dedicated GitHub Actions variable `WISH_GARDEN_AWS_ROLE_ARN`.
- Create/review a least-privilege AWS role scoped to **the Wish Garden repo and main branch**. Do not reuse the broad BuiTai Core role or create static AWS access keys.
- For new GitHub repositories, OIDC subject claims may include owner/repository IDs. Check actual GitHub token subject and account IAM trust policy before assigning privileges; do not copy a generic wildcard trust policy.
- The deploy role needs only this project's stack change-set operations, scoped S3 upload and object deletion, CloudFront description, `lambda:UpdateFunctionCode`, `lambda:GetFunctionConfiguration`, and stack-specific creation permissions. CloudFormation creates a *named IAM role* inside the API stack; scope `iam:PassRole` and `iam:CreateRole` to `WishGardenStagingLambdaRole-916004827349` only. Review all necessary AWS resource-level policies before granting them.
- The workflow checks `sts:GetCallerIdentity` account equals 916004827349; uses no long-lived secrets.
- Note: protected GitHub environment `wish-garden-aws-staging` is recommended for additional review before the deployment job.

## Runbook — one controlled path
1. On `main` run **Wish Garden AWS-only staging migration** with `mode=validate`; ensure lint, Python tests and existing browser tests pass.
2. Configure the dedicated IAM role (above), GitHub variable, and optionally protected environment. Validate OIDC with STS before deployment.
3. Run the workflow with `mode=deploy` from `main`; it deploys site + API stack, uploads assets from the same existing 3D build, releases read-only Lambda, and prints the CloudFront preview/API URL.
4. Independently check the CloudFront page on mobile/desktop, 3D character loads, local wish/export works, API `GET /api/v1/summary` returns `PLANNING_NOT_TRANSMITTED` and `POST /api/v1/participation` returns `REGISTRATION_NOT_ENABLED` with no DynamoDB writes. Do not open remote consent yet.
5. Once AWS preview is accepted, disable old GitHub Pages automatic deploy, and separately delete **only** the Wish Garden staging Cloudflare Worker and D1, after rechecking its zero participant records. Retain code and audit history. Update public links.
6. The future phase for real remote opt-ins requires separate AWS-native anti-abuse design, revocation/retry tests and accurate privacy notice. Do not lift registration flag just to launch.

## Rollback
- Keep GitHub Pages preview accessible until AWS is verified.
- If stack creation fails, CloudFormation rollback must be inspected in AWS; do not delete an unknown pre-existing resource.
- S3 and DynamoDB have Retain policies. Cleanup therefore requires separately inspecting and approving those exact resources after stack deletion, to avoid data loss.
- If AWS frontend fails after deployment, point users to existing GitHub Pages preview until fixed.

Documentation:
- [CloudFront S3 Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [GitHub OIDC AWS configuration](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [AWS configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
