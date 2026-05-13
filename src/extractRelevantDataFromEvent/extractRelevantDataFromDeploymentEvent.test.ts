import { jest } from "@jest/globals";

import {
  mockContext,
  mockGetPullRequest,
  mockOctokit,
  mockPayload,
  mockPullRequest,
  mockSearchIssuesAndPullRequests,
} from "./test-setup.js";

jest.unstable_mockModule("@actions/github", () => ({
  context: mockContext,
  getOctokit: mockOctokit,
}));
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
        title: "Latest PR",
        updated_at: "2020-03-19T00:00:00Z",
      },
      {
        ...mockPullRequest,
        number: mockPullRequest.number + 1,
        pull_request: {},
        state: "open",
        title: "Older PR",
        updated_at: "2020-03-18T00:00:00Z",
      },
    ],
  },
});
const mockInfo = jest.fn();
jest.mock("@actions/core", () => ({
  error: jest.fn(),
  info: mockInfo,
  warning: jest.fn(),
}));

const core = await import("@actions/core");
const github = await import("@actions/github");

jest.unstable_mockModule("../env.js", () => ({
  env: {
    GITHUB_TOKEN: "test-token",
  },
}));

const { extractRelevantDataFromDeployment } = await import("./index.js");

describe("extractRelevantDataFromDeploymentEvent", () => {
  it("should handle multiple associated pull requests", async () => {
    github.context.payload = {
      deployment: {
        sha: mockPullRequest.head.sha,
      },
      ...mockPayload,
    };

    const result = await extractRelevantDataFromDeployment(github.context);

    expect(result).toEqual({
      branch: mockPullRequest.head.ref,
      commitUrl: `https://github.com/owner/repo/commit/${mockPullRequest.head.sha}`,
      pullRequestNumber: mockPullRequest.number,
      sha: mockPullRequest.head.sha,
    });

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining("Found exact SHA = test-sha match in PR #123"),
    );
  });
});
