module.exports = {
  projects: [
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: ["**/tests/unit/*.test.js", "**/tests/integration/*.test.js"],
    },
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["**/tests/frontend/*.test.js"],
    },
    {
      displayName: "e2e",
      testEnvironment: "node",
      testMatch: ["**/tests/e2e/*.test.js"],
    },
  ],
  collectCoverageFrom: ["src/**/*.js", "public/js/*.js", "!**/node_modules/**"],
  coverageReporters: ["text", "lcov", "html"],
};
