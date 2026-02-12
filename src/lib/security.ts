// Security middleware for API endpoints

export function addSecurityHeaders(response: { setHeader: (name: string, value: string) => void }): void {
  // Add security headers
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('X-XSS-Protection', '1; mode=block')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('Content-Security-Policy', "default-src 'self'")
}

export function sanitizeInput(input: unknown): unknown {
  if (typeof input !== 'string') return input
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function validateIP(ip: string): boolean {
  // Basic IP validation
  if (!ip || typeof ip !== 'string') return false
  
  // Check for private/internal IPs
  const privateRanges: RegExp[] = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/
  ]
  
  // Block private/internal IPs for security
  return !privateRanges.some(range => range.test(ip))
}

export function createRateLimiter(maxRequests = 10, windowMs = 60000) {
  const requests = new Map<string, number[]>()
  
  return function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart)
      if (validTimestamps.length === 0) {
        requests.delete(key)
      } else {
        requests.set(key, validTimestamps)
      }
    }
    
    // Check current IP
    const ipRequests = requests.get(ip) || []
    
    if (ipRequests.length >= maxRequests) {
      return false // Rate limited
    }
    
    // Add current request
    ipRequests.push(now)
    requests.set(ip, ipRequests)
    
    return true // Allowed
  }
}
