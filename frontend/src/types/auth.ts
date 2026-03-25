export interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  roles: Role[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
