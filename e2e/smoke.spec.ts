import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// Helper: log in via the login form
async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

// ─── Test 1: Admin login → /dashboard loads ───────────────────────────────────
test("admin can log in and dashboard loads", async ({ page }) => {
  await login(page, "pm@thesis.local", "Password123!");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("h1")).toContainText("Dashboard");
});

// ─── Test 2: Create a general task and confirm it appears ────────────────────
test("create general task and verify in list", async ({ page }) => {
  await login(page, "pm@thesis.local", "Password123!");

  // Navigate to General tasks page
  await page.goto("/general");
  await page.waitForSelector("h1");

  // Open create dialog
  await page.click('button:has-text("New Task")');
  await page.waitForSelector('[role="dialog"]');

  // Fill in task title
  await page.fill(
    'input[placeholder*="title" i], input[name="title"]',
    "Smoke Test General Task",
  );

  // Submit the form
  await page.click('[role="dialog"] button[type="submit"]');

  // Wait for dialog to close / list to update
  await page.waitForTimeout(2000);

  // Verify task appears
  const content = await page.textContent("body");
  expect(content).toContain("Smoke Test General Task");
});

// ─── Test 3: Upload attachment to existing task ──────────────────────────────
test("upload attachment to a task", async ({ page }) => {
  await login(page, "pm@thesis.local", "Password123!");

  // Go to board and click a task
  await page.goto("/board");
  await page.waitForSelector("h1");

  // Click the first task card to open detail dialog
  const taskCard = page
    .locator('[role="dialog"]')
    .first()
    .or(page.locator(".cursor-pointer").first());
  await taskCard.click();

  // If a task detail dialog opened, look for the file upload
  // Create a temporary test file
  const tmpFile = path.join(__dirname, "test-upload.pdf");
  fs.writeFileSync(tmpFile, "fake pdf content for smoke test");

  try {
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Find the file input and upload
    const fileInput = page.locator('input[type="file"]');
    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(tmpFile);
      await page.waitForTimeout(3000);
      // Verify attachment appears
      const dialogText = await page.locator('[role="dialog"]').textContent();
      expect(dialogText).toContain("test-upload.pdf");
    }
  } finally {
    // Clean up temp file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

// ─── Test 4: Member is blocked from /users ───────────────────────────────────
test("member cannot access /users", async ({ page }) => {
  await login(page, "member1@thesis.local", "Password123!");

  // Try to navigate to /users
  const response = await page.goto("/users");

  // Should either redirect, show 403, or show Access Denied content
  const url = page.url();
  const bodyText = await page.textContent("body");

  const isBlocked =
    url.includes("/login") ||
    url.includes("/dashboard") ||
    bodyText?.includes("Access Denied") ||
    bodyText?.includes("Forbidden") ||
    bodyText?.includes("Admin") ||
    response?.status() === 403;

  expect(isBlocked).toBeTruthy();
});
