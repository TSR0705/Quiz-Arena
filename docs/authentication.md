# Authentication & Sessions

QuizArena implements a secure, stateless token authentication architecture utilizing JSON Web Tokens (JWT) and HTTP-only cookies.

---

## Token Strategy

Sessions are divided into two distinct cookie elements:
1. **`access_token`**:
   - Short-lived JWT (15 minutes lifespan).
   - Encodes user identities (`userId`) and access privileges (`role`).
   - Verified statelessly in memory by route middleware.
2. **`refresh_token`**:
   - Long-lived token stored in the database as a SHA-256 hash.
   - Cleared on logout, or marked as `is_revoked = true` if compromise is suspected.
   - Used to request new access tokens via the `/api/auth/refresh` endpoint.

---

## Cookie Security Configurations

All session cookies are configured with parameters preventing browser/XSS access:
```javascript
const COOKIE_OPTIONS = {
  httpOnly: true,                         // Prevents document.cookie reading (XSS shield)
  secure: process.env.NODE_ENV === 'production', // Forces SSL-only transmission in production
  sameSite: 'lax',                        // Lax validation preventing CSRF exploits
  path: '/'
};
```

---

## Role-Based Route Filters

Middleware maps permissions to three access levels:

### 1. `authenticate`
Allows user sessions or active guest sessions. Mounts `req.principal` payload to request scopes:
```javascript
// Principal structure
req.principal = {
  type: 'user', // or 'guest'
  userId: 'user-uuid',
  role: 'user' // or 'admin'
};
```

### 2. `requireUser`
Guarantees the active requester is a registered accountholder (blocking guests from generating certificates or editing user profiles).

### 3. `requireAdmin`
Restricts access to administrative capabilities (creating/modifying questions, resolving abuse reports).
```javascript
export function requireAdmin(req, res, next) {
  if (!req.principal || req.principal.type !== 'user' || req.principal.role !== 'admin') {
    return res.status(403).json({ error: { message: "Admin privileges required." } });
  }
  next();
}
```

---

## Guest Session Lifecycles

Guests bypass the registration firewall using ephemeral identifiers:
- Requests to `/api/auth/guest` yield a cryptographically random token string stored in the browser's cookies under `guest_token`.
- The database stores a SHA-256 representation of the token in `guest_sessions` with a hardcoded `expires_at` threshold (24 hours).
- Guests can record scores, take practice quizzes, and view leaderboards, but cannot update profiles or generate certificates.
