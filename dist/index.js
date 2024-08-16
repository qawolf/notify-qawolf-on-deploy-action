"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const ci_sdk_1 = require("@qawolf/ci-sdk");
const ci_utils_1 = require("@qawolf/ci-utils");
const validateInput_1 = require("./validateInput");
async function runGitHubAction() {
    core.debug("Validating input.");
    const validationResult = (0, validateInput_1.validateInput)();
    if (!validationResult.isValid) {
        core.setFailed(`Action input is invalid: ${validationResult.error}`);
        return;
    }
    const { deployConfig, apiKey } = validationResult;
    const { attemptNotifyDeploy } = (0, ci_sdk_1.makeQaWolfSdk)({ apiKey }, {
        // Replace default log driver with core logging.
        log: ci_utils_1.coreLogDriver,
    });
    core.info("Attempting to notify QA Wolf of deployment.");
    const deployResult = await attemptNotifyDeploy({
        ...deployConfig,
        hostingService: "GitHub",
    });
    if (deployResult.outcome === "aborted") {
        core.setFailed(`Failed to reach QA Wolf API with reason "${deployResult.abortReason}" ${deployResult.httpStatus
            ? `, HTTP status ${deployResult.httpStatus}`
            : ""}.`);
        return;
    }
    if (deployResult.outcome === "failed") {
        core.setFailed(`Failed notifying QA Wolf of deployment with reason "${deployResult.failReason}"`);
        return;
    }
    const { runId } = deployResult;
    core.setOutput("run-id", runId);
}
runGitHubAction().catch((error) => {
    core.setFailed(`Action failed with reason: ${(0, ci_utils_1.stringifyUnknown)(error) ?? "Unknown error"}`);
});
//# sourceMappingURL=index.js.map