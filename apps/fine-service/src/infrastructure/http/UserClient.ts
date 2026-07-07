import { logger } from '../../utils/logger';
import { CircuitBreaker } from '../../utils/CircuitBreaker';

const breaker = new CircuitBreaker({ name: 'UserHttpClient', failureThreshold: 3, resetTimeoutMs: 15000 });

export class UserClient {
  static async getUserName(userId: string): Promise<string | undefined> {
    return breaker.execute(
      async () => {
        const url = process.env.USER_SERVICE_HTTP_URL || 'http://user-service:3003/api/users/';
        const response = await fetch(`${url}${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user ${userId}, status: ${response.status}`);
        }
        const user = await response.json();
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || undefined;
      },
      () => {
        logger.warn(`[UserClient] Fallback executed for user ${userId} due to open circuit or error.`);
        return undefined;
      }
    );
  }
}

