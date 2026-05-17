export interface AuthUser {
  id: number;
  email: string;
  role: string;
  password?: string;
}

export interface CreateAuthUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber: string;
}

export const AUTH_USER_READER = Symbol('AUTH_USER_READER');

export interface AuthUserReader {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: number): Promise<AuthUser | null>;
  create(data: CreateAuthUserData): Promise<AuthUser>;
}
