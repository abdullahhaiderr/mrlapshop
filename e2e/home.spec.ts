import { expect, test } from "@playwright/test";

test("homepage shows the Mr LapShop storefront", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /find the right tech/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore the catalogue/i }).first()).toBeVisible();
});

test("a sample product opens its detail page", async ({ page }) => {
  await page.goto("/product/sample-macbook-air");
  await expect(page.getByRole("heading", { name: /macbook air/i })).toBeVisible();
  await expect(page.getByText(/sample listing/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /add to enquiry/i })).toBeVisible();
});

test("the enquiry list stores a selected product in the browser", async ({ page }) => {
  await page.goto("/product/sample-macbook-air");
  await page.getByRole("button", { name: /add to enquiry/i }).click();
  await page.getByRole("link", { name: /enquiry list, 1 selected/i }).click();
  await expect(page.getByRole("heading", { name: /enquiry list/i })).toBeVisible();
  await expect(page.getByText(/macbook air/i).first()).toBeVisible();
});

test("the wishlist stores a selected product in the browser", async ({ page }) => {
  await page.goto("/product/sample-dell-latitude");
  await page.getByRole("button", { name: /save to wishlist/i }).click();
  await page.getByRole("link", { name: /wishlist, 1 saved/i }).click();
  await expect(page.getByRole("heading", { name: /your wishlist/i })).toBeVisible();
  await expect(page.getByText(/latitude laptop/i).first()).toBeVisible();
});


test("sample listings stay in the enquiry flow and do not enter the purchase cart", async ({ page }) => {
  await page.goto("/product/sample-macbook-air");
  await expect(page.getByRole("button", { name: /add to enquiry list/i })).toBeEnabled();
  await page.getByRole("button", { name: /add to enquiry list/i }).click();
  await expect(page.getByRole("link", { name: /enquiry list, 1 selected/i })).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /your cart is waiting/i })).toBeVisible();
  await expect(page.getByText(/explore the catalogue and add products/i)).toBeVisible();
});

test("customer registration and owner sign-in routes are separate", async ({ page }) => {
  await page.goto("/account/register");
  await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: /owner sign in/i })).toBeVisible();
});


test("checkout is available to guests but safely locked until real inventory and store settings exist", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: /send an order request/i })).toBeVisible();
  await expect(page.getByText(/you can also submit this request as a guest/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /submit order request/i })).toBeDisabled();
  await expect(page.getByText(/order request unavailable/i)).toBeVisible();
});


test("Shop mega menu keeps the intro and catalogue columns separate", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: /^shop$/i }).hover();
  const menu = page.locator(".mega-menu-expanded");
  await expect(menu).toBeVisible();
  const intro = await menu.locator(".mega-menu-intro").boundingBox();
  const catalogue = await menu.locator(".mega-menu-catalog").boundingBox();
  expect(intro).not.toBeNull();
  expect(catalogue).not.toBeNull();
  expect(intro!.x + intro!.width).toBeLessThanOrEqual(catalogue!.x + 2);
});

test("customer YouTube testimonials play in a same-page modal", async ({ page }) => {
  await page.goto("/");
  const marquee = page.locator(".customer-video-marquee");
  await marquee.hover(); // Pause the continuous track so the target card stays stationary for the click.
  const videoButton = marquee.getByRole("button", { name: /play customer video 01/i }).first();
  await expect(videoButton).toBeVisible();
  await videoButton.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\//);
  await expect(page).toHaveURL(/\/$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("robots.txt advertises the official Mr LapShop sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBeTruthy();
  const robots = await response.text();
  expect(robots).toContain("Sitemap: https://mrlapshop.pk/sitemap.xml");
});
