// Playwright config for the Lokta component a11y + interaction suite.
// Serves the built docs site so the spec can hit /components.html.
export default {
  testDir: "validate",
  timeout: 30000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:8080" },
  webServer: {
    command: "python3 -m http.server 8080 -d site",
    url: "http://localhost:8080/components.html",
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
};
