import * as core from "@actions/core";
import { type DeployConfig } from "@qawolf/ci-sdk";
import {
  type EnvironmentVariables,
  jsonEnvironmentVariablesSchema,
} from "@qawolf/ci-utils";

import { urlSchema } from "./types";

export function validateInput():
  | {
      apiKey: string;
      deployConfig: Omit<DeployConfig, "hostingService">;
      isValid: true;
    }
  | {
      error: string;
      isValid: false;
    } {
  const qawolfApiKey = core.getInput("qawolf-api-key", {
    required: true,
  });
  const shaInput = core.getInput("sha", { required: false });
  const branchInput = core.getInput("branch", {
    required: false,
  });
  const deploymentTypeInput = core.getInput("deployment-type", {
    required: false,
  });
  const deploymentUrlInput = core.getInput("deployment-url", {
    required: false,
  });
  const environmentVariablesInput = core.getInput("variables", {
    required: false,
  });
  const deduplicationKeyInput = core.getInput("deduplication-key", {
    required: false,
  });
  const commitUrlInput = core.getInput("commit-url", {
    required: false,
  });

  if (!shaInput && !branchInput && !deploymentTypeInput) {
    return {
      error:
        "At least one of 'sha', 'branch' or 'deployment-type' input must be provided",
      isValid: false,
    };
  }

  let validatedEnvironmentVariables: EnvironmentVariables | undefined;
  let validatedCommitUrl: string | undefined;
  let validatedDeploymentUrl: string | undefined;

  if (commitUrlInput) {
    const result = urlSchema.safeParse(commitUrlInput);
    if (!result.success) {
      return {
        error: "'commit-url' input must be a valid URL",
        isValid: false,
      };
    }
    validatedCommitUrl = result.data;
  }

  if (deploymentUrlInput) {
    const result = urlSchema.safeParse(deploymentUrlInput);
    if (!result.success) {
      return {
        error: "'deployment-url' input must be a valid URL",
        isValid: false,
      };
    }
    validatedDeploymentUrl = result.data;
  }

  if (environmentVariablesInput) {
    const result = jsonEnvironmentVariablesSchema.safeParse(
      environmentVariablesInput,
    );
    if (!result.success) {
      return {
        error: "'variables' input must be a valid JSON string",
        isValid: false,
      };
    }
    validatedEnvironmentVariables = result.data;
  }

  return {
    apiKey: qawolfApiKey,
    deployConfig: {
      branch: branchInput,
      commitUrl: validatedCommitUrl,
      deduplicationKey: deduplicationKeyInput,
      deploymentType: deploymentTypeInput,
      deploymentUrl: validatedDeploymentUrl,
      sha: shaInput,
      variables: validatedEnvironmentVariables,
    },
    isValid: true,
  };
}
