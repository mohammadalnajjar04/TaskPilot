import axiosClient from "../api/axiosClient";
import { AUTH_ENDPOINTS } from "../api/endpoints";

export const authService = {
  async register(fullName, email, password) {
    const { data } = await axiosClient.post(AUTH_ENDPOINTS.register, {
      fullName,
      email,
      password,
    });
    return data.data;
  },

  async login(email, password) {
    const { data } = await axiosClient.post(AUTH_ENDPOINTS.login, {
      email,
      password,
    });
    return data.data;
  },

  async getMe() {
    const { data } = await axiosClient.get(AUTH_ENDPOINTS.me);
    return data.data.user;
  },
};
