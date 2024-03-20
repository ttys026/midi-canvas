const { join } = require("path");

const esmModules = ["decode-uri-component", "split-on-first", "filter-obj"];

module.exports = {
  preset: "ts-jest",
  rootDir: join(__dirname, "./"),
  cacheDirectory: join(__dirname, "./node_modules/.jest/cache"),
  testTimeout: 20 * 1000,
  collectCoverage: true,
  collectCoverageFrom: [
    "!**/*.d.{ts,tsx}",
    "!**/__test__/**/*",
    "src/**/*.{ts,tsx,js,jsx}",
  ],
  transform: {
    "^.+\\.(j|t)sx?$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ["jest-canvas-mock"],
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?(${esmModules.join("|")}))`,
  ],
};
