"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async () => {
    console.log("[Test Teardown] Forcing cleanup of all async resources...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("[Test Teardown] Teardown complete");
};
//# sourceMappingURL=teardown-integration.js.map