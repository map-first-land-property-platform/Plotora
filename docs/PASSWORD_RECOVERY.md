# Password recovery

## Local use

The recovery pages now call the backend. Mailpit captures local messages; it does
not deliver them to real inboxes. Start Docker Desktop, then from the repo root:

```powershell
docker compose --env-file infrastructure/docker/.env -f infrastructure/docker/compose.yaml up -d --build
docker compose --env-file frontend/.env.local -f frontend/compose.yaml up -d --build
```

1. Register a local Buyer or Seller, or use an existing account with a password.
2. Open http://localhost:3000/forgot-password and submit that account's email.
3. Open http://localhost:8025. A reset message should arrive within a few seconds.
4. Open the link, enter a different password and confirm it.
5. Sign in with the new password. The old password and existing sessions should fail.
6. A second email confirms the change without containing a password or recovery token.

Do not reset another person's account during a demonstration. Use a test account.
An unknown address produces the same confirmation but no email. The request can
be accepted even when SMTP is temporarily down: delivery happens in the background.

## Security design

- New 32-byte SecureRandom reset tokens expire in 30 minutes and are stored as
  SHA-256 hashes. New links invalidate older unused links for that account.
- New email links put the token in a URL fragment, which is not sent to the web
  server. The frontend also supports older query-string links. Neither tokens nor
  passwords are stored in localStorage. Recovery pages have no-referrer/noindex
  metadata. Do not enable analytics, URL capture or request-body logging on them.
- Issuance, password changes, login and refresh serialize using a per-user database
  lock. A token can be consumed once, including under simultaneous submissions.
- A successful change increments the account authentication version, rejecting
  old access JWTs immediately on subsequent requests and revoking refresh tokens.
  Already-running requests are not retroactively cancelled. Other accounts are unaffected.
- A reset does not automatically sign in the user. Passwords remain BCrypt hashes.
  The existing registration complexity rules apply, with an additional 72 UTF-8
  byte limit to avoid BCrypt truncation/errors. This is a byte limit, not merely
  a count of displayed characters.
- Public requests enqueue work for known and unknown addresses alike; lookup and
  SMTP are deferred to reduce account enumeration through response timing. Email
  cooldowns are silent. Password reset is not a replacement for MFA recovery;
  accounts marked two-factor-enabled or without a local password are ineligible.
- Database rate limits survive restarts and are shared by backend instances:
  10 forgot requests per client IP per 15 minutes, 3 per address per 15 minutes,
  with a 60-second email cooldown; reset submissions allow 20 per IP and 10 per
  token per 15 minutes. Field-invalid requests are rejected before controller
  execution; use edge/WAF limits for malformed-body floods as well.
- The limiter uses the servlet remote address, not arbitrary forwarded headers.
  Configure trusted proxy handling at deployment; otherwise all proxied users
  can share an IP limit. Do not globally trust user-supplied X-Forwarded-For.
- Recovery mail jobs are durable and AES-GCM encrypted using a key derived for
  this purpose from MAIL_QUEUE_SECRET. The worker takes a two-minute conditional
  lease, retries transient failures up to five attempts, and removes completed,
  exhausted or expired jobs. A restart retries the same prepared link, rather
  than issuing a different token on every SMTP attempt. SMTP acceptance is not
  proof of inbox delivery. A crash after acceptance can result in a duplicate email.
- The reset table contains only hashes. The encrypted outbox necessarily contains
  the usable link until delivery; protect its key separately from database backups.
  Do not rotate that key while jobs are pending without planning for invalid jobs.
- Logs record only job IDs, failure class and retry status, never mail content,
  addresses or tokens. Completed jobs are deleted promptly, limiter rows expire,
  and expired reset rows are cleaned after one day.

No external queue, Redis instance or new third-party Java dependency is needed.
V6 adds the session-version columns, mail outbox and limiter tables. Existing
migrations must remain unchanged. Existing JWTs without a version use version 0
and become invalid after an account's first password reset.

## Production configuration (next sprint)

Keep Mailpit for development only. Add real settings to the private deployment
environment (see infrastructure/docker/.env.example), not to source control:

- WEB_BASE_URL: the trusted public HTTPS frontend URL, never a request Host header.
- CORS_ORIGIN: the exact allowed frontend origin; COOKIE_SECURE=true.
- MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM: real provider
  settings using a verified sending address. Configure provider domain authentication.
- MAIL_SMTP_AUTH=true and MAIL_SMTP_STARTTLS=true (STARTTLS is required, with
  server identity checking). This configuration targets SMTP port 587; provider
  APIs or implicit TLS on 465 would require different settings.
- JWT_SECRET and MAIL_QUEUE_SECRET: different random private secrets, each at
  least 32 bytes. The built-in dev defaults are for local use only.
- RECOVERY_PRODUCTION=true enables startup checks for the settings above.

Start production with private settings, verify delivery/bounces and provider
quotas, protect the local Mailpit UI from public access, and review the existing
Next.js security advisory before deployment. Public feedback must never expose
whether a mailbox has an account or reveal provider error details.

## Checks

Backend: `./mvnw.cmd test`. Recovery integration tests cover generic responses,
encrypted jobs, retry behavior, expiry, tampering, repeated and simultaneous
use, session invalidation, CSRF and rate limits. SMTP is mocked only in those tests;
the local browser check should additionally exercise actual Mailpit delivery.

Frontend: `npm test`, TypeScript, lint and `npm run build`. Verify invalid links,
loading/errors, password confirmation, light/dark themes and mobile layouts.

Reference: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
