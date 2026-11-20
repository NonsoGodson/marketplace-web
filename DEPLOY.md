# Deploying the website to Vercel

Before you start: the backend (Railway) must already be running and `https://<backend>/health` must work.

1. Push this folder to its own GitHub repo (repo root = this folder, so `package.json` is at the top).
2. vercel.com -> Add New -> Project -> import the repo. Vercel detects Next.js; leave the build settings alone.
3. Under **Environment Variables** add (before the first deploy):
   - `NEXT_PUBLIC_API_URL` = your Railway backend address, no trailing slash
4. Deploy. Vercel gives you an address like `https://<project>.vercel.app`.
5. Back on Railway, backend service -> Variables:
   - `CORS_ORIGIN` = the Vercel address (add more with commas, e.g. your own domain later)
   - `PAYMENT_CALLBACK_URL` = `https://<vercel address>/payment/callback`
   Railway redeploys automatically.
6. Open the Vercel address, register/log in, open the Admin pages.

Notes
- If you change `NEXT_PUBLIC_API_URL`, redeploy on Vercel (Deployments -> ... -> Redeploy).
- Vercel "preview" deployments get different addresses, which the backend's `CORS_ORIGIN` does not know about, so test on the production address.
- Custom domain: Vercel -> Settings -> Domains -> add `naijamarkethub.app`, set the DNS records Vercel shows, then add `https://naijamarkethub.app` to `CORS_ORIGIN` and update `PAYMENT_CALLBACK_URL`.
