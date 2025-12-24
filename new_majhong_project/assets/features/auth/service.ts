// Auth service

import { logger } from '../../shared/logger';
import { AuthState, AuthAction } from './types';

export class AuthService {
  private state: AuthState = {
    isAuthenticated: false,
    userId: null,
    token: null
  };

  async login(userId: string, password: string): Promise<{ success: boolean; token?: string }> {
    logger.info('Auth', `Login attempt for user: ${userId}`);
    
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token = `mock_token_${userId}_${Date.now()}`;
    this.state = {
      isAuthenticated: true,
      userId,
      token
    };

    logger.info('Auth', 'Login successful');
    return { success: true, token };
  }

  async logout(): Promise<void> {
    logger.info('Auth', 'Logout');
    this.state = {
      isAuthenticated: false,
      userId: null,
      token: null
    };
  }

  getState(): AuthState {
    return { ...this.state };
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getToken(): string | null {
    return this.state.token;
  }

  getUserId(): string | null {
    return this.state.userId;
  }
}

