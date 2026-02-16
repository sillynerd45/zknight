/**
 * Exponential backoff retry utility
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
  maxDelay = 10000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[RetryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Shorten Stellar address for display
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format time elapsed since timestamp
 */
export function formatTimeSince(timestamp: number, currentTime: number): string {
  const diff = currentTime - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/**
 * Format time remaining until expiry (1 hour from created)
 */
export function formatTimeRemaining(timestamp: number, currentTime: number): string | null {
  const expiresAt = timestamp + 3600; // 1 hour = 3600 seconds
  const remaining = expiresAt - currentTime;

  if (remaining <= 0) return 'Expired';
  if (remaining < 60) return '< 1 min';
  if (remaining < 3600) return `${Math.floor(remaining / 60)} min`;
  return null; // > 1 hour, don't show
}

/**
 * Check if game is expiring soon (< 10 minutes)
 */
export function isExpiringSoon(timestamp: number, currentTime: number): boolean {
  const expiresAt = timestamp + 3600;
  const remaining = expiresAt - currentTime;
  return remaining > 0 && remaining < 600;
}

/**
 * Check if game is expired
 */
export function isExpired(timestamp: number, currentTime: number): boolean {
  const expiresAt = timestamp + 3600;
  return currentTime >= expiresAt;
}

/**
 * Format Unix timestamp to readable time
 */
export function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString();
}
