import * as github from "@actions/github";

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
  state: "open",
  title: TEST_PR_TITLE,
  updated_at: TEST_DATE,
};

export const mockOctokit = {
  rest: {
    repos: {
      listPullRequestsAssociatedWithCommit: jest.fn().mockResolvedValue({
        data: [mockPullRequest],
      }),
    },
  },
};

export const setupGithubContext = () => {
  (github.context as Partial<typeof github.context>) = {
    eventName: "",
    ref: "refs/heads/main",
    repo: {
      owner: "owner",
      repo: "repo",
    },
    sha: TEST_SHA,
  };
};

export const setupTestEnvironment = () => {
  jest.resetAllMocks();
  setupGithubContext();
  (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
  process.env.GITHUB_TOKEN = "test-token";
};
