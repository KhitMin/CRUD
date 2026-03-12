import api from "./api";
import type { AuthResponse, ApiResponse, User } from "../types";

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phoneNo?: string;
    description?: string;
  }): Promise<ApiResponse<User>> {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  async login(
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};
