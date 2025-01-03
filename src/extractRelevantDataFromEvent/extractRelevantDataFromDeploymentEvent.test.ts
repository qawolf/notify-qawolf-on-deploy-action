import * as core from "@actions/core";
import * as github from "@actions/github";

import { extractRelevantDataFromDeployment } from ".";
import {
  mockPayload,
  mockPullRequest,
  setupTestEnvironment,
} from "./test-setup";

jest.mock("@actions/core");
jest.mock("@actions/github");

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
          }),
        },
      },
    };

    (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);

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
