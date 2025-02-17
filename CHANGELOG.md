## v1.1.4

- Fix a problem where the `sha` passed in via `merge_group` events was wrong, causing commit checks to never complete

## v1.1.3

- Update README.md to include `deployment_type` examples

## v1.1.2

- Correct code sample in README where `GITHUB_TOKEN` is being passed as a `secrets` instead of an `env`

## v1.1.1

- Improve logging to facilitate debugging

## v1.1.0

- Expose an `eventId` on errors
- Output the `environmentId` on `attemptNotifyDeploy`

## v1.0.4

- Extract information from Github Event and send it to `attemptNotifyDeploy`

## v1.0.3

- Add `qawolf-base-url` optional input

## v1.0.2

- Fix action name on documentation

## v1.0.1

- Fix build problem and add branding

## v1.0.0

- Initial version
