import * as core from "@actions/core";

import { makeQaWolfSdk } from "@qawolf/ci-sdk";
import { coreLogDriver, stringifyUnknown } from "@qawolf/ci-utils";

import { validateInput } from "./validateInput";

async function runGitHubAction() {
  core.debug("Validating input.");
  const validationResult = validateInput();
  if (!validationResult.isValid) {
    core.setFailed(`Action input is invalid: ${validationResult.error}`);
    return;
  }
  const { apiKey, deployConfig, qawolfBaseUrl } = validationResult;
  const { attemptNotifyDeploy } = makeQaWolfSdk(
    { apiKey, serviceBase: qawolfBaseUrl },
    {
      // Replace default log driver with core logging.
      log: coreLogDriver,
    },
  );
  core.info("Attempting to notify QA Wolf of deployment.");
  const deployResult = await attemptNotifyDeploy({
    ...deployConfig,
    hostingService: "GitHub",
  });
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
  const { runId } = deployResult;
  core.setOutput("run-id", runId);
}

runGitHubAction().catch((error) => {
  core.setFailed(
    `Action failed with reason: ${stringifyUnknown(error) ?? "Unknown error"}`,
  );
});
