# sightrader.com

Landing page and beta waitlist for Sightrader. It's one static page plus a tiny Cloudflare Worker that saves signups to a Cloudflare D1 database. No build step and no framework.

```
public/            everything the browser loads
  index.html       the landing page (styles and scripts are inside this one file)
  privacy.html     privacy notice (fill in the [placeholders] before launch)
  404.html         not-found page
  og.png           link preview image for Telegram, WhatsApp, LinkedIn, X
  favicon.svg
  fonts/           Archivo variable font, self-hosted (SIL Open Font License)
src/worker.js      handles POST /api/subscribe and writes to D1
schema.sql         the signups table
wrangler.jsonc     Cloudflare config
CLAUDE.md          notes for Claude Code when you edit the site with it
```

Everything below is free on Cloudflare's free plan.

---

## 1. Put the project on GitHub

Create an empty repository called `sightrader` on github.com (private is fine), then from this folder:

```bash
git init
git add .
git commit -m "Landing page and waitlist"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sightrader.git
git push -u origin main
```

## 2. Move sightrader.com's DNS to Cloudflare

You can keep GoDaddy as the registrar for now. Only the nameservers change.

1. Sign up at dash.cloudflare.com and choose **Add a domain** → `sightrader.com` → **Free** plan.
2. Cloudflare copies your existing DNS records. Check them, especially any MX records if you already have email on the domain.
3. If DNSSEC is switched on at GoDaddy, switch it off first and wait 24 hours.
4. In GoDaddy: **My Products → sightrader.com → DNS → Nameservers → Change → I'll use my own nameservers**, and enter the two nameservers Cloudflare gave you.
5. Wait until Cloudflare shows the domain as **Active**. Usually under an hour, sometimes up to a day.

## 3. Create the signup database

```bash
npm install
npx wrangler login
npx wrangler d1 create sightrader-waitlist
```

Copy the `database_id` it prints into `wrangler.jsonc` (replace `REPLACE_WITH_YOUR_DATABASE_ID`), then create the table and push the change:

```bash
npm run db:init:remote
git commit -am "Add D1 database id" && git push
```

## 4. Connect the repo so every push deploys

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository**.
2. Authorise GitHub, pick the `sightrader` repo, branch `main`.
3. Name the Worker `sightrader`. It must match `"name"` in `wrangler.jsonc` or the build fails.
4. Leave the build command empty and the root directory as `/`. The deploy command is `npx wrangler deploy` (the default).
5. **Save and Deploy**. You get a preview at `sightrader.<your-subdomain>.workers.dev`. Try the form there.

From now on, every `git push` to `main` goes live within a minute or two. Pushes to any other branch build a preview version with its own URL, which is a safe way to try a redesign before merging it into `main`.

## 5. Point sightrader.com at it

First, in **DNS → Records** for sightrader.com, delete any `A`, `AAAA` or `CNAME` records for `sightrader.com` (`@`) and `www` that Cloudflare copied over from GoDaddy (usually parking or website-builder records). Leave `MX` and `TXT` records alone. The custom domain can't be added while those records exist.

Then: Worker → **Settings → Domains & Routes → Add → Custom domain** → `sightrader.com`. Add `www.sightrader.com` the same way. Cloudflare creates the DNS records and the HTTPS certificate itself.

Finally, under **SSL/TLS → Edge Certificates**, turn on **Always Use HTTPS**.

## 6. Set up hello@sightrader.com

The page links to `hello@sightrader.com`. In Cloudflare go to **Email → Email Routing** and forward that address to your normal inbox.

## 7. Turn on analytics (optional)

**Analytics & Logs → Web Analytics** for page views. It doesn't use cookies, so you don't need a cookie banner.

---

## Reading your signups

```bash
npm run signups              # everyone, newest first
npm run signups:count        # total, and how many answered the questions
npm run signups:by-source    # which channel brought people in
```

Export everything:

```bash
npx wrangler d1 execute sightrader-waitlist --remote --command "SELECT * FROM signups" --json > signups.json
```

## Tracking which channel works

Add `?ref=` to every link you share. The page stores it with the signup:

- `sightrader.com/?ref=telegram`
- `sightrader.com/?ref=instagram`
- `sightrader.com/?ref=linkedin`
- `sightrader.com/?ref=reddit`

`?utm_source=` works too.

## Working on it locally

```bash
npm install
npm run db:init:local
npm run dev        # http://localhost:8787, with a local copy of the database
```

## Editing with Claude Code

```bash
cd sightrader
claude
```

Ask for what you want ("make the hero form full width on mobile", "add a section about pricing"), check it with `npm run dev`, then commit and push. `CLAUDE.md` tells Claude Code how the project fits together and what not to break.

## Optional: move the registration itself to Cloudflare

Cloudflare renews domains at cost. It only works once step 2 is done and the domain shows as Active, and not within 60 days of registering or last transferring the domain.

1. In GoDaddy, turn off **Domain Privacy** and **Domain Protection**, and unlock the domain. GoDaddy rejects the transfer if either is still on.
2. Get the authorisation code from GoDaddy.
3. Cloudflare dashboard → **Domain Registration → Transfer Domains**, pick sightrader.com, enter the code and pay for one year (it's added to your current expiry).
4. Approve the confirmation email from GoDaddy, or wait: GoDaddy has five days to release it.

## Before you share the link

- [ ] Fill in the `[placeholders]` in `public/privacy.html` (company name, number, address, date).
- [ ] If you open a Telegram or Discord group for testers, put its invite link in `CONFIG.communityUrl` near the bottom of `public/index.html`. The thank-you message then shows a button to join.
- [ ] Make sure "Founding-tester pricing when Sightrader launches" is a promise you're happy to keep, or delete that line.
- [ ] UK organisations that hold personal data usually need to pay the ICO data protection fee. Check at ico.org.uk.
