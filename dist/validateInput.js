"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = validateInput;
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const ci_utils_1 = require("@qawolf/ci-utils");
const types_1 = require("./types");
function validateInput() {
    const qawolfApiKey = core.getInput("qawolf-api-key", {
        required: true,
    });
    const shaInput = core.getInput("sha", { required: false });
    const branchInput = core.getInput("branch", {
        required: false,
    });
    const deploymentTypeInput = core.getInput("deployment-type", {
        required: false,
    });
    const deploymentUrlInput = core.getInput("deployment-url", {
        required: false,
    });
    const environmentVariablesInput = core.getInput("variables", {
        required: false,
    });
    const deduplicationKeyInput = core.getInput("deduplication-key", {
        required: false,
    });
    const commitUrlInput = core.getInput("commit-url", {
        required: false,
    });
    if (!shaInput && !branchInput && !deploymentTypeInput) {
        return {
            error: "At least one of 'sha', 'branch' or 'deployment-type' input must be provided",
            isValid: false,
        };
    }
    let validatedEnvironmentVariables;
    let validatedCommitUrl;
    let validatedDeploymentUrl;
    if (commitUrlInput) {
        const result = types_1.urlSchema.safeParse(commitUrlInput);
        if (!result.success) {
            return {
                error: "'commit-url' input must be a valid URL",
                isValid: false,
            };
        }
        validatedCommitUrl = result.data;
    }
    if (deploymentUrlInput) {
        const result = types_1.urlSchema.safeParse(deploymentUrlInput);
        if (!result.success) {
            return {
                error: "'deployment-url' input must be a valid URL",
                isValid: false,
            };
        }
        validatedDeploymentUrl = result.data;
    }
    if (environmentVariablesInput) {
        const result = ci_utils_1.jsonEnvironmentVariablesSchema.safeParse(environmentVariablesInput);
        if (!result.success) {
            return {
                error: "'variables' input must be a valid JSON string",
                isValid: false,
            };
        }
        validatedEnvironmentVariables = result.data;
    }
    return {
        apiKey: qawolfApiKey,
        deployConfig: {
            branch: branchInput,
            commitUrl: validatedCommitUrl,
            deduplicationKey: deduplicationKeyInput,
            deploymentType: deploymentTypeInput,
            deploymentUrl: validatedDeploymentUrl,
            sha: shaInput,
            variables: validatedEnvironmentVariables,
        },
        isValid: true,
    };
}
//# sourceMappingURL=validateInput.js.map