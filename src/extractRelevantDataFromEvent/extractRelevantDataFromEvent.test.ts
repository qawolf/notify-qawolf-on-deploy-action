import * as github from "@actions/github";

import { extractRelevantDataFromEvent } from ".";
import {
  mockPayload,
  mockPullRequest,
  setupTestEnvironment,
} from "./test-setup";

jest.mock("@actions/core");
jest.mock("@actions/github");

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

    const mockOctokit = {
      rest: {
        pulls: {
          get: jest.fn().mockResolvedValue({
            data: mockPullRequest,
          }),
        },
        search: {
          issuesAndPullRequests: jest.fn().mockResolvedValue({
            data: {
              items: [{ ...mockPullRequest }],
            },
          }),
        },
      },
    };

    (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);

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

    const mockOctokit = {
      rest: {
        pulls: {
          get: jest.fn().mockResolvedValue({
            data: mockPullRequest,
          }),
        },
        search: {
          issuesAndPullRequests: jest.fn().mockResolvedValue({
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
          }),
        },
      },
    };

    (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
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
