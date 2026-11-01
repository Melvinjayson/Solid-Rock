import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  use: { baseURL: "http://127.0.0.1:3100", headless: true },
  webServer: [
    {
      command:
        "npm run dev -w @solid-rock/admin -- --port 3100 --hostname 127.0.0.1",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      },
    },
    {
      command:
        "python3 -m http.server 3200 --bind 127.0.0.1 --directory apps/mobile/dist",
      url: "http://127.0.0.1:3200",
      reuseExistingServer: false,
    },
  ],
});
