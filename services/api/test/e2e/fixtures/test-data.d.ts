export declare const TEST_USERS: {
    readonly facilitator: {
        readonly email: "facilitator@e2e-test.com";
        readonly password: "Test123!@#";
        readonly name: "Test Facilitator";
        readonly role: "COMMON_USER";
    };
    readonly member1: {
        readonly email: "member1@e2e-test.com";
        readonly password: "Test123!@#";
        readonly name: "Test Member 1";
        readonly role: "COMMON_USER";
    };
    readonly member2: {
        readonly email: "member2@e2e-test.com";
        readonly password: "Test123!@#";
        readonly name: "Test Member 2";
        readonly role: "COMMON_USER";
    };
};
export declare const TEST_CONTENT: {
    readonly pdf: {
        readonly path: "./test/e2e/fixtures/test-document.pdf";
        readonly title: "Test PDF Document";
        readonly type: "PDF";
    };
    readonly docx: {
        readonly path: "./test/e2e/fixtures/test-document.docx";
        readonly title: "Test DOCX Document";
        readonly type: "DOCX";
    };
    readonly txt: {
        readonly path: "./test/e2e/fixtures/test-document.txt";
        readonly title: "Test Text Document";
        readonly type: "TXT";
    };
};
export declare const TEST_GROUP: {
    readonly name: "E2E Test Study Group";
    readonly description: "Automated test group";
};
export declare const TEST_SESSION: {
    readonly mode: "PI_SPRINT";
    readonly layer: "L1";
    readonly roundsCount: 2;
};
