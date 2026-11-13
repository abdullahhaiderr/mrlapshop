# Mr LapShop — Vercel and mrlapshop.pk Deployment Guide

This project is a Next.js 16 application. Deploy it through a Git repository connected to Vercel so every future push can create a preview or production deployment.

## 1. Prepare the project folder

1. Download and extract `Mr-LapShop-Final-2.0-Transparent-Header.zip`.
2. Open the inner `Mr-LapShop-Final-2.0` folder.
3. Confirm that `package.json`, `src`, `public`, `supabase`, and `.nvmrc` are directly inside the folder. Do not upload the outer ZIP wrapper as a nested directory.
4. Keep `.env.local` out of Git. It is ignored by `.gitignore`. Never commit service-role keys, Resend API keys, or passwords.

## 2. Push the project to a private GitHub repository

Create a new **private** repository on GitHub, for example `mr-lapshop`. Then open PowerShell in the extracted project folder and run:

```powershell
git init
git add .
git commit -m "Prepare Mr LapShop for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/mr-lapshop.git
git push -u origin main
```

Replace `YOUR-GITHUB-USERNAME` with your GitHub username. If Git asks you to authenticate, complete GitHub's browser sign-in flow. If the folder is already a Git repository, do not run `git init` again; inspect `git status` and update its existing remote instead.

## 3. Import the repository into Vercel

1. Sign in at https://vercel.com/ using the GitHub account that owns the private repository.
2. Choose **Add New → Project** and import `mr-lapshop`.
3. Vercel should detect **Next.js** automatically.
4. Root Directory: `./` when the repository contains the project files directly (the `package.json` must be at repository root).
5. Leave the normal Next.js build and output defaults in place. The package build script is `next build`.
6. The repository pins Node through `.nvmrc` (`22.16.0`) and declares Node `>=20.9.0`.
7. Before deploying, configure the environment variables in the next section. You may deploy a preview first, verify it, then promote the intended `main` branch deployment to Production.

Vercel's Git integration creates deployments from repository pushes. Use Preview deployments to test before assigning the production domain.

## 4. Add Vercel environment variables

In Vercel, open **Project → Settings → Environment Variables**. Add these variables. Select Production and Preview for the applicable values; add Development too only if you plan to use `vercel dev`.

| Variable | Value / source | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://mrlapshop.pk` in Production | No |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tgoqtjyobpkopwqwqeft.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings / API Keys → publishable key | No; browser key, protected by RLS |
| `ORDER_NOTIFICATION_EMAIL` | `mrlapshop@gmail.com` | No |
| `RESEND_API_KEY` | The API key generated in your Resend account | **Yes** |
| `RESEND_FROM_EMAIL` | For example `Mr LapShop <orders@send.mrlapshop.pk>` after verifying that sending subdomain in Resend | No |

Important:
- Do not add a Supabase `service_role` or secret key to any `NEXT_PUBLIC_` variable. This application does not need a service-role key in the browser.
- Do not paste `.env.local` into GitHub. Add values directly in Vercel's Environment Variables screen.
- Do not invent a sender address before Resend verifies the sending domain. Use the exact verified sender/domain allowed by your Resend account.
- After changing environment variables, create a new deployment. Environment variable edits do not modify an already-built deployment.

## 5. Add the custom domain in Vercel

Do this after the first successful Preview/Production deployment:

1. Open the Vercel project → **Settings → Domains** (or the project's Domains section).
2. Add `mrlapshop.pk`.
3. Add `www.mrlapshop.pk` as well.
4. Set `mrlapshop.pk` as the primary domain and configure `www.mrlapshop.pk` to redirect to it (or use the canonical choice you prefer, but use only one canonical host).
5. Vercel will show the DNS records required for this specific project. Keep this Vercel screen open while editing DNS. In **Settings → Functions**, consider setting the Function Region to **Seoul (`icn1`)**, which is the region nearest the Supabase PostgreSQL project (Seoul). This keeps server-side database requests close to the database; static assets are still served through Vercel’s global CDN.

## 6. Change DNS where you purchased mrlapshop.pk

Sign in to the registrar or DNS provider where you purchased the domain and open its DNS / Zone Management page. Add the exact records Vercel shows for the two domains.

Common Vercel defaults for many projects are:

| Host / Name | Type | Common value |
|---|---|---|
| `@` | A | `76.76.21.21` |
| `www` | CNAME | `cname.vercel-dns-0.com` |

**Do not assume these generic values override the per-project records shown in Vercel. Use the exact values Vercel displays for `mrlapshop.pk`.** Vercel can show a different target for a project or account.

DNS safety:
- Remove or replace only conflicting web records for `@` or `www` when Vercel tells you to. If there is an existing website on the domain, changing these records moves web traffic to Vercel.
- Do not delete email-related MX, SPF, DKIM, or DMARC records just to connect the website. Those records may keep existing email working.
- Do not change nameservers unless you deliberately want to move all DNS hosting to Vercel. You can usually keep the existing DNS provider and add the Vercel A/CNAME records there.
- Save the DNS records, return to Vercel Domains and use its verification status. DNS propagation can take time. Vercel automatically provisions SSL/TLS once the domain is correctly configured.

## 7. Update Supabase Auth URL settings

In the Supabase Dashboard for project `tgoqtjyobpkopwqwqeft`, open **Authentication → URL Configuration**.

Set the **Site URL** to:

```text
https://mrlapshop.pk
```

Add these Redirect URLs:

```text
https://mrlapshop.pk/**
https://www.mrlapshop.pk/**
http://localhost:3000/**
```

If you will use Vercel Preview deployments for authentication testing, also add the narrow wildcard pattern Vercel recommends for your actual team/account slug (for example `https://*-YOUR-VERCEL-SLUG.vercel.app/**`). Replace the placeholder with your Vercel slug; do not add a broad wildcard that permits arbitrary domains.

The Site URL is important for email confirmation and password-reset links. Test sign-up, email confirmation, sign-in, sign-out, password reset and guest checkout on the production domain after DNS is active.

## 8. Configure order email notifications with Resend

The order action already sends an email to `mrlapshop@gmail.com` when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured. Orders are saved in Supabase independently; if email is not configured or the provider rejects the message, the saved order request remains in the database and the server logs the notification failure.

Recommended sender setup:

1. Create/sign in to a Resend account at https://resend.com/.
2. Add a sending subdomain such as `send.mrlapshop.pk` in Resend. A sending subdomain helps keep application-mail DNS separate from any existing email service on the root domain.
3. Resend will generate the exact DNS records for domain verification and sending (such as DKIM and SPF, and any additional record it currently requires). Copy those records exactly into the DNS manager where `mrlapshop.pk` is hosted.
4. Do not overwrite existing root-domain MX/SPF records. Use the subdomain and record names Resend supplies. Do not guess DNS record values.
5. Return to Resend and verify the domain. Use a sender such as `Mr LapShop <orders@send.mrlapshop.pk>` only after that sender domain is verified.
6. Create an API key in Resend and add it as `RESEND_API_KEY` in Vercel. Set `RESEND_FROM_EMAIL` to the verified sender. Keep `ORDER_NOTIFICATION_EMAIL=mrlapshop@gmail.com`.
7. Redeploy, then submit a controlled test order request using a test product and verify the email arrives in the Gmail inbox (also inspect Spam/Promotions).

Supabase Auth emails are separate from the order-notification email sent by this app. For reliable customer verification and password-reset emails, configure a proper SMTP provider in **Supabase → Authentication → SMTP Settings** and test those flows separately.

## 9. Production smoke-test checklist

Before announcing the store publicly, test all of the following on the Vercel Preview URL and again on the production domain:

- Homepage hero: header is fully transparent at the top; after scrolling, it changes to the existing smoky-glass treatment. Test desktop and mobile.
- Header links, dropdown menu, mobile menu, search, cart and wishlist.
- Shop listing, product details, filters, product images and product availability.
- Latest Arrivals carousel: continuous right-to-left loop, pause on hover/focus, reduced-motion behaviour.
- Beast Collection: appears only for owner-selected, published, in-stock products.
- Customer sign-up, verification, login, account and saved address flows.
- Guest order-request submission and signed-in customer order-request submission.
- Order request is saved in Supabase with payment pending; customer sees that it is a request, not a confirmed order.
- No order can be confirmed or processed before the owner records 100% payment as paid; a delivery order also needs the delivery charge quoted first.
- New order notification reaches `mrlapshop@gmail.com` after Resend is verified and configured.
- Owner dashboard is inaccessible to non-owner users.
- Guest order tracking requires the unguessable tracking token cookie.
- Terms, privacy, contact details and store hours are correct.

Do not run a real customer order until there is at least one product with a verified title, price, condition, photograph and stock quantity. The live database was empty at the time this guide was prepared, so add real inventory before checkout tests.

## 10. Production release

Once Preview QA passes:

1. Ensure the tested changes are committed to the GitHub `main` branch.
2. Confirm the resulting Vercel Production deployment has all Production environment variables.
3. Confirm both domain entries show valid configuration and SSL/TLS.
4. Confirm Supabase Site URL and Redirect URLs use the production domain.
5. Confirm Resend reports the sender domain as verified and the order-notification test email arrived.
6. In Vercel, assign `mrlapshop.pk` to the Production environment and verify the canonical redirect from `www`.
7. Monitor Vercel runtime logs and Supabase Auth/database logs during the first real orders.

## Official references

- Vercel Git deployments: https://vercel.com/docs/git
- Vercel custom domains: https://vercel.com/docs/domains/set-up-custom-domain
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel Function regions: https://vercel.com/docs/regions
- Supabase Auth redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Auth general configuration / SMTP: https://supabase.com/docs/guides/auth/general-configuration
- Resend: https://resend.com/docs
