import * as core from "@actions/core";
import * as github from "@actions/github";

export async function fetchPullRequestDataFromMergeGroupRef(headRef: string) {
  // Match pattern: gh-readonly-queue/{branch}/pr-{number}-{hash}
  const match = headRef.match(/gh-readonly-queue\/.*\/pr-(\d+)-/);
  const pullRequestNumber = match && match[1] ? Number(match[1]) : undefined;

  if (!pullRequestNumber) {
    core.info(
      `Unable to get pull request number from merge group ref: ${headRef}`,
    );
    return "no-pull-request";
  }

  if (!process.env.GITHUB_TOKEN) {
    core.info(
      "GITHUB_TOKEN is missing, skipping branch extraction for merge group",
    );
    return { pullRequestNumber };
  }

  const { context } = github;
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    pull_number: pullRequestNumber,
    repo: context.repo.repo,
  });

  return {
    branch: pullRequest.head.ref,
    pullRequestNumber,
  };
}
