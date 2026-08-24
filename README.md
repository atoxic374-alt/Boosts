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

### Multi-account Nitro posting

Open **Nitro Boosts**, select multiple saved accounts in the **Accounts to use** list with Ctrl/Cmd-click, then choose the target server or invite and submit. Selected accounts are processed concurrently with a maximum of three workers. Each account still uses its own serialized queue and rate limiter, and the result panel reports completion and verification per account. The original single-account endpoint remains available at `/api/ts/nitro/post`; the multi-account endpoint is `/api/ts/nitro/post-bulk`.

## Security

Account credentials are encrypted at rest using AES-256-GCM. Every secret gets a fresh random IV and authentication tag. Records are stored as an encrypted envelope such as `v1:<iv>:<tag>:<ciphertext>`; plaintext records remain readable only for one-way migration when a write occurs.

For deployments, set `MASTER_KEY` to exactly 64 hexadecimal characters and keep it in a secret manager or protected environment variable. If `MASTER_KEY` is not set, Boosts creates `data/.master_key` with file mode `600` on first run. Back up that key separately: losing it makes the encrypted records unrecoverable. If an existing key is malformed, the application fails closed instead of replacing it.

Tokens must never be placed in logs, screenshots, commits, or issue reports. The public account API exposes only metadata such as `hasDirectToken`, never the token itself.

Run the local crypto regression test with:

```bash
pnpm test:crypto
```
