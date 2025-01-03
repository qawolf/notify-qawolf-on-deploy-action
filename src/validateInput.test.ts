import * as core from "@actions/core";

import { validateInput } from "./validateInput";

// Mock the @actions/core and @actions/github modules
jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "owner",
      repo: "repo",
    },
  },
}));

describe("validateInput", () => {
  const mockInputs = (overrides: Record<string, string | undefined> = {}) => {
    const defaultInputs = {
      branch: "main",
      "commit-url": "https://github.com/owner/repo/commit",
      "deduplication-key": "test-key",
      "deployment-type": "production",
      "deployment-url": "https://example.com",
      "pull-request-number": "123",
      "qawolf-api-key": "test-api-key",
      "qawolf-base-url": "https://qawolf.com",
      sha: "test-sha",
      variables: JSON.stringify({ key: "value" }),
    };

    (core.getInput as jest.Mock).mockImplementation((name) => {
      return name in overrides
        ? overrides[name]
        : defaultInputs[name as keyof typeof defaultInputs];
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error when required inputs are missing", () => {
    mockInputs({
      branch: "",
      "deployment-type": "",
      "qawolf-api-key": "",
      sha: "",
    });
    const result = validateInput(undefined);

    expect(result).toEqual({
      error:
        "At least one of 'sha', 'branch' or 'deployment-type' input must be provided",
      isValid: false,
    });
  });

  it("should validate with minimal required inputs", () => {
    mockInputs({
      branch: "",
      "commit-url": "",
      "deduplication-key": "",
      "deployment-type": "",
      "deployment-url": "",
      "pull-request-number": "",
      "qawolf-base-url": "",
      variables: "",
    });
    const result = validateInput(undefined);

    expect(result).toEqual({
      apiKey: "test-api-key",
      deployConfig: {
        branch: undefined,
        commitUrl: undefined,
        deduplicationKey: undefined,
        deploymentType: undefined,
        deploymentUrl: undefined,
        hostingService: "GitHub",
        pullRequestNumber: undefined,
        repository: {
          name: "repo",
          owner: "owner",
        },
        sha: "test-sha",
        variables: undefined,
      },
      isValid: true,
      qawolfBaseUrl: undefined,
    });
  });

  it("should validate deployment URL", () => {
    mockInputs({ "deployment-url": "invalid-url" });
    const result = validateInput(undefined);

    expect(result).toEqual({
      error: "'deployment-url' input must be a valid URL",
      isValid: false,
    });
  });

  it("should validate with all inputs", () => {
    mockInputs();
    const result = validateInput(undefined);

    expect(result).toEqual({
      apiKey: "test-api-key",
      deployConfig: {
        branch: "main",
        commitUrl: "https://github.com/owner/repo/commit",
        deduplicationKey: "test-key",
        deploymentType: "production",
        deploymentUrl: "https://example.com",
        hostingService: "GitHub",
        pullRequestNumber: 123,
        repository: {
          name: "repo",
          owner: "owner",
        },
        sha: "test-sha",
        variables: { key: "value" },
      },
      isValid: true,
      qawolfBaseUrl: "https://qawolf.com",
    });
  });

  it("should validate using extracted relevant event data", () => {
    mockInputs({
      branch: "",
      "commit-url": "",
      "pull-request-number": "",
      sha: "",
    });

    const relevantEventData = {
      branch: "feature/branch",
      commitUrl: "https://github.com/owner/repo/commit/abc123",
      pullRequestNumber: 456,
      sha: "abc123",
    };

    const result = validateInput(relevantEventData);

    expect(result).toEqual({
      apiKey: "test-api-key",
      deployConfig: {
        branch: "feature/branch",
        commitUrl: "https://github.com/owner/repo/commit/abc123",
        deduplicationKey: "test-key",
        deploymentType: "production",
        deploymentUrl: "https://example.com",
        hostingService: "GitHub",
        pullRequestNumber: 456,
        repository: {
          name: "repo",
          owner: "owner",
        },
        sha: "abc123",
        variables: { key: "value" },
      },
      isValid: true,
      qawolfBaseUrl: "https://qawolf.com",
    });
  });
});
