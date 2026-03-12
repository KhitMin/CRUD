export interface User {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "user";
  phoneNo?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
  errors?: Record<string, string[]>;
}
