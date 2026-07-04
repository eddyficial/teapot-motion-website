import { expect, test } from "@playwright/test";

async function canvasHasVisiblePixels(page: import("@playwright/test").Page) {
  return page.locator("#teapot-canvas").evaluate((canvas) => {
    const target = canvas as HTMLCanvasElement;
    return new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const probe = document.createElement("canvas");
        const width = 320;
        const height = 220;
        probe.width = width;
        probe.height = height;
        const context = probe.getContext("2d");
        if (!context) {
          resolve(false);
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        let brightPixels = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          const brightness = pixels[index] + pixels[index + 1] + pixels[index + 2];
          if (pixels[index + 3] > 12 && brightness > 90) brightPixels += 1;
        }
        resolve(brightPixels > 700);
      };
      image.onerror = () => resolve(false);
      image.src = target.toDataURL("image/png");
    });
  });
}

test("desktop teapot scene loads with nonblank canvas", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Teapot Motion" })).toBeVisible();
  await expect(page.getByTestId("mode-readout")).toContainText(/idle|still/);
  await expect(page.locator("#teapot-canvas")).toBeVisible();
  await expect.poll(() => canvasHasVisiblePixels(page), { timeout: 5_000 }).toBe(true);
  await page.screenshot({
    path: `test-results/teapot-${testInfo.project.name}-scene.png`,
    fullPage: true,
  });
});

test("controls change scene state and stay keyboard accessible", async ({ page }) => {
  await page.goto("/");
  const pour = page.getByTestId("pour-button");
  const steam = page.getByTestId("steam-button");
  const still = page.getByTestId("still-button");
  await expect(pour).toBeVisible();

  await pour.click();
  await expect(page.getByTestId("mode-readout")).toHaveText("pouring");

  await steam.click();
  await expect(page.getByTestId("mode-readout")).toHaveText("steam");

  await still.click();
  await expect(page.getByTestId("mode-readout")).toHaveText("still");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("mode-readout")).toContainText(/pouring|steam|still/);
});

test("mobile layout avoids horizontal scrolling and keeps controls visible", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#teapot-canvas")).toBeVisible();
  await expect(page.getByTestId("pour-button")).toBeVisible();
  await expect(page.getByTestId("steam-button")).toBeVisible();
  await expect(page.getByTestId("still-button")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({
    path: `test-results/teapot-${testInfo.project.name}-layout.png`,
    fullPage: true,
  });
});

test("reduced motion keeps a usable still teapot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "reduced-motion", "Reduced-motion behavior is covered in the reduced-motion project.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("mode-readout")).toHaveText("still");
  await expect(page.locator("#teapot-canvas")).toBeVisible();
  await page.getByTestId("pour-button").click();
  await expect(page.getByTestId("mode-readout")).toHaveText("pouring");
});

test("fallback state disables controls when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    type LooseCanvasContext = (contextId: string, options?: unknown) => RenderingContext | null;
    const originalGetContext = HTMLCanvasElement.prototype.getContext as LooseCanvasContext;
    const prototype = HTMLCanvasElement.prototype as unknown as {
      getContext: LooseCanvasContext;
    };

    prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      contextId: string,
      options?: unknown,
    ) {
      if (String(contextId).startsWith("webgl")) return null;
      return originalGetContext.call(this, contextId, options);
    };
  });

  await page.goto("/");
  await expect(page.getByTestId("mode-readout")).toHaveText("fallback");
  await expect(page.getByText("Static teapot shown")).toBeVisible();
  await expect(page.getByTestId("pour-button")).toBeDisabled();
  await expect(page.getByTestId("steam-button")).toBeDisabled();
  await expect(page.getByTestId("still-button")).toBeDisabled();
});
