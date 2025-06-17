import * as core from "@actions/core";
import * as github from "@actions/github";

import { type GitHubDeployConfig } from "@qawolf/ci-sdk";
import {
  type EnvironmentVariables,
  jsonEnvironmentVariablesSchema,
} from "@qawolf/ci-utils";

import { type RelevantEventData } from "./extractRelevantDataFromEvent/index.js";
import { urlSchema } from "./types.js";

export function validateInput(
  relevantEventData: RelevantEventData | undefined,
):
  | {
      apiKey: string;
      deployConfig: GitHubDeployConfig;
      isValid: true;
      qawolfBaseUrl: string | undefined;
    }
  | {
      error: string;
      isValid: false;
    } {
  const qawolfApiKey = core.getInput("qawolf-api-key", {
    required: true,
  });
  const shaInput =
    core.getInput("sha", { required: false }) || relevantEventData?.sha;
  const branchInput =
    core.getInput("branch", {
      required: false,
    }) || relevantEventData?.branch;
  const deploymentTypeInput =
    core.getInput("deployment-type", {
      required: false,
    }) || undefined;
  const deploymentUrlInput = core.getInput("deployment-url", {
    required: false,
  });
  const environmentVariablesInput = core.getInput("variables", {
    required: false,
  });
  const deduplicationKeyInput =
    core.getInput("deduplication-key", {
      required: false,
    }) || undefined;
  const commitUrlInput =
    core.getInput("commit-url", {
      required: false,
    }) || relevantEventData?.commitUrl;
  const pullRequestNumberInput =
    core.getInput("pull-request-number", {
      required: false,
    }) || relevantEventData?.pullRequestNumber;

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

  // NOTE: Returns an empty string if the value is not defined.
  const rawQawolfBaseUrl = core.getInput("qawolf-base-url").trim();
  const qawolfBaseUrl = rawQawolfBaseUrl || undefined;

  return {
    apiKey: qawolfApiKey,
    deployConfig: {
      branch: branchInput,
      commitUrl: validatedCommitUrl,
      deduplicationKey: deduplicationKeyInput,
      deploymentType: deploymentTypeInput,
      deploymentUrl: validatedDeploymentUrl,
      hostingService: "GitHub",
      pullRequestNumber:
        pullRequestNumberInput !== undefined
          ? Number(pullRequestNumberInput)
          : undefined,
      repository: {
        name: github.context.repo.repo,
        owner: github.context.repo.owner,
      },
      sha: shaInput,
      variables: validatedEnvironmentVariables,
    },
    isValid: true,
    qawolfBaseUrl,
  };
}
