# Contributing to Plotora

## Branches

- `main` contains reviewed, release-ready code.
- `develop` is the shared integration branch.
- Use one short-lived `feature/<name>` or `fix/<name>` branch per change.

## Pull requests

1. Start from the latest `develop` branch.
2. Keep a pull request focused on one feature or fix.
3. Rebase on `develop` before requesting review.
4. Run the frontend and backend checks locally.
5. Explain configuration, database, or API changes in the pull request.

Do not merge a pull request with failing checks or unresolved review comments.

## Local checks

```powershell
Push-Location frontend
npm ci
npm run lint
npm run test
npm run build
Pop-Location

Push-Location backend
./mvnw.cmd test
Pop-Location
```

Use `infrastructure/docker/README.md` for the local database setup. Never commit
`.env`, `.env.local`, passwords, tokens, or other private configuration.

## Project conventions

- Keep route files in `frontend/src/app`.
- Put reusable design-system components in `frontend/src/components/ui`.
- Put feature-specific frontend components under `frontend/src/features/<feature>`.
- Keep backend code close to its business domain. Property HTTP controllers belong
  in `backend/.../property/controller`; authentication code belongs in `auth`.
- Add or update tests with every behavior change.
