# Boosts

Standalone Nitro workspace extracted from Botv3.

## Scope

Boosts contains the account connection interface, Discord invite joining, automatic 2Captcha integration, Nitro slot and cooldown reads, Nitro boost application, verification, and Live Log output.

Botv3 is no longer the home for the visible account workspace. This repository is intentionally kept separate so the account and Nitro workflow can evolve independently.

## Run

```bash
pnpm install
pnpm start
```

The local service listens on port `5000` by default. Set `PORT` to override it.

## Verification

```bash
pnpm test:smoke
pnpm test:operations
```

The Nitro cooldown display uses the account response from Discord. It does not fabricate a local cooldown when the account endpoint cannot provide one.

## Security

Account credentials are encrypted at rest using the existing `MASTER_KEY` / local master-key mechanism. Tokens must never be placed in logs, screenshots, commits, or issue reports.
