"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_SESSION = exports.TEST_GROUP = exports.TEST_CONTENT = exports.TEST_USERS = void 0;
exports.TEST_USERS = {
    facilitator: {
        email: "facilitator@e2e-test.com",
        password: "Test123!@#",
        name: "Test Facilitator",
        role: "COMMON_USER",
    },
    member1: {
        email: "member1@e2e-test.com",
        password: "Test123!@#",
        name: "Test Member 1",
        role: "COMMON_USER",
    },
    member2: {
        email: "member2@e2e-test.com",
        password: "Test123!@#",
        name: "Test Member 2",
        role: "COMMON_USER",
    },
};
exports.TEST_CONTENT = {
    pdf: {
        path: "./test/e2e/fixtures/test-document.pdf",
        title: "Test PDF Document",
        type: "PDF",
    },
    docx: {
        path: "./test/e2e/fixtures/test-document.docx",
        title: "Test DOCX Document",
        type: "DOCX",
    },
    txt: {
        path: "./test/e2e/fixtures/test-document.txt",
        title: "Test Text Document",
        type: "TXT",
    },
};
exports.TEST_GROUP = {
    name: "E2E Test Study Group",
    description: "Automated test group",
};
exports.TEST_SESSION = {
    mode: "PI_SPRINT",
    layer: "L1",
    roundsCount: 2,
};
//# sourceMappingURL=test-data.js.map