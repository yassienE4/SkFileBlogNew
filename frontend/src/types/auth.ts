// User and Authentication interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: string;
  createdDate: string;
  lastLoginDate: string;
  isActive: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: LoginUser;
}
