# Notify QA Wolf on Deploy

## Introduction

This action notifies QA Wolf that a deployment has been made, and initiate a run
if a matching trigger was found. Under the hood, this action uses [the `@qawolf/ci-sdk`
package](https://www.npmjs.com/package/@qawolf/ci-sdk).

## Inputs

Refer to the [official documentation](https://qawolf.notion.site/Deploy-Success-Webhook-dd72e46ceb7f451dae4e9ef06f64a2cc#1dac259797ce4d3589f957a19dab31ed) for more details.

### `qawolf-api-key`

**Required**. The QA Wolf API key, which you can find on the application's team settings page.

### `sha`

The SHA of the git commit to be tested. Depending on your setup, this might be necessary.

### `branch`

The git branch to be tested. This might also be required depending on your configuration.

### `deployment-type`

The trigger deployment type.

### `deployment-url`

The URL of the deployment to be tested.

### `deduplication-key`

An advanced feature that allows you to control run superseding.

### `commit-url`

If the GitHub application is not installed, you can pass the commit URL, and it will be displayed in the UI.

### `variables`

JSON-formatted environment variables for the deployment to be tested.

## Outputs

### `run-id`

The ID of the newly created run. This can be used with the `ci-greenlight` integration.

## Usage

> ⚠️ The following parameters given in the `with` clause may vary depending on your setup.
> Please contact a QA Wolf representative for more information.
> See also [this documentation page](https://qawolf.notion.site/Choosing-Fields-Based-on-Your-Setup-dd72e46ceb7f451dae4e9ef06f64a2cc?pvs=24#e2578484633a41b89447423d7d960f2b).

### Trigger action on `pull_request` events

[GitHub Docs: `pull_request` events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request)

```yml
name: Deploy and Notify QA Wolf
on: pull_request
jobs:
  # The deployment URL should be captured in this step, unless the
  # URL is statically defined for the target environment.
  deploy-preview-environmnent:
    name: Your custom job to deploy a preview environment
    uses: ./your-custom-action
  wait-for-deployment:
    name: Your custom job to wait for the deployed environment to be ready
    uses: ./your-custom-action
  notify:
    needs: deploy-preview-environmnent
    name: Trigger QA Wolf PR testing
    runs-on: ubuntu-latest
    steps:
      - name: Notify QA Wolf of deployment
        uses: qawolf/notify-deploy-action@v1
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
        with:
          qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
          # THIS IS JUST AN EXAMPLE.
          # The below parameters given in the `with` clause may vary depending on your setup.
          sha: "${{ github.event.pull_request.head.sha }}"
          branch: "${{ github.event.pull_request.head.ref }}"
          # If not static, this URL should be captured in the deployment step, and passed
          # down over here.
          deployment-url: ${{ needs.deploy-preview-environmnent.outputs.deployment-url || "https://example.com" }}
```

### Trigger action on `push` events

[GitHub Docs: `push` events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push)

```yml
name: Deploy and Notify QA Wolf
on:
  push:
    branches:
      - main
jobs:
  # The deployment URL should be captured in this step, unless the
  # URL is statically defined for the target environment.
  deploy-preview-environmnent:
    name: Your custom job to deploy a preview environment
    uses: ./your-custom-action
  wait-for-deployment:
    name: Your custom job to wait for the deployed environment to be ready
    uses: ./your-custom-action
  notify:
    needs: deploy-preview-environmnent
    name: Trigger QA Wolf PR testing
    runs-on: ubuntu-latest
    steps:
      # It is assumed that there is a deployment step before this one.
      # The deployment URL should be captured in that step, unless the
      # URL is statically defined for the target environment.
      - name: Notify QA Wolf of deployment
        uses: qawolf/notify-deploy-action@v1
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
        with:
          qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
          # THIS IS JUST AN EXAMPLE.
          # The below parameters given in the `with` clause may vary depending on your setup.
          sha: "${{ github.sha }}"
          branch: "${{ github.ref }}"
          # If not static, this URL should be captured in the deployment step, and passed
          # down over here.
          deployment-url: ${{ needs.deploy-preview-environmnent.outputs.deployment-url || "https://example.com" }}
```

### Reading the output from a subsequent job

> ⚠️ This is not required if you are using our GitHub application in PRs. See this
> [documentation page](https://qawolf.notion.site/Install-GitHub-GitLab-App-47cc1ec73f564808b73333b36ef85a11).

The `qawolf/notify-deploy-action` will output a `run-id` of the initiated run.
If you want to setup a job to poll the status of the run with our SDK
(see [this documentation page](https://www.notion.so/qawolf/Inspect-Run-Results-Programmatically-650df2f9a92a4c949d0da230015ee4d1)), you need to capture the run ID from the output.

```yml
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify QA Wolf of deployment
        # Add an id for the step
        id: notify-qa-wolf
        uses: qawolf/notify-deploy-action@v1
        # ...
      - name: Utilize run-id in Subsequent Step
        run: echo "The run-id is ${{ steps.notify-qa-wolf.outputs.run-id }}"
```
