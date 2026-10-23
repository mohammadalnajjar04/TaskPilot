import axiosClient from "../api/axiosClient";
import { CATEGORY_ENDPOINTS } from "../api/endpoints";

export const categoryService = {
  async list() {
    const { data } = await axiosClient.get(CATEGORY_ENDPOINTS.list);
    return data.data;
  },

  async get(categoryId) {
    const { data } = await axiosClient.get(CATEGORY_ENDPOINTS.get(categoryId));
    return data.data;
  },

  async create(payload) {
    const { data } = await axiosClient.post(CATEGORY_ENDPOINTS.create, payload);
    return data.data;
  },

  async update(categoryId, payload) {
    const { data } = await axiosClient.put(
      CATEGORY_ENDPOINTS.update(categoryId),
      payload
    );
    return data.data;
  },

  async delete(categoryId) {
    const { data } = await axiosClient.delete(
      CATEGORY_ENDPOINTS.delete(categoryId)
    );
    return data.data;
  },
};
