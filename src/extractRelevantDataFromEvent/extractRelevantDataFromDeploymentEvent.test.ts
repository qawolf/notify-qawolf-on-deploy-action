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
const { extractRelevantDataFromDeployment } = await import("./index.js");

describe("extractRelevantDataFromDeploymentEvent", () => {
  let originalToken: string | undefined;

  beforeAll(() => {
    originalToken = process.env.GITHUB_TOKEN;
  });

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    process.env.GITHUB_TOKEN = originalToken;
  });

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
