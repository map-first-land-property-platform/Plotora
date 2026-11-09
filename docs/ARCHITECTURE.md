# Plotora architecture

Plotora is a small monorepo with independently runnable frontend, backend, and
development infrastructure projects.

```text
Plotora/
├── frontend/          Next.js web application
├── backend/           Spring Boot API and database migrations
├── infrastructure/    Local services, currently PostgreSQL/PostGIS
├── docs/               Architecture and team documentation
├── CONTRIBUTING.md     Shared development and PR workflow
└── README.md           Product and repository overview
```

## Frontend boundaries

- `src/app` contains Next.js routes, layouts, and route-specific loading/error
  states.
- `src/features` contains feature-owned components. A feature may grow its own
  components, hooks, and API adapters without placing them in the global shared
  namespace.
- `src/components/ui` contains reusable, feature-neutral UI primitives.
- `src/components` contains shared site components that are not tied to one
  feature.
- `src/lib` contains API clients, formatting, authentication/session helpers,
  and other reusable logic.
- `public` contains static assets only.

## Backend boundaries

- `auth` contains authentication and token-related behavior.
- `property` contains property entities, DTOs, repositories, services, domain
  exceptions, and property HTTP controllers.
- `user` contains user and role persistence models.
- `config` contains application configuration and security wiring.
- `exception` contains cross-cutting exception handling.
- `system/controller` contains operational endpoints such as health checks.
- `resources/db/migration` contains ordered Flyway migrations. Existing
  migrations must not be renamed or edited after they have been shared.

New code should follow the nearest existing domain boundary. Avoid creating a
new top-level package for a class that belongs to an existing feature.
