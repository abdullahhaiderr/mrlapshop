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
  await expect(page.getByText(/sample macbook air/i)).toBeVisible();
});

test("the wishlist stores a selected product in the browser", async ({ page }) => {
  await page.goto("/product/sample-dell-latitude");
  await page.getByRole("button", { name: /save to wishlist/i }).click();
  await page.getByRole("link", { name: /wishlist, 1 saved/i }).click();
  await expect(page.getByRole("heading", { name: /your wishlist/i })).toBeVisible();
  await expect(page.getByText(/latitude laptop/i).first()).toBeVisible();
});


test("the cart is separate from the WhatsApp enquiry list", async ({ page }) => {
  await page.goto("/product/sample-macbook-air");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("link", { name: /shopping cart, 1 product types/i }).click();
  await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();
  await expect(page.getByText(/price and current stock have not been entered/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /continue to checkout/i })).toBeVisible();
});

test("customer registration and owner sign-in routes are separate", async ({ page }) => {
  await page.goto("/account/register");
  await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: /owner sign in/i })).toBeVisible();
});


test("checkout page is available to guests but safely locked until real inventory and store settings exist", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: /checkout details/i })).toBeVisible();
  await expect(page.getByText(/guest checkout does not require registration/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /place order/i })).toBeDisabled();
  await expect(page.getByText(/checkout is not live yet/i)).toBeVisible();
});
