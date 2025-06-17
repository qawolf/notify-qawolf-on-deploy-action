import { jest } from "@jest/globals";

import {
  mockContext,
  mockGetPullRequest,
  mockOctokit,
  mockPayload,
  mockPullRequest,
  mockSearchIssuesAndPullRequests,
  setupTestEnvironment,
} from "./test-setup.js";

jest.mock("@actions/github", () => ({
  context: mockContext,
  getOctokit: mockOctokit,
}));
const mockInfo = jest.fn();
jest.mock("@actions/core", () => ({
  error: jest.fn(),
  info: mockInfo,
  warning: jest.fn(),
}));

const github = await import("@actions/github");
const { extractRelevantDataFromEvent } = await import("./index.js");

describe("extractRelevantDataFromEvent", () => {
  let originalToken: string | undefined;

  beforeAll(() => {
    originalToken = process.env.GITHUB_TOKEN;
  });

  beforeEach(() => {
    originalToken = process.env.GITHUB_TOKEN;
    setupTestEnvironment();
  });

  afterAll(() => {
    process.env.GITHUB_TOKEN = originalToken;
  });

  it("should handle deployment_status events", async () => {
    github.context.eventName = "deployment_status";
    github.context.payload = {
      ...mockPayload,
      deployment: {
        sha: mockPullRequest.head.sha,
      },
    };
    mockSearchIssuesAndPullRequests.mockImplementationOnce(async () => ({
      data: { items: [] },
    }));

    const result = await extractRelevantDataFromEvent(github.context);

    expect(result).toEqual({
      commitUrl: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      sha: mockPullRequest.head.sha,
    });
  });

  it("should handle pull_request events", async () => {
    github.context.eventName = "pull_request";
    github.context.payload = {
      ...mockPayload,
      pull_request: {
        ...mockPullRequest,
        head: {
          ref: mockPullRequest.head.ref,
          sha: mockPullRequest.head.sha,
        },
      },
    };
    mockSearchIssuesAndPullRequests.mockImplementationOnce(async () => ({
      data: { items: [] },
    }));

    const result = await extractRelevantDataFromEvent(github.context);

    expect(result).toEqual({
      branch: mockPullRequest.head.ref,
      commitUrl: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      pullRequestNumber: mockPullRequest.number,
      sha: mockPullRequest.head.sha,
    });
  });

  it("should handle push events", async () => {
    github.context.eventName = "push";
    github.context.payload = {
      after: mockPullRequest.head.sha,
      head_commit: {
        url: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      },
    };

    const result = await extractRelevantDataFromEvent(github.context);

    expect(result).toEqual({
      branch: "main",
      commitUrl: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      sha: mockPullRequest.head.sha,
    });
  });

  it("should handle merge_group events", async () => {
    github.context.eventName = "merge_group";
    github.context.payload = {
      ...mockPayload,
      merge_group: {
        base_ref: "refs/heads/main",
        base_sha: "base-sha",
        head_ref: "refs/heads/gh-readonly-queue/main/pr-9531-base-sha",
        head_sha: mockPullRequest.head.sha,
      },
    };
    mockGetPullRequest.mockResolvedValue({
      data: mockPullRequest,
    });
    mockSearchIssuesAndPullRequests.mockResolvedValue({
      data: {
        items: [mockPullRequest],
      },
    });

    const result = await extractRelevantDataFromEvent(github.context);

    expect(result).toEqual({
      branch: "feature-branch",
      pullRequestNumber: 9531,
      sha: "test-sha",
    });
  });

  it("should handle push events with pull requests", async () => {
    github.context.eventName = "push";
    github.context.payload = {
      after: mockPullRequest.head.sha,
      head_commit: {
        url: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      },
    };
    mockGetPullRequest.mockResolvedValue({
      data: mockPullRequest,
    });
    mockSearchIssuesAndPullRequests.mockResolvedValue({
      data: {
        items: [
          {
            ...mockPullRequest,
            pull_request: {},
            state: "open",
            updated_at: "2020-03-19T00:00:00Z",
          },
          {
            ...mockPullRequest,
            number: mockPullRequest.number + 1,
            pull_request: {},
            state: "closed",
            title: "Latest PR",
            updated_at: "2020-03-18T00:00:00Z",
          },
        ],
      },
    });

    const result = await extractRelevantDataFromEvent(github.context);

    expect(result).toEqual({
      branch: "main",
      commitUrl: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      pullRequestNumber: mockPullRequest.number,
      sha: mockPullRequest.head.sha,
    });
  });

  it("should handle unknown events", async () => {
    github.context.eventName = "unknown";

    const result = await extractRelevantDataFromEvent(github.context);

    expect(result).toEqual({
      branch: "main",
      sha: mockPullRequest.head.sha,
    });
  });
});
