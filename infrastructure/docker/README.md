# Plotora PostgreSQL + PostGIS development database

This Compose project runs the Plotora development database only. It does not
containerize the frontend or backend and does not use any MediPulse resources.

## Prerequisites

- Docker Desktop with the Linux engine running
- WSL 2
- Java 21
- The Maven Wrapper included in `backend/`

## First-time setup

From the repository root in PowerShell:

```powershell
Copy-Item infrastructure/docker/.env.example infrastructure/docker/.env
notepad infrastructure/docker/.env
```

Set a private password in `.env`. The file is ignored by Git. Do not place
database credentials in a `NEXT_PUBLIC_*` variable or commit the file.

Validate and start only Plotora's database:

```powershell
docker compose -f infrastructure/docker/compose.yaml --env-file infrastructure/docker/.env config
docker compose -f infrastructure/docker/compose.yaml --env-file infrastructure/docker/.env up -d
```

The database is available from Windows at `127.0.0.1:5434` and is not exposed
outside the local machine. The first successful Spring Boot startup runs the
Flyway migration in `backend/src/main/resources/db/migration/`, which enables
PostGIS. Docker initialization scripts, when present in a Postgres image, run
only when a new data directory is initialized; do not delete the volume to
rerun them.

## Spring Boot

The backend reads these environment variables:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "5434"
$env:DB_NAME = "plotora_db"
$env:DB_USERNAME = "plotora_app"
$env:DB_PASSWORD = "your-private-development-password"
$env:SERVER_PORT = "8082"
Push-Location backend
./mvnw.cmd spring-boot:run
Pop-Location
```

Compose `.env` values are not automatically imported into a separately run
Java process. Set the variables explicitly as above, or load them through your
local PowerShell profile without committing secrets.

For the Next.js frontend, update the ignored `frontend/.env.local` on each
developer machine so it contains:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8082/api/v1
```

The repository's `frontend/.env.example` already documents this value. Do not
put database credentials in the frontend environment. Because
`frontend/.env.local` is ignored and was intentionally not overwritten, update
its local `NEXT_PUBLIC_API_BASE_URL` value manually to
`http://localhost:8082/api/v1`.

## Daily commands

```powershell
# Start Plotora without touching other Compose projects
docker compose -f infrastructure/docker/compose.yaml --env-file infrastructure/docker/.env up -d

# Check service health
docker compose -f infrastructure/docker/compose.yaml --env-file infrastructure/docker/.env ps

# View database logs
docker compose -f infrastructure/docker/compose.yaml --env-file infrastructure/docker/.env logs -f postgis

# Stop Plotora but keep its data volume
docker compose -f infrastructure/docker/compose.yaml --env-file infrastructure/docker/.env stop
```

Do not use `docker compose down -v`; it deletes the Plotora database volume.
`docker compose down` without `-v` removes the container and network but keeps
the named volume, though `stop` is preferred for routine development.

## Verify PostGIS

```powershell
docker exec -it plotora-postgis psql -U plotora_app -d plotora_db -c "SELECT version();"
docker exec -it plotora-postgis psql -U plotora_app -d plotora_db -c "SELECT PostGIS_Version();"
docker exec -it plotora-postgis psql -U plotora_app -d plotora_db -c "SELECT ST_AsText(ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326));"
docker exec -it plotora-postgis psql -U plotora_app -d plotora_db -c "SELECT extname FROM pg_extension WHERE extname = 'postgis';"
```

Expected spatial output is `POINT(79.8612 6.9271)`.

## pgAdmin on Windows

Create a server named `Plotora Development` with host `127.0.0.1`, port
`5434`, maintenance database `plotora_db`, and the username/password from the
local `.env`. Do not change any MediPulse pgAdmin connection.

## Troubleshooting

- **Docker Engine unavailable:** start Docker Desktop and confirm the Linux
  engine is selected.
- **Port occupied:** identify the listener with
  `Get-NetTCPConnection -LocalPort 5434`; do not stop an unrelated process.
- **Authentication failure:** ensure `DB_USERNAME` and `DB_PASSWORD` match the
  values used when the volume was first initialized. Existing Postgres volumes
  retain their original credentials.
- **Connection refused:** start the Compose service and wait for
  `docker compose ... ps` to report healthy.
- **PostGIS unavailable:** inspect Flyway logs and confirm the image is
  `postgis/postgis:17-3.6`.
- **Flyway migration error:** read the backend startup error and correct the
  database connection or migration; do not use destructive repair/reset
  commands against shared data.
- **Environment variables missing:** remember that Compose `.env` is not
  inherited by a locally launched Spring Boot process.
