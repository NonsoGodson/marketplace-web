# Marketplace Web — Step 1: Project shell, design system, auth

The frontend to go with the `marketplace-backend` API, built the same way — one increment at a time. This first increment is the scaffold everything else sits on: Next.js 14 (App Router) + TypeScript + Tailwind, the visual identity, and working login/register against the real backend.

## Design system

A quick word on the choices, since a marketplace this general could easily default to generic SaaS styling:

- **Colors**: `indigo` (#26305B) as the trustworthy primary, `marigold` (#E8A33D) as a commerce-warmth accent for CTAs, `jade` as a secondary accent, on a warm `paper` (#F5F3EC) background instead of pure white. Deliberately avoided the cream+terracotta combo that's become an AI-generated-page cliché.
- **Type**: Fraunces (a characterful serif with real personality) for display/headline text, Inter for UI and body copy — two clearly distinct roles rather than one safe sans-serif everywhere.
- **The one bold move**: a dark indigo brand panel on the auth screens (`AuthShell`) rather than a generic centered card on white — it's the first thing anyone sees, so it's where the personality lives. Everything else (forms, buttons) stays quiet and functional.
- I used **"Kadàrà"** (Yoruba for "destiny/fate") as a placeholder brand name so the design didn't have to fight a generic "Marketplace" label — swap this the moment you have a real name; it's only referenced in `AuthShell.tsx` and `Header.tsx`.

## What's implemented

- Next.js App Router project, Tailwind configured with the tokens above
- `src/lib/api-client.ts` — typed fetch wrapper against the backend; add a method per endpoint as each section gets built, same incremental approach as the backend itself
- `src/lib/auth-context.tsx` — login/register/logout, tokens persisted to `localStorage`, current user identity decoded from the JWT
- `/login` and `/register` pages, fully wired to the real `/auth/login` and `/auth/register` endpoints, with the buyer/seller choice the backend's registration restriction actually allows
- A minimal home page + auth-aware header, proving the whole chain works end to end

## A real gap, worth fixing on the backend soon

**The backend has no `GET /users/me` endpoint.** Login/register only return tokens, not a user object, so the frontend currently decodes the JWT to get `id`/`email`/`role` — `firstName`/`lastName` aren't in the token and aren't available anywhere yet. This is fine for now (nothing here needs the full name), but the seller dashboard, order history, and account settings screens all will. Worth adding a small `UsersController` with `GET /users/me` to the backend before those steps.

## Not yet implemented (deliberately out of scope this step)

- Token refresh on expiry (the `/auth/refresh` client method exists but nothing calls it yet — needs an interceptor in `api-client.ts`)
- Protected-route redirect (nothing stops a logged-out visitor from reaching a page that will need auth once one exists)
- The actual browse/search/product/service pages — the home page is just a shell

## Step 2: Browse & Search (added)

- **Token-refresh interceptor** — `api-client.ts`'s `request()` now retries once on a 401 after calling `/auth/refresh`, with in-flight de-duplication so concurrent requests don't race each other into revoking one another's rotated refresh token. Tokens now live in one shared module (`src/lib/token-store.ts`) instead of `auth-context.tsx` owning `localStorage` directly — `api-client.ts` needs to read/write them too for refresh to work.
- **Category nav** (`CategoryNav`) — server component, fetches the public category tree, renders as a horizontal pill row linking into `/products?categoryId=...`
- **`/products`** and **`/services`** — server-rendered search/listing pages reading `q`/`categoryId`/etc. straight from the URL's `searchParams`, so search is a real URL (shareable, back-button-friendly) rather than client-side-only state
- **`/products/[slug]`** and **`/services/[slug]`** — detail pages; both call `notFound()` on a real 404 from the backend rather than showing a broken page
- `ProductCard` / `ServiceCard` — shared presentational components for the grids
- Header now has Products/Services nav links

**Left as visible placeholders on purpose:** the "Add to cart" and "Book this service" buttons are disabled with a "coming next/soon" label rather than silently doing nothing — Cart & Checkout and Bookings are separate frontend steps.

**Worth knowing:** the search/listing/detail pages are Server Components fetching directly from the backend at request time (no client-side loading spinner needed, and it's better for a marketplace's SEO) — this is a deliberate difference from the auth pages, which have to be Client Components since they hold form state. `SearchBar` takes its initial value as a prop from the server-rendered page rather than reading `useSearchParams()` itself, specifically to avoid Next.js's Suspense-boundary requirement for that hook.

## Setup

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your running backend
npm run dev
```

## Step 3: Cart & Checkout (added)

- **`CartProvider`** (`src/lib/cart-context.tsx`) — loads the cart whenever someone's logged in, exposes `addItem`/`updateItem`/`removeItem`, and drives the item-count badge on the header's new cart icon
- **`AddToCartButton`** — the product detail page's real add-to-cart control now: variant picker, quantity, redirects to `/login` if you're not signed in rather than failing silently
- **`/cart`** — view/edit the cart, grouped by seller for clarity (the backend does the real per-seller split at checkout regardless of how it's displayed here), "Place order" calls `POST /orders/checkout`
- **`/orders`** and **`/orders/[id]`** — order history and a confirmation/detail page
- **`useRequireAuth`** — the protected-route helper flagged as missing in Step 1; `/cart`, `/orders`, and `/orders/[id]` all use it now to redirect a logged-out visitor to `/login` instead of erroring

**The honest part, worth reading before you demo this:** the backend's payment provider is still a stub (flagged back in the backend's Step 5) — there's no real Stripe integration, so this frontend doesn't show any payment UI either. An order lands in `PENDING_PAYMENT` and stays there. Rather than fake a "payment successful" screen, the order confirmation page says so directly and tells a developer how to simulate success locally (`POST` to the backend's `/payments/webhook` with the order's payment id). Building real payment UI (Stripe Elements or similar) only makes sense once the backend side is real — doing it now would mean throwing this away.

Run `npm install` isn't needed again (no new dependencies this step) — just pull the updated files in.

## Step 4: Seller onboarding & listing creation (added)

- **`/sell`** — onboarding form, handling all four backend states: not started (show form), `PENDING_REVIEW` (status message, no form), `REJECTED` (shows the admin's reason, form re-shown to resubmit), `ACTIVE` (redirects straight to the dashboard)
- **`/seller/dashboard`** — catalog counts, order/booking totals, available vs. pending earnings, links into product/service management. Sends a logged-in-but-not-onboarded seller back to `/sell` rather than showing a broken dashboard.
- **`/seller/products`** / **`/seller/products/new`** and **`/seller/services`** / **`/seller/services/new`** — create-as-draft forms and a management list with a publish/unpublish toggle. A `SUSPENDED` listing (set by an admin, per the backend's Trust & Safety step) shows no toggle at all — a seller shouldn't be able to self-reinstate something a moderator suspended.
- **Availability editor** on the services list — a lightweight weekly-slots form (`PATCH /services/:id/availability`), since a service with no availability configured can't meaningfully be booked once the booking UI exists
- Header gains a "Sell" link, routing a plain `BUYER` to onboarding and anyone already seller-capable straight to the dashboard
- `CategorySelect` — shared indented-dropdown component for both creation forms, flattening the backend's category tree

**Two things worth knowing:**
1. Publishing will fail with the backend's own error message ("Your store must be verified and active...") if you try before an admin approves the application — the publish toggle just surfaces that error, it doesn't try to route around it.
2. The product image field is a single raw URL, not a real upload — there's no file storage (S3 or similar) wired in anywhere yet, backend or frontend. Worth flagging as a real gap before this goes further: every image field across the whole app (product images, service images, store logo) is currently "paste a URL that already exists somewhere."

Run `npm install` isn't needed again — no new dependencies this step.

## Step 5: Service booking UI (added)

- **`BookingWidget`** on the service detail page — date picker + time-slot buttons computed from the service's weekly availability windows and duration, a notes field, and a confirm button that calls `POST /bookings`
- **`/bookings`** and **`/bookings/[id]`** — booking history and a confirmation/detail page, with a cancel action (buyers can cancel `PENDING`/`CONFIRMED` bookings, matching the backend's rule)
- Header gains "Orders" and "Bookings" links — an honest fix, not a new feature: `/orders` existed since Step 3 with no way to actually navigate to it

**Two real gaps worth reading, not glossed over:**
1. **Slots shown here aren't checked against existing bookings.** There's no public endpoint exposing which times are already taken for a service, so the widget only knows the *weekly availability pattern* — it can show a slot as pickable that someone else has already booked. The backend still enforces the real overlap check at submit time and rejects with a clear error if that happens, so nothing double-books silently — but the UI doesn't pre-filter for it. Fixing this properly needs either a public "available slots" endpoint on the backend or accepting the current pick-and-maybe-retry flow as good enough for MVP.
2. **`/bookings/[id]` fetches the full booking list and finds the one it needs**, because the backend has no `GET /bookings/:id` — only `POST /`, `GET /bookings/mine`, `GET /bookings/seller/mine`, and the status-update route. Functionally fine at low volume, but worth adding a real single-booking endpoint on the backend before this list gets long.

Run `npm install` isn't needed again — no new dependencies this step.

## Step 6: Reviews (added)

- **`ReviewsSection`** — shared component wired into both `/products/[slug]` and `/services/[slug]`: average rating + count, the review list (star rating, first name + last initial, a verified-purchase badge sourced straight from the backend's own check, date), and a submission form (star picker + optional comment) for anyone logged in
- Submitting a duplicate review surfaces the backend's own "You have already reviewed this" error rather than the frontend trying to pre-detect it
- No purchase is required to review — that matches the backend's actual design (verification is a badge on the review, not a gate on submitting one), so the form doesn't add a restriction the API doesn't have

**Worth flagging plainly:** the backend also supports **seller-level reviews** (`targetType: SELLER`, rated against a `storeId`), but there's nowhere to show them — there's still no store/seller profile page anywhere in this frontend (the "Sold by X" text on the product page has been plain text, not a link, since Step 2). Seller reviews are fully functional on the backend and have zero surface here until a store profile page exists to host them.

Run `npm install` isn't needed again — no new dependencies this step.

## Step 7: Messaging & seller profile pages (added)

This step needed two small **backend additions first** (delivered as `marketplace-backend-step11-public-store-profile.zip`): a public `GET /stores/:slug` endpoint, and a `storeId` filter on product/service search. Neither existed — there was no way to look up a store at all, which both a profile page and messaging (it needs a real `storeId`) depend on.

- **`/stores/[slug]`** — public seller profile: logo, description, country, their products and services, seller-level reviews, and a "Message seller" button. This finally gives the backend's seller-review feature (flagged in Step 6 as having no frontend surface) somewhere to live — `ReviewsSection` now handles `SELLER` targets too.
- "Sold by X" on product/service pages is now a real link to that profile instead of plain text
- **`/messages`** — inbox with two sections: your conversations as a buyer, and messages from buyers if you have a store
- **`/messages/[id]`** — the thread itself, with a send box. Polls every 10 seconds rather than using websockets, since the backend has no realtime channel — good enough for pre-purchase questions, worth revisiting if messaging becomes a heavier feature.
- Header gains a "Messages" link

**Two things worth knowing, not glossed over:**
1. **Blocking exists on the backend but has no button here** — the thread page correctly shows "this conversation has been blocked" and hides the send box if either side blocked it, but there's no UI to actually *block* someone yet. Same for reporting (backend Trust & Safety has it, no frontend).
2. Messages don't yet surface an **unread indicator** anywhere (the backend marks messages read when a thread is opened, but this frontend doesn't badge the header or inbox with unread counts) — a natural small follow-up.

Run `npm install` isn't needed again — no new dependencies this step.

## Step 8: Admin UI (added)

An `/admin` area, guarded to `ADMIN` and `SUPPORT_ADMIN` accounts, with a sidebar shell (`AdminShell`):

- **Overview** — the backend's analytics summary. A "needs attention" row up top (pending seller applications, open reports, open disputes, each linking to its queue and highlighted when non-zero), then marketplace and money figures.
- **Seller applications** — the review queue. Approve, or reject with a reason that's shown to the applicant. Approving is what actually activates a store and lets the seller publish.
- **Categories** — tree view, add a top-level category or a sub-category, activate/deactivate. **This one matters more than it looks:** sellers can't create any listing until at least one category exists, and until now nothing in the frontend could create one.
- **Users** — search and filter, suspend and reactivate. Suspend/reactivate controls only appear for `ADMIN`, not `SUPPORT_ADMIN` (the backend restricts them, so the button would just 403), and never on another admin's row.
- **Reports** — the queue, resolve or dismiss with required notes.
- **Disputes** — the queue, and the ruling controls: for the buyer (with an optional partial refund amount, blank means full), for the seller, or close without ruling. Ruling controls are `ADMIN`-only since a ruling can issue a refund.
- Header shows "Admin" instead of "Sell" for admin accounts. Before this, an admin's "Sell" link led to a seller dashboard they don't have.

**Getting your first admin:** there's no way to become one through the app, by design. Run `npm run seed:admin` in the backend (see its README) with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set, then log in normally.

**Things to know before you rely on this:**
1. **Ruling for the buyer will fail until payments are real.** A refund needs a payment that actually succeeded, and with the stubbed payment provider nothing ever reaches that state (unless someone simulates the webhook by hand). The page shows the backend's error and the dispute stays open, which is the correct behaviour, but you won't see a refund complete end to end yet.
2. **The role guard here is cosmetic.** It exists so a non-admin sees "no access" rather than a broken page. The real enforcement is the backend's, on every admin endpoint.
3. **The reports page can't act on what was reported.** It shows the target as a truncated id, with no link through to the product, service, review or user, and no suspend button. An admin can resolve or dismiss the report but has to go elsewhere to do something about the item.

**Backend endpoints that exist but still have no admin UI:** the read-only lists of all products, services, orders, bookings and reviews (including non-published ones), suspending a listing, moderating a review, direct refunds outside a dispute, and category reordering/renaming.

Run `npm install` isn't needed again — no new dependencies this step.

## Step 9: Real payments via Paystack (added)

The backend swapped its stubbed Stripe-shaped provider for a working Paystack integration (see the backend README's "Real payments via Paystack" section for the full reasoning — short version: Stripe doesn't onboard Nigeria-registered businesses, Paystack does). That changed the shape of what checkout returns, so every payment-touching screen changed with it:

- **`/cart`**'s "Place order" and the service **`BookingWidget`**'s "Confirm booking" now redirect the browser straight to Paystack's hosted checkout page (`window.location.assign(result.authorizationUrl)`) instead of navigating to a confirmation page that pretended payment was done. There's no embedded card form anywhere in this app — that's Paystack's page, not this frontend's.
- **`/payment/callback`** (new) — where Paystack sends the buyer back after they pay or give up. It reads the `reference` (or `trxref`, Paystack sends both) from the URL, asks the backend's new `GET /payments/verify` to check with Paystack directly, and shows a plain "payment received" or "payment not completed" result with a link into the order or booking. This is what makes the flow work in local dev even with no public webhook URL reachable.
- **Order and booking detail pages** — the old "payment isn't actually being processed yet" stub notice is gone, replaced with an honest "waiting for payment" message and a **Check payment status** button (`CheckPaymentButton`) for anyone who lands back on the detail page directly instead of via the callback page (e.g. from `/orders`) while a payment is still pending.
- **Dev server port moved to 3001** (`next dev -p 3001`) — the backend already used 3000, and until now nothing in this project had actually run both at once. `.env.example` and the backend's `CORS_ORIGIN`/`PAYMENT_CALLBACK_URL` defaults now assume this split. If you've changed either port locally, update both `.env` files to match.

**Not done here, and worth deciding on deliberately:** this pays the platform, not sellers. `payoutAmount` figures throughout the app (seller dashboard earnings, admin analytics) are still just recorded numbers — nothing here transfers money to a seller's bank account. That's a real, separate feature (Paystack subaccounts, most likely) with its own onboarding and compliance surface, flagged in the backend README rather than quietly assumed to exist.

Run `npm install` isn't needed again — no new frontend dependencies.

## Where the frontend stands

Payments are now real, closing the biggest "not actually functional" gap in the whole app. What's left: the admin gaps from Step 8, real image upload, `GET /users/me`, seller-side booking confirm/complete, unread indicators and block/report buttons in messaging, a buyer-side dispute-filing form, and — the next big one — actually paying sellers out.
