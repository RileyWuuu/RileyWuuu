// Auth module types

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
}

export interface AuthAction {
  type: 'LOGIN' | 'LOGOUT' | 'SET_TOKEN';
  payload?: {
    userId?: string;
    token?: string;
  };
}

