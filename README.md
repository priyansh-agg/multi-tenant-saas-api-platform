## SaaS API Backend – Multi-tenant Node.js Platform

Node.js + Express + MongoDB backend for a multi-tenant SaaS API with JWT-based human authentication, API-key-based machine access, and plan-aware billing enforcement.

### 1. Problem Statement

Modern SaaS products often need to expose APIs both to human users (dashboards, CLIs) and to other services (integrations, partner apps). The challenge is to:

- **Isolate organizations (tenants)** while sharing infrastructure.
- **Separate human and machine authentication** cleanly.
- **Control and observe usage** per organization and per API key.
- **Enforce pricing plans** (FREE / PRO / ENTERPRISE) without bolting on billing as an afterthought.

This backend is designed as a reference-quality implementation of those concerns, with a small focused codebase that still looks and behaves like a production system.

### 2. Architecture Overview

- **Runtime**: Node.js, Express, ES modules.
- **Database**: MongoDB with Mongoose models in `models/`.
- **App Entry**:
  - `src/server.js` – loads environment, connects to MongoDB, boots HTTP server.
  - `src/app.js` – configures Express, security middleware, and routes.
- **Domain Modules** (under `src/modules/*`):
  - `auth` – user registration, login, refresh tokens.
  - `organization` – organization (tenant) lifecycle + membership.
  - `apiKeys` – API key generation, listing, revocation.
  - `invite` – invitation-based onboarding into organizations.
  - `billings` – billing/usage helpers for plan enforcement.
  - `usage` – usage-centric endpoints (reads from logs).
- **Cross-cutting Middleware** (under `src/middlewares/*`):
  - `authMiddleware` – validates JWT access tokens, attaches `req.user`.
  - `orgMiddleware` – resolves the active organization context and role.
  - `apiKeyMiddleware` – validates and loads API key context.
  - `rateLimit` – per-key in-memory rate limiting.
  - `enforceBilling` – plan-based monthly usage enforcement.
  - `logUsage` – per-request usage logging to MongoDB.

#### Human vs Machine Authentication

- **Human auth (JWT)**:
  - Used for browser/CLI clients.
  - Access and refresh tokens, signed with separate secrets.
  - Attached via `Authorization: Bearer <access-token>`.
  - Required for routes under `/auth`, `/org`, `/invites`, etc.

- **Machine auth (API keys)**:
  - Used for server-to-server and integration scenarios.
  - A randomly generated token is **hashed once** and stored; the raw key is only returned once at creation.
  - Attached via `x-api-key` header.
  - Scoped to an organization and a permission set.
  - Routed through `requireApiKey`, `rateLimit`, `enforceBilling`, and `logUsage` for all data-access endpoints (e.g. `/v1/data`).

This separation keeps the human session model independent from machine credentials while still sharing organizational context and usage controls.

### 3. Feature Overview

- **Multi-tenant organizations**
  - Organizations with plan (`FREE`, `PRO`, `ENTERPRISE`).
  - Membership model with roles (`OWNER`, `ADMIN`, `MEMBER`).
  - Users can belong to multiple organizations.

- **Human authentication**
  - Registration and login with hashed passwords.
  - Short-lived access tokens and long-lived refresh tokens.
  - Stateless logout (ideal for horizontally scaled environments).

- **API key system for machine clients**
  - Per-organization API keys, created by `OWNER` / `ADMIN` roles.
  - Keys are generated once and stored only as a hash.
  - Optional permission array per key for scoping.
  - Revocation by `keyId` without database schema changes.

- **Usage logging & analytics**
  - Request-level logs capturing:
    - Organization
    - API key
    - Endpoint and HTTP method
    - Status code
    - Response time
  - Model-level data suitable for building dashboards and reports.

- **Rate limiting & billing enforcement**
  - In-memory, per-key rate limiting (requests/minute).
  - Plan-based monthly consumption limits and HTTP 402 responses when exceeded.
  - Strict linkage between plan configuration and middleware behavior.

- **Invitation-based onboarding**
  - Organizations can invite users via generated invites.
  - Correct role assignment when invited users accept.

### 4. Authentication & Security Design

**User Authentication (JWT)**  
- Passwords are never stored in plain text; they are hashed using bcrypt in the auth service.  
- On login, the service issues:
  - **Access token** – short-lived, used for most API calls.
  - **Refresh token** – longer-lived, used only to obtain new access tokens.
- The refresh endpoint verifies the refresh token using `JWT_REFRESH_SECRET` and issues a new access token without requiring password re-entry.
- The backend is stateless with respect to sessions, which allows:
  - Horizontal scaling (no shared session store requirement).
  - Easy revocation via rotating secrets when needed.

**API Key Authentication**  
- API keys are generated using a cryptographically strong random generator in `src/utils/apiKey.js`.
- The **raw key is never persisted**; only a hash (`keyHash`) is stored on the `ApiKey` model.
- The `requireApiKey` middleware:
  - Reads the `x-api-key` header.
  - Hashes the supplied value.
  - Performs a lookup on the hashed value and ensures the key is still active.
  - Attaches `req.apiKey` and `req.org` (organization context) for downstream handlers.

**Transport & Operational Concerns**  
- The app uses `helmet` and `cors` to set secure HTTP headers and control cross-origin access.
- This codebase assumes TLS termination is handled by the deployment environment (e.g., load balancer or API gateway).

### 5. Multi-tenancy & Organization Isolation

- **Organization model** (`Organisation`):
  - Contains organization metadata and the current plan.
  - Linked to a single `ownerId` (user that created the org).
  - All API keys and usage records are tied back to `orgId`.

- **Membership model**:
  - Encodes which users are members of which organizations.
  - Stores per-organization role (`OWNER`, `ADMIN`, `MEMBER`).
  - Used by `orgMiddleware` to assert that `req.user` has access to `req.org` and to inject the effective role into the request context.

- **Isolation strategy**:
  - Every sensitive API writes or reads **scoped by `orgId`**.
  - Human users only see organizations where they hold a membership.
  - Machine callers always operate under a single organization context determined by the API key.

This ensures tenant isolation without duplicating schemas or using separate databases per tenant.

### 6. API Key System

- **Generation**
  - `createApiKey` (in `apiKeysController`) is restricted to organization `OWNER` and `ADMIN` roles.
  - Generates a high-entropy random string.
  - Returns the raw key exactly once in the HTTP response.

- **Hashing**
  - The `hashApiKey` helper computes a one-way hash of the key.
  - Only the hash is stored in MongoDB (`ApiKey.keyHash`).
  - If the database is compromised, raw API keys cannot be recovered.

- **Permissions**
  - Each key can be associated with a list of permission strings (e.g. `"read:metrics"`, `"write:events"`).
  - Handlers and middleware can check `req.apiKey.permissions` to gate access.

- **Revocation**
  - API keys can be revoked individually by marking `isActive=false`.
  - The `revokeApiKey` controller ensures the key belongs to the calling organization.
  - Revoked keys immediately fail authentication at the middleware layer.

### 7. Usage Tracking, Rate Limiting & Billing Enforcement

- **Usage Logging**
  - Implemented in `logUsage` middleware.
  - Wraps the response lifecycle, measuring latency and persisting a record on completion.
  - Captures all relevant dimensions for analytics (org, key, endpoint, method, status, response time).

- **Per-Key Rate Limiting**
  - Implemented in `rateLimit` middleware.
  - Maintains an in-memory counter per API key ID in a one-minute window.
  - If a key exceeds its configured `rateLimit`, the request is rejected with HTTP 429.
  - Currently single-instance; can be swapped out with a distributed store like Redis for horizontal scaling (see roadmap).

- **Plan-based Billing Enforcement**
  - Plan definitions live in `src/config/plans.js`.
  - `enforceBilling` middleware:
    - Loads the organization by `orgId`.
    - Computes current month’s usage via `getMonthlyUsage`.
    - Compares against the plan’s `monthlyRequestLimit`.
    - Returns HTTP 402 when an organization exceeds its quota.

The result is a clear chain: **API key → org context → rate limit → billing check → handler**, with usage logged after the fact.

### 8. Example API Flow

End-to-end flow from initial user signup to authenticated machine calls:

1. **User registers**
   - `POST /auth/register` with name, email, password.
2. **User logs in**
   - `POST /auth/login` → receives `accessToken` + `refreshToken`.
3. **User creates an organization**
   - `POST /org` with `Authorization: Bearer <accessToken>`.
   - The creator becomes `OWNER` in the new organization via a membership record.
4. **User invites teammates (optional)**
   - `POST /invites` to send invitations for `ADMIN`/`MEMBER` roles.
5. **User creates an API key**
   - `POST /api-keys` (authenticated, scoped to an active org and role).
   - Receives a **raw API key** once; stores it securely in their system.
6. **Machine system invokes the API**
   - `GET /v1/data` with `x-api-key: <raw-api-key>`.
   - Request path:
     - `requireApiKey` → loads key + org context.
     - `rateLimit` → enforces per-key request rate.
     - `enforceBilling` → enforces monthly plan limit.
     - Handler returns data.
     - `logUsage` persists a usage record asynchronously after response.

This flow is intentionally minimal but covers the critical pieces a SaaS API needs in production.

### 9. Tech Stack

- **Runtime**: Node.js (ES modules)
- **Framework**: Express
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (access + refresh), bcrypt for password hashing
- **Security**: Helmet, CORS
- **Tooling**: Nodemon, ESLint, Prettier, Jest, Supertest

### 10. Local Setup

#### Prerequisites

- Node.js LTS (18+ recommended)
- MongoDB running locally or available via connection string

#### Installation

```bash
git clone <this-repo>
cd backend
npm install
```

#### Environment Configuration

Create a `.env` file in the project root based on the following configuration:

```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017/saas-backend

JWT_ACCESS_SECRET=change-me-access-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

NODE_ENV=development
```

#### Run in Development

```bash
npm run dev
```

The service will start on `http://localhost:3000` by default.

#### Run Tests

If you add tests, you can run them via:

```bash
npm test
```

### 11. Future Scaling Roadmap

This codebase is intentionally small, but the architecture is designed to evolve into a fully production-grade system.

- **Redis-backed Rate Limiting & Usage Aggregation**
  - Replace the in-memory rate limiter with a Redis-based implementation keyed by API key ID.
  - Store counters in a shared cache to support multiple app instances.
  - Pre-compute rolling usage metrics in Redis for faster dashboards.

- **Asynchronous Usage Ingestion**
  - Move `logUsage` from in-process writes to a queue-based system (e.g., Redis streams, RabbitMQ, Kafka).
  - API layer publishes compact usage events; a background worker performs batched inserts and aggregation.
  - Reduces write amplification and isolates analytics load from request latency.

- **Stripe / Razorpay Billing Integration**
  - Attach Stripe or Razorpay customers to organizations.
  - Map usage metrics to billable units (requests, seats, features).
  - Implement plan upgrades/downgrades and soft limits with overage alerts.

- **Horizontal Scaling**
  - Run multiple stateless API instances behind a load balancer.
  - Externalize all shared state:
    - Sessions remain stateless via JWT.
    - Rate limits and usage counters move to Redis.
    - Webhook deliveries and background jobs handled by dedicated workers.

- **API Versioning**
  - Introduce versioned routes (`/v1`, `/v2`) with a thin versioning layer.
  - Maintain backwards-compatible contracts for existing tenants while allowing newer orgs to opt into new semantics.
  - Use API key metadata to store preferred version in the long term.

- **Audit Logging**
  - Extend models and middleware to produce immutable audit trails for:
    - Authentication events.
    - Role changes and membership updates.
    - API key creation, rotation, and revocation.
  - Store in a dedicated collection (or external log store) suitable for compliance (SOC 2, ISO 27001).

- **Webhook Delivery System**
  - Allow organizations to register webhook endpoints for key events (e.g., usage thresholds, billing events).
  - Implement:
    - Outbox table/collection.
    - Reliable delivery with retries and exponential backoff.
    - Signature verification using per-org signing secrets.

- **Operator / Admin Dashboard (React, optional)**
  - React admin UI consuming the same backend API.
  - Surfaces:
    - Organization list and health.
    - Usage metrics per org and per key.
    - Billing and plan status.
    - Webhook configuration and delivery logs.

These steps keep the core design intact while adding the operational and reliability features expected in a real-world SaaS backend.

