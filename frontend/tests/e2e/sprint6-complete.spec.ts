/**
 * E2E Tests - Sprint 6 Complete
 *
 * Tests for:
 * - I2: Offline sync
 * - I3: Accessibility features
 * - Analytics dashboard
 * - G5: SCIENTIFIC mode
 * 
 * Authentication is handled via global-setup.ts and storageState
 * Refresh token is mocked via fixtures.ts
 */

import { test, expect } from "./fixtures";
import { loginAsStudent, loginAsTeacher } from "./helpers/auth";
import { forceTextSelection } from "./helpers/text-selection";
import { AccessibilityPage } from "./pages/AccessibilityPage";
import { ScientificReaderPage } from "./pages/ScientificReaderPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

test.beforeEach(async ({ page }) => {
  // Clear cookies only - localStorage will be cleared after navigation
  await page.context().clearCookies();

  // Enable browser console logging
  page.on('console', msg => console.log('Browser:', msg.text()));

  // Mock Auth
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        access_token: "fake-jwt",
        user: { id: "user-1", email: "test@example.com" },
      }),
    });
  });

  // Mock Content - Generic test article
  await page.route("**/api/v1/contents/test-article", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: "test-article",
        title: "Test Article",
        contentType: "PDF",
        contentMode: "NARRATIVE",
        text: "This is a test article with important paragraph and some test content.",
      }),
    });
  });

  // Mock Content - Scientific article
  await page.route("**/api/v1/contents/scientific-article*", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: "scientific-article",
        title: "Scientific Research",
        contentType: "ARTICLE",
        contentMode: "SCIENTIFIC",
        text: "Abstract\nAbstract content goes here.\n\nIntroduction\nThe mitochondria is the powerhouse of the cell. Photosynthesis is the process by which plants convert light energy. The enzyme catalyzes the reaction.\n\nMethods\nMethods content and results.",
      }),
    });
  });

  // Mock Content Mode
  await page.route("**/api/v1/content-mode/*", async (route) => {
    const url = route.request().url();
    const mode = url.includes("scientific-article")
      ? "SCIENTIFIC"
      : "NARRATIVE";
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        mode: mode,
        effectiveMode: mode,
        source: "USER",
      }),
    });
  });

  // Mock Unified Stream
  await page.route("**/api/v1/contents/*/cornell", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: "cornell-1",
        contentId: "scientific-article",
        summary_text: "Summary",
        notes_json: [],
        cues_json: [],
      }),
    });
  });

  await page.route("**/api/v1/contents/*/highlights", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
    });
  });

  // Mock Glossary
  await page.route("**/api/v1/glossary/define*", async (route) => {
    const url = new URL(route.request().url());
    const term = url.searchParams.get("term");
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        term: term,
        definition: `Definition of ${term}`,
        source: "Webster",
      }),
    });
  });

  // Mock Analytics
  await page.route("**/api/v1/analytics/stats*", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        activeUsers: 1250,
        contentsRead: 4500,
        completionRate: 75,
        avgTime: 12,
        modeUsage: {
          NARRATIVE: 400,
          SCIENTIFIC: 150,
          DIDACTIC: 300,
        },
        confusionHeatmap: [
          { sectionId: "abstract", count: 2 },
          { sectionId: "methods", count: 12 },
          { sectionId: "results", count: 5 },
          { sectionId: "discussion", count: 8 },
        ],
      }),
    });
  });

  await page.goto("/");
});

test.describe("Sprint 6: Offline & Accessibility", () => {
  // Mock API routes to prevent backend dependency for UI tests
  test.beforeEach(async ({ page }) => {
    // Mock Content Mode API
    await page.route(/.*\/api\/v1\/cornell\/contents\/.*\/mode/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'NARRATIVE',
          modeSource: 'DEFAULT',
          inferredMode: 'NARRATIVE'
        })
      });
    });

    // Mock Telemetry
    await page.route(/.*\/api\/v1\/telemetry\/track/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Mock Entitlements
    await page.route(/.*\/api\/v1\/users\/me\/entitlements/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ entitlements: [] }) });
    });

    await page.route(/.*\/api\/v1\/classrooms\/mine/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route(/.*\/api\/v1\/families/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Content specific
    await page.route(/.*\/api\/v1\/contents\/.*\/progress/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ progress: 0 }) });
    });

    await page.route(/.*\/api\/v1\/contents\/.*\/bookmarks/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ isBookmarked: false }) });
    });

    await page.route(/.*\/api\/v1\/cornell\/contents\/.*\/context/, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ context: {} }) });
    });
    
    // Mock POST highlights for sync
    await page.route(/.*\/api\/v1\/cornell\/contents\/.*\/highlights/, async route => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 201, body: JSON.stringify({ id: 'new-highlight' }) });
        } else {
            await route.continue();
        }
    });
  });

  test("I2.1: Should save annotation offline when network is down", async ({
    page,
    context,
  }) => {
    // Navigate to test page with real UI
    await page.goto("/reader/e2e-test");
    await page.waitForLoadState("networkidle");

    // Wait for content to be ready
    await page.waitForSelector('[data-testid="test-content"]', { timeout: 10000 });

    // Go offline
    await context.setOffline(true);

    // Select text to trigger TextSelectionMenu
    await forceTextSelection(page, '[data-testid="test-content"] p', 0, 30);
    
    // Wait for TextSelectionMenu
    const menu = page.getByRole('dialog', { name: 'Menu de seleção de texto' });
    await expect(menu).toBeVisible({ timeout: 5000 });

    // Click "Evidência" button
    await page.getByRole('button', { name: /evidência/i }).click();
    
    // Wait a moment for the annotation to be created
    await page.waitForTimeout(500);

    // FIRST: Ensure sidebar is open (it should be by default on desktop)
    // On mobile it might be closed, so we check and open if needed
    const sidebar = page.locator('aside').first();
    const sidebarVisible = await sidebar.isVisible();
    if (!sidebarVisible) {
      // Click to open sidebar if it's closed
      await page.locator('button[title*="sidebar"]').first().click();
    }

    // Switch to Annotations tab using testId for reliability
    await page.getByTestId('tab-stream').click();
    
    // Verify annotation card appears in sidebar with the selected text
    // Using data-testid for robust selection
    const annotationCard = page.getByTestId('annotation-card');
    await expect(annotationCard).toBeVisible({ timeout: 5000 });
    await expect(annotationCard).toContainText('important paragraph');

    // THEN: Verify offline indicator and pending count
    await expect(page.locator('text=/offline/i')).toBeVisible();
    await expect(page.locator('text=pendente')).toBeVisible({ timeout: 5000 });
  });

  test("I2.2: Should auto-sync when coming back online", async ({
    page,
    context,
  }) => {
    // Navigate
    await page.goto("/reader/e2e-test");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('[data-testid="test-content"]', { timeout: 10000 });

    // Go offline
    await context.setOffline(true);

    // Create annotation
    await forceTextSelection(page, '[data-testid="test-content"] p', 0, 30);
    const menu = page.getByRole('dialog', { name: 'Menu de seleção de texto' });
    await expect(menu).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /evidência/i }).click();

    // Verify pending count
    await expect(page.locator('text=/pendente/i')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Verify pending count disappears (meaning synced)
    await expect(page.locator('text=/pendente/i')).toBeHidden({ timeout: 10000 });
    
    // Verify online indicator or connected status
    // Note: Depends on logic, but pending hidden is strong signal of sync attempt
  });


  test("I3.1: Should adjust font size with controls", async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto();

    // Get initial font size
    const initialSize = await accessibilityPage.getFontSize();

    // Increase font size
    await accessibilityPage.setFontSize(20);

    // Verify font size changed
    const newSize = await accessibilityPage.getFontSize();
    expect(newSize).toBe("20px");
    expect(newSize).not.toBe(initialSize);
  });

  test("I3.1: Should adjust font size with keyboard shortcuts", async ({
    page,
  }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto();

    // Get initial size
    const initialSize = await accessibilityPage.getFontSize();

    // Increase with Ctrl+
    await accessibilityPage.increaseFontSizeWithKeyboard();

    // Verify size increased
    const increasedSize = await accessibilityPage.getFontSize();
    expect(parseInt(increasedSize)).toBeGreaterThan(parseInt(initialSize));

    // Decrease with Ctrl-
    await accessibilityPage.decreaseFontSizeWithKeyboard();

    // Verify size decreased
    const decreasedSize = await accessibilityPage.getFontSize();
    expect(parseInt(decreasedSize)).toBeLessThan(parseInt(increasedSize));
  });

  test("I3.2: Should toggle contrast modes", async ({ page }) => {
    const accessibilityPage = new AccessibilityPage(page);
    await accessibilityPage.goto();

    // Test high contrast
    await accessibilityPage.setContrast('high');
    const highContrast = await accessibilityPage.getContrastMode();
    expect(highContrast).toBe('high');

    // Test normal contrast
    await accessibilityPage.setContrast('normal');
    const normalContrast = await accessibilityPage.getContrastMode();
    expect(normalContrast).toBe('normal');
  });

  test("I3.3: Should enable focus mode", async ({ page }) => {
    await page.goto("/settings/accessibility");

    // Enable focus mode - use button with id
    await page.locator("#focus-mode-toggle").click();

    // Verify focus mode applied
    const focusMode = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-focus-mode");
    });
    expect(focusMode).toBe("true");

    // Verify toast notification
    await expect(page.getByText(/modo foco ativado/i)).toBeVisible();
  });

  test("I3.3: Should enable reduced motion", async ({ page }) => {
    await page.goto("/settings/accessibility");

    // Enable reduced motion - use button with id
    await page.locator("#reduced-motion-toggle").click();

    // Verify animation duration set to 0
    const animDuration = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        "--animation-duration"
      );
    });
    expect(animDuration).toBe("0ms");
  });

  test("Should persist accessibility settings", async ({ page }) => {
    await page.goto("/settings/accessibility");

    // Change settings
    await page.getByLabel("Tamanho da fonte").fill("18");
    await page.getByRole("radio", { name: /alto/i }).click();
    await page.getByRole("switch", { name: /modo foco/i }).click();

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify settings persisted
    const fontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        "--base-font-size"
      );
    });
    expect(fontSize).toBe("18px");

    const contrast = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-contrast");
    });
    expect(contrast).toBe("high");

    const focusMode = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-focus-mode");
    });
    expect(focusMode).toBe("true");
  });
});

test.describe("Sprint 6: Analytics Dashboard", () => {
  test("Should display analytics dashboard with KPIs", async ({ page }) => {
    await page.goto("/analytics");

    // Verify KPI cards
    await expect(page.getByText("Usuários Ativos")).toBeVisible();
    await expect(page.getByText("Conteúdos Lidos")).toBeVisible();
    await expect(page.getByText("Taxa de Conclusão")).toBeVisible();
    await expect(page.getByText("Tempo Médio")).toBeVisible();

    // Verify charts
    await expect(page.getByText("Uso por Modo")).toBeVisible();
    await expect(page.getByText("Heatmap de Confusão")).toBeVisible();
  });

  test("Should filter analytics by date range", async ({ page }) => {
    await page.goto("/analytics");

    // Change to 7 days
    await page.getByRole("button", { name: "7 dias" }).click();
    await page.waitForLoadState("networkidle");

    // Verify data updated
    await expect(page.getByText("Usuários Ativos")).toBeVisible();

    // Change to 90 days
    await page.getByRole("button", { name: "90 dias" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Usuários Ativos")).toBeVisible();
  });

  test("Should export analytics to CSV", async ({ page }) => {
    await page.goto("/analytics");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("analytics-export.csv");
  });

  test("Should display confusion heatmap with color coding", async ({
    page,
  }) => {
    await page.goto("/analytics");
    await expect(page.getByText("Heatmap de Confusão")).toBeVisible();
    const heatmapItems = page.locator(
      '[class*="bg-red-"], [class*="bg-yellow-"], [class*="bg-green-"]'
    );
    await expect(heatmapItems.first()).toBeVisible();
  });
});

test.describe("Sprint 6: SCIENTIFIC Mode Features", () => {
  test("G5.3: Should display glossary popover on term click", async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.goto("/reader/scientific-article?mode=SCIENTIFIC");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=mitochondria", { timeout: 10000 });
    await page.getByText("mitochondria").click();
    await expect(
      page.getByRole("heading", { name: "mitochondria" })
    ).toBeVisible();
    await expect(page.getByText(/fonte:/i)).toBeVisible();
  });

  test("G5.3: Should show loading state while fetching definition", async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.goto("/reader/scientific-article?mode=SCIENTIFIC");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=photosynthesis", { timeout: 10000 });
    await page.getByText("photosynthesis").click();
    await expect(page.locator(".animate-pulse")).toBeVisible();
    await expect(page.getByText(/fonte:/i)).toBeVisible({ timeout: 5000 });
  });

  test("G5.3: Should close glossary popover", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/reader/scientific-article?mode=SCIENTIFIC");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=enzyme", { timeout: 10000 });
    await page.getByText("enzyme").click();
    await expect(page.getByRole("heading", { name: "enzyme" })).toBeVisible();
    await page.getByLabel("Fechar").click();
    await expect(
      page.getByRole("heading", { name: "enzyme" })
    ).not.toBeVisible();
  });

  test("G5.4: Should filter annotations by IMRaD section", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/reader/scientific-article?mode=SCIENTIFIC");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=Abstract", { timeout: 10000 });

    await page.getByText("Abstract content").click();
    await page.getByRole("button", { name: "Add Note" }).click();
    await page.getByPlaceholder("Add your note").fill("Abstract note");
    await page.getByRole("button", { name: "Save" }).click();

    await page.getByText("Methods content").click();
    await page.getByRole("button", { name: "Add Note" }).click();
    await page.getByPlaceholder("Add your note").fill("Methods note");
    await page.getByRole("button", { name: "Save" }).click();

    await page.getByRole("button", { name: /annotations/i }).click();

    await expect(page.getByText("Abstract note")).toBeVisible();
    await expect(page.getByText("Methods note")).toBeVisible();

    await page.getByRole("button", { name: /abstract/i }).click();
    await expect(page.getByText("Abstract note")).toBeVisible();
    await expect(page.getByText("Methods note")).not.toBeVisible();

    await page.getByRole("button", { name: /methods/i }).click();
    await expect(page.getByText("Methods note")).toBeVisible();
    await expect(page.getByText("Abstract note")).not.toBeVisible();
  });

  test("G5.4: Should show annotation count per section", async ({ page }) => {
    await page.goto("/reader/scientific-article?mode=SCIENTIFIC");
    await page.getByRole("button", { name: /annotations/i }).click();
    await expect(page.getByText(/abstract/i)).toBeVisible();
    await expect(page.getByText(/\d+/)).toBeVisible();
  });
});

test.describe("Sprint 6: Integration Tests", () => {
  test("Should work offline with accessibility settings", async ({
    page,
    context,
  }) => {
    await page.goto("/settings/accessibility");
    await page.getByLabel("Tamanho da fonte").fill("20");
    await page.getByRole("switch", { name: /modo foco/i }).click();

    await context.setOffline(true);
    await page.goto("/reader/test-article");

    const fontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        "--base-font-size"
      );
    });
    expect(fontSize).toBe("20px");
  });

  test("Should sync offline annotations after accessibility changes", async ({
    page,
    context,
  }) => {
    await context.setOffline(true);
    await page.goto("/reader/test-article");
    await page.getByText("test").first().click();
    await page.getByRole("button", { name: "Add Note" }).click();
    await page.getByPlaceholder("Add your note").fill("Offline note");
    await page.getByRole("button", { name: "Save" }).click();

    await page.goto("/settings/accessibility");
    await page.getByLabel("Tamanho da fonte").fill("18");

    await context.setOffline(false);
    await expect(page.getByText(/sincronizado/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
