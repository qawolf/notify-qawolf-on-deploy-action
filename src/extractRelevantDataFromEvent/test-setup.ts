import { jest } from "@jest/globals";

import {
  type PullGetPartialResponse,
  type PullSearchPartialResponse,
} from "./mock-types.js";

const TEST_BRANCH = "feature-branch";
const TEST_PR_NUMBER = 123;
const TEST_PR_TITLE = "Test PR";
const TEST_SHA = "test-sha";
const TEST_DATE = "2024-03-20T00:00:00Z";

export const mockPayload = {
  repository: {
    full_name: "owner/repo",
    name: "repo",
    owner: {
      login: "owner",
    },
  },
};

export const mockPullRequest = {
  head: { ref: TEST_BRANCH, sha: TEST_SHA },
  number: TEST_PR_NUMBER,
  state: "open" as const,
  title: TEST_PR_TITLE,
  updated_at: TEST_DATE,
};

export const mockContext = {
  eventName: "",
  ref: "refs/heads/main",
  get repo() {
    return { owner: "owner", repo: "repo" };
  },
  sha: TEST_SHA,
};

export const setupTestEnvironment = () => {
  process.env.GITHUB_TOKEN = "test-token";
};

export const mockGetPullRequest =
  jest.fn<() => Promise<PullGetPartialResponse>>();
export const mockSearchIssuesAndPullRequests =
  jest.fn<() => Promise<PullSearchPartialResponse>>();
export const mockOctokit = jest.fn().mockImplementation(() => ({
  rest: {
    pulls: {
      get: mockGetPullRequest,
    },
    search: {
      issuesAndPullRequests: mockSearchIssuesAndPullRequests,
    },
  },
}));
