import { test, expect } from "@playwright/test";

test("guest cannot access church office controls", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gather. Connect. Serve." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Staff sign in" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create an event" }),
  ).toHaveCount(0);
});

test("staff signs in, publishes an event and views registrations with mocked transport", async ({
  page,
}) => {
  const uid = "00000000-0000-0000-0000-000000000001";
  const user = {
    id: uid,
    aud: "authenticated",
    role: "authenticated",
    email: "staff@example.test",
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token = [
    "eyJhbGciOiJIUzI1NiJ9",
    Buffer.from(
      JSON.stringify({
        sub: uid,
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "authenticated",
        role: "authenticated",
      }),
    ).toString("base64url"),
    "test",
  ].join(".");
  let items: Record<string, unknown>[] = [];
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/auth/v1/token")
      body = {
        access_token: token,
        refresh_token: "test-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      };
    else if (path === "/auth/v1/user") body = user;
    else if (path === "/rest/v1/staff_roles") body = [{ role: "events" }];
    else if (path === "/rest/v1/events") body = items;
    else if (path === "/rest/v1/rpc/save_event") {
      const p = route.request().postDataJSON();
      expect(p.p_title).toBe("Community evening");
      expect(p.p_status).toBe("published");
      items = [
        {
          id: "event-1",
          title: p.p_title,
          description: p.p_description,
          location: p.p_location,
          starts_at: p.p_starts_at,
          ends_at: p.p_ends_at,
          capacity: p.p_capacity,
          status: p.p_status,
        },
      ];
      body = "event-1";
    } else if (path === "/rest/v1/registrations")
      body = [
        {
          id: "registration-1",
          event_id: "event-1",
          user_id: "member-1",
          status: "confirmed",
          created_at: new Date().toISOString(),
        },
      ];
    else throw new Error(`Unexpected test request ${path}`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    });
  });
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("staff@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create an event" }),
  ).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("Community evening");
  await page.getByLabel("Starts").fill("2027-06-01T18:00");
  await page.getByLabel("Ends").fill("2027-06-01T20:00");
  await page.getByLabel("Visibility").selectOption("published");
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(
    page.getByRole("heading", { name: "Community evening", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View registrations" }).click();
  await expect(
    page.getByRole("cell", { name: "member-1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "1 confirmed. Member linking and contact details are deferred.",
    ),
  ).toBeVisible();
});

test("exported mobile web shell supports guest navigation", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3200");
  await expect(page.getByText("A place to belong.")).toBeVisible();
  await page.getByRole("tab", { name: "Events", exact: true }).click();
  await expect(page.getByText("No upcoming events available.")).toBeVisible();
  await page.getByRole("tab", { name: "Give", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Official ways to give" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "More", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
});
