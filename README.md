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

Open **Nitro Boosts**, select multiple saved accounts in the **Accounts to use** list with Ctrl/Cmd-click, choose the number of parallel accounts from 1 to 10, then choose the target server or invite and submit. Each account still uses its own serialized queue and rate limiter. Rate-limited requests are retried safely when Discord provides a retry interval; if the limit persists, that account is reported separately with its retry time while the other accounts continue. The live log uses `[Nitro][account][stage]` entries for clear per-account tracking. The original single-account endpoint remains available at `/api/ts/nitro/post`; the multi-account endpoint is `/api/ts/nitro/post-bulk`.

When importing numbered tokens, choose a Nitro duration in the import card. That duration is saved with every imported account and shown next to the account selector. The Nitro posting flow uses the saved duration automatically; if selected accounts have different saved durations, each account receives its own duration. A manual duration selection in the Nitro card overrides the saved plan for that operation.

Before the Nitro account selector becomes available, the app runs a bulk preflight across the saved accounts. Only accounts that pass the health check, have enough available Nitro slots for the requested boost count, have no active boost subscription, and have no active cooldown are shown as selectable. The card reports ready and excluded counts; exclusion reasons can be expanded for each account. The server repeats these checks at execution time so stale dashboard data cannot force a boost attempt on an ineligible account.

The **Change boost server** flow performs the complementary check: it lists only accounts with active boosts whose selected slots are transferable, verifies the target membership, and asks for confirmation before the side-effecting operation. A confirmed move releases the selected premium guild subscription, refreshes the same slot IDs, applies those released slots to the target guild, and verifies the target assignment. A general account cooldown no longer blocks an otherwise transferable remaining slot; slot-level `cooldown_ends_at` is authoritative for the selected move. If Discord accepts the release but rejects the re-application, the result is reported as partial so the operator can refresh the account state instead of blindly retrying.

The green **Post new Boost** action is separate from **Move existing Boost**. Use Post new Boost when an account has available, unapplied slots and you want to apply them to a selected server or invite. Accounts with no source server are normal in this mode because they have not boosted anywhere yet; they are excluded only from Move existing Boost, not from new posting.

Discord may answer `GET /users/@me/guilds/premium/subscriptions/cooldown` with JSON code `10050` (`Unknown premium server subscribe cooldown`). The implementation treats this specific response as the documented empty account-level cooldown state, keeps HTTP 429 as a real rate limit, and continues checking each slot's `cooldown_ends_at` independently. The UI records the source of the cooldown result so an operator can distinguish `no active cooldown` from an actual read failure.

## Security

Account credentials are encrypted at rest using AES-256-GCM. Every secret gets a fresh random IV and authentication tag. Records are stored as an encrypted envelope such as `v1:<iv>:<tag>:<ciphertext>`; plaintext records remain readable only for one-way migration when a write occurs.

For deployments, set `MASTER_KEY` to exactly 64 hexadecimal characters and keep it in a secret manager or protected environment variable. If `MASTER_KEY` is not set, Boosts creates `data/.master_key` with file mode `600` on first run. Back up that key separately: losing it makes the encrypted records unrecoverable. If an existing key is malformed, the application fails closed instead of replacing it.

Tokens must never be placed in logs, screenshots, commits, or issue reports. The public account API exposes only metadata such as `hasDirectToken`, never the token itself.

Run the local crypto regression test with:

```bash
pnpm test:crypto
```
