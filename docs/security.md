# Security Controls

QuizArena implements a multi-layered security structure covering network layers, encryption protocols, access limits, and database guards.

---

## 1. Network & HTTP Header Security (Helmet)

The backend Express engine mounts `helmet` to secure headers:
* **Frame Protection**: Sets `X-Frame-Options: SAMEORIGIN` to prevent clickjacking.
* **Content Type Options**: Enforces `X-Content-Type-Options: nosniff`.
* **Download Options**: Restricts file execution in IE via `X-Download-Options`.
* **Referrer Policies**: Defaults to `no-referrer` or secure origins.

---

## 2. API Abuse Rate Limiting

To prevent brute force credentials attacks, custom rate limiting middleware monitors client IPs:
* **Authentication Routes**: Login, register, and password reset endpoints are limited to **15 requests per 15-minute window**.
* **Certificate Lookup Verification**: Endpoint `/api/certificates/verify/:code` is limited to **10 requests per 1-minute window** to block lookup scanning.
* **Memory Management**: The rate limiter cleans up memory every 5 minutes by purging old timestamps.

---

## 3. Cryptographic Protections

* **Password Hashing**: User passwords undergo salting and hashing via `bcryptjs` with **10 salt rounds** prior to storage.
* **Secret Requirements**: Startup validations (`validateEnv`) verify that production `JWT_SECRET` and `REFRESH_TOKEN_SECRET` values are at least **32 characters long** and reject common default keys (e.g. `secret`, `dev`, `changeme`).

---

## 4. Cross-Origin Resource Sharing (CORS)

Production CORS restricts API endpoint requests strictly to verified domains:
- Allowed origins are defined by `CORS_ORIGIN` or `FRONTEND_URL` in env settings.
- If unconfigured, the server dynamically permits preview origins for testing flexibility while blocking wildcards (`*`) to preserve credentials/cookie transmission rules.

---

## 5. Parameterized SQL Database Queries

All data interactions are executed through Knex.js query builders:
- Avoids raw string interpolation.
- Inputs are parameterized dynamically at the driver layer, providing complete protection against SQL Injection attacks.
