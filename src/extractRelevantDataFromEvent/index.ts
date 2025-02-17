import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  type DeploymentStatusCreatedEvent,
  type MergeGroupEvent,
  type PullRequestEvent,
  type PushEvent,
} from "@octokit/webhooks-types";

import { fetchPullRequestDataFromMergeGroupRef } from "./fetchPullRequestDataFromMergeGroupRef";

export type RelevantEventData = {
  branch?: string;
  commitUrl?: string;
  pullRequestNumber?: number;
  sha?: string;
};

export const extractRelevantDataFromEvent = async (
  context: typeof github.context,
): Promise<RelevantEventData | undefined> => {
  try {
    switch (context.eventName) {
      case "deployment_status":
        return extractRelevantDataFromDeployment(context);
      case "merge_group":
        return extractRelevantDataFromMergeGroup(context);
      case "pull_request":
      case "pull_request_target":
        return extractRelevantDataFromPullRequest(context);
      case "push":
        return extractRelevantDataFromPush(context);
      default: {
        // Try to extract basic information from any event
        return {
          branch: context.ref?.replace("refs/heads/", ""),
          sha: context.sha,
        };
      }
    }
  } catch (error) {
    core.debug(`Failed to extract event data: ${error}`);
    return undefined;
  }
};

export const extractRelevantDataFromPullRequest = async (
  context: typeof github.context,
): Promise<RelevantEventData> => {
  const event = context.payload as PullRequestEvent;
  return {
    branch: event.pull_request.head.ref,
    commitUrl: `https://github.com/${event.repository.full_name}/commit/${event.pull_request.head.sha}`,
    pullRequestNumber: event.pull_request.number,
    sha: event.pull_request.head.sha,
  };
};

export const extractRelevantDataFromPush = async (
  context: typeof github.context,
): Promise<RelevantEventData> => {
  const push = context.payload as PushEvent;
  const pullRequestData = await fetchPullRequestData(push.after);
  return {
    ...(typeof pullRequestData === "object" ? pullRequestData : {}),
    branch: context.ref.replace("refs/heads/", ""),
    commitUrl: push.head_commit?.url,
    sha: push.after,
  };
};

export const extractRelevantDataFromMergeGroup = async (
  context: typeof github.context,
): Promise<RelevantEventData> => {
  const mergeGroup = context.payload as MergeGroupEvent;
  const pullRequestData = await fetchPullRequestDataFromMergeGroupRef(
    mergeGroup.merge_group.head_ref,
  );
  if (typeof pullRequestData === "string") {
    core.info(
      `Unable to get pull request info for merge group: ${pullRequestData}`,
    );
  }
  return {
    branch: mergeGroup.merge_group.head_ref.replace("refs/heads/", ""),
    sha: mergeGroup.merge_group.head_sha,
    ...(typeof pullRequestData === "object" ? pullRequestData : {}),
  };
};

export const extractRelevantDataFromDeployment = async (
  context: typeof github.context,
): Promise<RelevantEventData> => {
  const event = context.payload as DeploymentStatusCreatedEvent;
  const pullRequestData = await fetchPullRequestData(event.deployment.sha);
  if (typeof pullRequestData === "string") {
    core.info(
      `Unable to get pull request info from deployment: ${pullRequestData}`,
    );
  }
  return {
    ...(typeof pullRequestData === "object" ? pullRequestData : {}),
    commitUrl: `https://github.com/${event.repository.full_name}/commit/${event.deployment.sha}`,
    sha: event.deployment.sha,
  };
};

async function fetchPullRequestData(
  sha: string,
): Promise<
  | { branch?: string; pullRequestNumber?: number }
  | "no-pull-request"
  | "fail-to-fetch-pull-request-data"
  | "missing-github-token"
> {
  if (!process.env.GITHUB_TOKEN) {
    core.info("GITHUB_TOKEN is missing, skipping pull request data extraction");
    return "missing-github-token";
  }

  const { context } = github;
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  try {
    const { data: searchData } =
      await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${context.repo.owner}/${context.repo.repo} is:pr ${sha} sort:updated-desc`,
      });

    // Filter out PRs that are open
    const sortedOpenPullRequests = searchData.items.filter(
      (item) => item.pull_request && item.state === "open",
    );

    if (!sortedOpenPullRequests.length) {
      core.info(
        `No open pull requests found for sha = ${sha}. This is only an issue if you're running this action on a PR.`,
      );
      return "no-pull-request";
    }

    // Fetch all PR details in parallel
    const pullRequestDetails = await Promise.all(
      sortedOpenPullRequests.map((pr) =>
        octokit.rest.pulls
          .get({
            owner: context.repo.owner,
            pull_number: pr.number,
            repo: context.repo.repo,
          })
          .then((response) => response.data),
      ),
    );

    // First try to find a PR where SHA matches the head
    const exactMatch = pullRequestDetails.find((pr) => pr.head.sha === sha);
    if (exactMatch) {
      core.info(`Found exact SHA = ${sha} match in PR #${exactMatch.number}`);
      return {
        branch: exactMatch.head.ref,
        pullRequestNumber: exactMatch.number,
      };
    }

    // Fall back to most recent PR
    const mostRecent = pullRequestDetails[0];
    if (!mostRecent) return "no-pull-request";
    core.info(
      `No PR found with head SHA = ${sha}. Using most recent PR #${mostRecent.number} containing SHA = ${sha}`,
    );

    return {
      branch: mostRecent.head.ref,
      pullRequestNumber: mostRecent.number,
    };
  } catch (error) {
    core.info(`Failed to fetch pull request data: ${error}`);
    return "fail-to-fetch-pull-request-data";
  }
}
