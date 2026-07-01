import { logger } from '../../utils/logger';

export class UserClient {
  static async getUserName(userId: string): Promise<string | undefined> {
    try {
      const url = process.env.USER_SERVICE_HTTP_URL || 'http://user-service:3001/api/users/';
      const response = await fetch(`${url}${userId}`);
      if (response.ok) {
        const user = await response.json();
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || undefined;
      }
      logger.warn(`[UserClient] Failed to fetch user ${userId}, status: ${response.status}`);
      return undefined;
    } catch (error) {
      logger.error(`[UserClient] Error fetching user ${userId}:`, error);
      return undefined;
    }
  }
}
