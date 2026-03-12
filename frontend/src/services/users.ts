import api from "./api";
import type { ApiResponse, User } from "../types";

export const userService = {
  async getAll(page = 1, limit = 10): Promise<ApiResponse<User[]>> {
    const res = await api.get("/users", { params: { page, limit } });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<Pick<User, "name" | "email" | "phoneNo" | "description">>
  ): Promise<ApiResponse<User>> {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};
