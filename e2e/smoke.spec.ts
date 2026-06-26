import { test, expect } from "@playwright/test";

test.describe("Shorty smoke tests", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Shorty/i);
    await expect(page.getByRole("link", { name: /browse|sign in|get started/i }).first()).toBeVisible();
  });

  test("guest catalog preview API responds", async ({ request }) => {
    const res = await request.get("/api/catalog/preview");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.filmCount).toBe("number");
  });

  test("health endpoint responds", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.ok()).toBeTruthy();
  });

  test("search suggestions API responds", async ({ request }) => {
    const res = await request.get("/api/search/suggestions");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.films)).toBeTruthy();
  });

  test("offline page loads", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByText(/offline/i)).toBeVisible();
  });

  test("404 page loads", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });

  test("browse page loads for guests", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("body")).toBeVisible();
  });

  test("subscription page loads", async ({ page }) => {
    await page.goto("/subscription");
    await expect(page.getByText(/plan|subscribe|basic/i).first()).toBeVisible();
  });

  test("login and browse films", async ({ page }) => {
    test.skip(
      process.env.ENABLE_TEST_LOGIN !== "true",
      "Requires ENABLE_TEST_LOGIN=true and running dev server with demo user"
    );

    await page.goto("/demo?next=/browse");
    await page.waitForURL(/\/browse/, { timeout: 30_000 });
    await expect(page.locator("#main-content, main").first()).toBeVisible({ timeout: 15_000 });
  });
});
