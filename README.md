# Notify QA Wolf on Deploy

## Introduction

This action notifies QA Wolf that a deployment, including preview deployments, has been made. For standard deployments, it initiates a run if a matching trigger is found. For preview deployments, if there is a matching pull request testing button trigger, a comment is added to the pull request, allowing the developer to manually initiate a run when ready. Under the hood, this action uses [the `@qawolf/ci-sdk`
package](https://www.npmjs.com/package/@qawolf/ci-sdk).

## Inputs

Refer to the [official documentation](https://qawolf.notion.site/Deploy-Success-Webhook-dd72e46ceb7f451dae4e9ef06f64a2cc#1dac259797ce4d3589f957a19dab31ed) for more details.

### `qawolf-api-key`

**Required**. The QA Wolf API key, which you can find on the application's team settings page.

### `deployment-type`

The trigger deployment type.

### `deployment-url`

The URL of the deployment to be tested.

### `deduplication-key`

An advanced feature that allows you to control run superseding.

### `variables`

JSON-formatted environment variables for the deployment to be tested.

## Auto-Extracted Inputs (Optional)

The following inputs are automatically extracted from the GitHub event context. They only need to be specified if you want to override the default values.

### `sha`

The SHA of the git commit to be tested.

### `branch`

The git branch to be tested.

### `commit-url`

If the GitHub application is not installed, you can pass the commit URL, and it will be displayed in the UI.

### `pull-request-number`

A pull request number associated with the deployment, if applicable.

## Outputs

### `run-id`

The ID of the newly created run. Notice that for preview deployments, no run is automatically initiated and therefore no `run-id` will be available.

## Usage

> ⚠️ The following parameters given in the `with` clause may vary depending on your setup.
> Please contact a QA Wolf representative for more information.
> See also [this documentation page](https://qawolf.notion.site/Choosing-Fields-Based-on-Your-Setup-dd72e46ceb7f451dae4e9ef06f64a2cc?pvs=24#e2578484633a41b89447423d7d960f2b).

### Trigger action on `push` events

This action can also be triggered on `push` events to notify QA Wolf of a deployment to a main branch or other branches. A run is automatically initiated if a matching trigger is found.

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
  deploy-environment:
    name: Your custom job to deploy
    uses: ./your-custom-action
  # !!IMPORTANT!!: If you don't wait for the deployment to be ready,
  # we might test an outdated version of your app.
  wait-for-deployment:
    name: Your custom job to wait for the deployed environment to be ready
    uses: ./your-custom-action
  notify:
    needs: wait-for-deployment
    name: Trigger QA Wolf PR testing
    runs-on: ubuntu-latest
    steps:
      # It is assumed that there is a deployment step before this one.
      # The deployment URL should be captured in that step, unless the
      # URL is statically defined for the target environment.
      - name: Notify QA Wolf of deployment
        uses: qawolf/notify-qawolf-on-deploy-action@v1
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
        with:
          qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
          # This URL should be captured in the deployment step.
          deployment-url: ${{ needs.deploy-environment.outputs.deployment-url || "https://static-url.com" }}
```

### Trigger action on `pull_request` events

Preview deployments are commonly used on pull requests to test changes before they are merged. This action can be triggered on `pull_request` events to notify QA Wolf of a preview deployment. Instead of automatically initiating a run, a comment is added to the pull request, allowing the developer to initiate a run when they are ready.

[GitHub Docs: `pull_request` events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request)

```yml
name: Deploy and Notify QA Wolf
on: pull_request
jobs:
  # The preview deployment URL should be captured in this step
  deploy-preview-environmnent:
    name: Your custom job to deploy a preview environment
    uses: ./your-custom-action
  # !!IMPORTANT!!: If you don't wait for the deployment to be ready,
  # we might test an outdated version of your app.
  wait-for-deployment:
    name: Your custom job to wait for the deployed environment to be ready
    uses: ./your-custom-action
  notify:
    needs: wait-for-deployment
    name: Trigger QA Wolf PR testing
    runs-on: ubuntu-latest
    steps:
      - name: Notify QA Wolf of preview deployment
        uses: qawolf/notify-qawolf-on-deploy-action@v1
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
        with:
          qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
          deployment-url: ${{ needs.deploy-preview-environment.outputs.deployment-url }}
```

### Trigger action on `deployment_status` events

This workflow is ideal for setups using third-party deployment services (like Vercel, Netlify, or Heroku) that automatically create GitHub deployment statuses. Unlike the `push` or `pull_request` triggers that require you to manage the deployment process (and wait for the deployment to complete), this trigger responds directly to deployment status updates from your hosting provider.

[GitHub Docs: `deployment_status` events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#deployment_status)

```yaml
name: Notify QA Wolf of Deployment
on: deployment_status
jobs:
  notify:
    name: Notify QA Wolf of deployment
    runs-on: ubuntu-latest
    steps:
      - name: Notify QA Wolf of deployment
        # Only notify QA Wolf if the deployment was successful
        if: ${{ github.event.deployment_status.state  == 'success' }}
        uses: qawolf/notify-qawolf-on-deploy-action@v1
        with:
          qawolf-api-key: "${{ secrets.QAWOLF_API_KEY }}"
          # Note that target_url is "The optional link added to the status.".
          # If your vendor is not setting the target_url, this action will not work.
          # You can either contact your vendor or try to compose the URL by following your vendor documentation.
          deployment-url: ${{ github.event.deployment_status.target_url }}
        secrets:
          # Required if trigger action is `deployment_status`
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Reading the output from a subsequent job (optional)

> ⚠️ This is not required if you are using our GitHub application in PRs. See this
> [documentation page](https://qawolf.notion.site/Install-GitHub-GitLab-App-47cc1ec73f564808b73333b36ef85a11).

The `qawolf/notify-deploy-action` will output a `run-id` of the initiated run for standard deployments. Note that for preview deployments, no run is automatically initiated and therefore no `run-id` will be available.

If you want to setup a job to poll the status of the run with our SDK for standard deployments
(see [this documentation page](https://www.notion.so/qawolf/Inspect-Run-Results-Programmatically-650df2f9a92a4c949d0da230015ee4d1)), you need to capture the run ID from the output.

```yml
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify QA Wolf of deployment
        # Add an id for the step
        id: notify-qa-wolf
        uses: qawolf/notify-qawolf-on-deploy-action@v1
        # ...
      - name: Utilize run-id in Subsequent Step
        run: echo "The run-id is ${{ steps.notify-qa-wolf.outputs.run-id }}"
```
