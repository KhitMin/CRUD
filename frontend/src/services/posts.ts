import api from "./api";
import type { ApiResponse, Post } from "../types";

export const postService = {
  async getAll(page = 1, limit = 10): Promise<ApiResponse<Post[]>> {
    const res = await api.get("/posts", { params: { page, limit } });
    return res.data;
  },

  async getByUser(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<Post[]>> {
    const res = await api.get(`/posts/byUser/${userId}`, {
      params: { page, limit },
    });
    return res.data;
  },

  async create(data: {
    title: string;
    content: string;
  }): Promise<ApiResponse<Post>> {
    const res = await api.post("/posts", data);
    return res.data;
  },

  async update(
    id: string,
    data: Partial<Pick<Post, "title" | "content">>
  ): Promise<ApiResponse<Post>> {
    const res = await api.patch(`/posts/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(`/posts/${id}`);
    return res.data;
  },
};
