import * as core from "@actions/core";
import * as github from "@actions/github";

import { makeQaWolfSdk } from "@qawolf/ci-sdk";
import { coreLogDriver, stringifyUnknown } from "@qawolf/ci-utils";

import { version } from "../package.json";

import { extractRelevantDataFromEvent } from "./extractRelevantDataFromEvent";
import { validateInput } from "./validateInput";

async function runGitHubAction() {
  core.debug("Extracting relevant event data.");
  const relevantEventData = await extractRelevantDataFromEvent(github.context);
  core.debug(`Relevant event data: ${JSON.stringify(relevantEventData)}`);
  core.debug("Validating input.");
  const validationResult = validateInput(relevantEventData);
  if (!validationResult.isValid) {
    core.setFailed(`Action input is invalid: ${validationResult.error}`);
    return;
  }
  const { apiKey, deployConfig, qawolfBaseUrl } = validationResult;
  const { attemptNotifyDeploy } = makeQaWolfSdk(
    {
      apiKey,
      serviceBase: qawolfBaseUrl,
      userAgent: `notify-qawolf-on-deploy-action/${version}`,
    },
    {
      // Replace default log driver with core logging.
      log: coreLogDriver,
    },
  );
  core.info("Attempting to notify QA Wolf of deployment.");
  const deployResult = await attemptNotifyDeploy(deployConfig);
  if (deployResult.outcome === "aborted") {
    core.setFailed(
      `Failed to reach QA Wolf API with reason "${deployResult.abortReason}" ${
        deployResult.httpStatus
          ? `, HTTP status ${deployResult.httpStatus}`
          : ""
      }.`,
    );
    return;
  }
  if (deployResult.outcome === "failed") {
    core.setFailed(
      `Failed notifying QA Wolf of deployment with reason "${deployResult.failReason}"`,
    );
    return;
  }
  const { environmentId, runId } = deployResult;
  core.setOutput("environment-id", environmentId);
  core.setOutput("run-id", runId);
}

runGitHubAction().catch((error) => {
  core.setFailed(
    `Action failed with reason: ${stringifyUnknown(error) ?? "Unknown error"}`,
  );
});
