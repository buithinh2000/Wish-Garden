# Wish Garden AWS OIDC release gate

**Current state:** AWS staging code is merged on `main`, but no AWS resources have been provisioned or independently verified. This runbook is a permission boundary, not proof of a successful deploy.

## Strict identity
- AWS account: `916004827349`; region: `ap-southeast-1`.
- GitHub repository: `buithinh2000/Wish-Garden` (owner ID `59677589`, repository ID `1444894477` as observed in GitHub).
- Dedicated AWS role name: `WishGardenGitHubStagingDeployRole`, full ARN `arn:aws:iam::916004827349:role/WishGardenGitHubStagingDeployRole`.
- AWS IAM already has a GitHub OIDC provider for BuiTai workflows according to historical BuiTai CI, **but its current configuration has not been read**. Confirm the provider exists in this AWS account before creating the role. Do not create a duplicate.
- The trust policy template is `aws/iam/oidc-trust.json`. It authorizes **only** the Wish Garden `wish-garden-aws-staging` environment, using either recognized legacy or GitHub immutable-ID subject. Verify actual token `sub` format, and remove the unused alternative after proof.
- IMPORTANT: a GitHub job with an `environment` claim has a different `sub` from a job using the `main` ref claim. Configure **GitHub Environment `wish-garden-aws-staging` with deployment branch rule `main` only and optional required owner approval**. The workflow itself also limits `deploy` to main. The environment restriction is needed to prevent another branch obtaining temporary AWS credentials via the same environment.
- GitHub repository Actions variable `WISH_GARDEN_AWS_ROLE_ARN` must match the exact ARN above. Do not use `BuiTaiGitHubDeployRole` or any AWS access keys.

## IAM permissions review before making the role usable
The OIDC trust policy is **not** a permission policy. Creating a role with the trust alone gives it no AWS resource permissions. Attach an independently reviewed, least-privilege deployment policy for *only*:
1. `wish-garden-staging-site` and `wish-garden-staging-api` CloudFormation stacks, change sets and read-only stack descriptions in `ap-southeast-1`.
2. The project's S3 bucket `wish-garden-staging-site-916004827349-sg1`, with object upload/list/delete only; no unrelated buckets.
3. CloudFront distribution and OAC provisioned by this project; because some creation APIs require `Resource: "*"`, constrain creation to change sets and review individual resources, tags and role permissions.
4. `wish-garden-staging-api` Lambda, the project's API Gateway, project's DynamoDB table and CloudWatch log group.
5. `iam:PassRole` / `iam:CreateRole` / IAM policy mutations **only** for `WishGardenStagingLambdaRole-916004827349`, passed solely to Lambda; avoid wildcard role administration.
6. CloudFormation's required service operations. Consider a separate scoped CloudFormation execution role as a cleaner alternative to granting many create rights directly to GitHub Actions.
7. No `iam:AdministratorAccess`, `sts:AssumeRole` to other application roles, `rds:*`, `ecs:*`, `ec2:RunInstances`, unrelated project resources, or production actions.

**No all-purpose IAM policy is committed:** AWS service create permissions and their supported resource scoping must be reviewed against actual CloudFormation change sets before approval. Do not replace this with wildcard administrative permissions merely to get a green deploy.

## Controlled launch sequence
1. In AWS IAM, verify identity provider `token.actions.githubusercontent.com`, `aud=sts.amazonaws.com` and the exact expected OIDC subject. Review trust policy file, create dedicated Wish Garden role and scope its permissions.
2. In GitHub Wish-Garden Settings → Environments, configure `wish-garden-aws-staging` to allow only `main`. Set repository Actions variable `WISH_GARDEN_AWS_ROLE_ARN` to the dedicated role ARN.
3. Go to GitHub Actions → **Wish Garden AWS OIDC preflight (no deployment)**, choose branch `main`, click Run workflow. Require PASS; this workflow only calls STS to verify the identity and account. If it fails, do not attempt a deploy.
4. Go to GitHub Actions → **Wish Garden AWS-only staging migration**, `mode=validate` first; after PASS and explicit CloudFormation/IAM review, run `mode=deploy` from `main`.
5. Confirm site CloudFront domain, private bucket policy, Python Lambda response, disabled POST, DDB row count=0 and desktop/mobile 3D assets. Do not consider CI alone proof of live service.
6. Only after AWS preview verification, disable old GitHub Pages deployment, retire the exact Wish Garden Cloudflare Worker/D1 after confirming zero user rows, and archive the evidence.

## Cost boundaries
S3, CloudFront, API Gateway, Lambda, DynamoDB and logs may accrue usage-based costs. The workflow **does not** create an AWS Budget or enforce a hard spend cap. Check account budget/alerts before deployment; no cost estimate or always-free guarantee is asserted here.

Official guidance:
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
- https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html
