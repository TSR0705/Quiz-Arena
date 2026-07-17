const ipRequests = new Map();

// Regularly clean up memory
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequests.entries()) {
    const valid = timestamps.filter(t => now - t < 15 * 60 * 1000);
    if (valid.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, valid);
    }
  }
}, 5 * 60 * 1000);

/**
 * Custom memory-based abuse rate limiter middleware (Patch 6)
 * 
 * @param {number} limit - Maximum requests allowed per window
 * @param {number} windowMs - Time window in milliseconds (default 15 mins)
 */
export function rateLimiter(limit = 60, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    // Skip rate limiting during testing to prevent test leakage
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, []);
    }

    const timestamps = ipRequests.get(ip);
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= limit) {
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many verification attempts from this IP. Please try again later.'
        }
      });
    }

    validTimestamps.push(now);
    ipRequests.set(ip, validTimestamps);
    next();
  };
}
