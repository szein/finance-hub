# Introduction 
A lightweight, responsive web application designed for seamless expense tracking and payment management between friends or family members. It features an intuitive, mobile-first interface focused on user simplicity and effortless financial management.

# Getting Started
Once the project is built and published call the following endpoint to create the database with default user:
`{apiUrl}/api/init`


## Migrations
- Added migration runner:
  - `src/infrastructure/db/migrate.ts`
- Added first SQL migration:
  - `src/infrastructure/db/migrations/001_init.sql`
- Updated DB bootstrap to run migrations:
  - `src/infrastructure/db/index.ts`
- Added script:
  - `npm run migrate`

## Repository/Service split

### Auth module

- `src/modules/auth/auth.repository.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.routes.ts` updated to delegate to service

### Finance module

- `src/modules/finance/finance.repository.ts`
- `src/modules/finance/finance.service.ts`
- `src/modules/finance/finance.routes.ts` updated to delegate to service

### Shared

- `src/shared/app-error.ts` for typed HTTP-safe errors across services


# FinanceApi Modularization

This is backend logic into module boundaries inside `finance-api`.

## Implemented structure

- `src/app.ts`: express app composition
- `src/config/env.ts`: typed environment/config values
- `src/infrastructure/db/index.ts`: SQLite setup + schema bootstrap
- `src/infrastructure/http/validate-body.ts`: shared request body validator
- `src/modules/auth/*`: auth schemas, security/session helpers, auth routes
- `src/modules/finance/*`: finance schemas and routes
- `src/types/domain.ts`: domain enums (`UserState`)

## Behavior retained

- Auth endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Finance endpoints:
  - `GET /api/finance/members`
  - `PATCH /api/finance/members/:id/status`
  - `DELETE /api/finance/members/:id`
  - `GET /api/finance/expenses`
  - `POST /api/finance/expenses`
  - `PUT /api/finance/expenses/:id`
  - `DELETE /api/finance/expenses/:id`