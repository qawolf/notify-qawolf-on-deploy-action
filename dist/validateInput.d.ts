import { type DeployConfig } from "@qawolf/ci-sdk";
export declare function validateInput(): {
    apiKey: string;
    deployConfig: Omit<DeployConfig, "hostingService">;
    isValid: true;
} | {
    error: string;
    isValid: false;
};
//# sourceMappingURL=validateInput.d.ts.map