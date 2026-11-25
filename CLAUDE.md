# Sightrader landing page: notes for Claude Code

Landing page and beta waitlist for sightrader.com, a planned platform for building AI trading agents from modules and stress-testing them against replayed and synthetic market scenarios. The page's job is to measure interest: it collects beta signups and two optional survey answers.

## How it fits together

- `public/index.html` is the whole page: HTML, CSS in one `<style>` block, JS in one `<script>` block. No build step, no framework. Keep it that way unless asked.
- `src/worker.js` runs only for requests that don't match a file in `public/`. It handles `POST /api/subscribe` and upserts into D1 (binding `DB`). Everything else falls through to `env.ASSETS`.
- `schema.sql` defines the `signups` table. If you add a column, add a migration step to the README too; don't just edit the schema.
- Pushing to `main` deploys to production through Cloudflare Workers Builds.

## Commands

- `npm run dev` serves the site and API on http://localhost:8787 with a local D1 database (`npm run db:init:local` once first).
- `npm run signups` lists live signups. Read-only; never run write or delete queries against `--remote` unless the user asks.

## Design system

- Tokens live in `:root`: ink `#13233F`, paper `#E6EAEE`, panel white, crash-test yellow `#F2BE00`, breach red `#C8102E`, pass teal `#17785F`, steel `#8693A1`.
- One typeface: Archivo variable, self-hosted in `public/fonts/`. Headings use `font-stretch` 106–125% and weight 800; body is 100%. Don't add Google Fonts or other third-party requests.
- The brand mark is a quartered crash-test target (`#target` symbol, `favicon.svg`).
- Sentence case everywhere, no all-caps labels.

## The test-bay demo

The console in the hero replays illustrative runs from the `SCENARIOS` object in the script. Agent equity is computed from the market path and an exposure schedule, and the scorecard's drawdown and market-move figures are calculated from those series, so change the inputs rather than typing numbers in. The caption saying the runs are illustrative must stay.

## Rules

- No invented social proof: no fake testimonials, signup counters, "as seen in" logos or performance claims.
- Keep the footer disclaimer and the FAQ answers saying Sightrader doesn't trade real money and isn't investment advice.
- The step-two form values (role, agent_use, markets) must match the allowlists at the top of `src/worker.js`. Change both together.
- Keep it accessible: visible focus, labelled inputs, reduced motion respected, readable at 390px wide.
- Never commit secrets. Use `.dev.vars` locally and Worker secrets in production.
