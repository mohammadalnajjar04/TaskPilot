import axios from "axios";
import { getAccessToken, clearAuthStorage } from "../utils/storage";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      clearAuthStorage();

      const isAuthRequest = error.config?.url?.includes("/auth/");
      const isAlreadyOnLogin = window.location.pathname.startsWith("/login");

      if (!isAuthRequest && !isAlreadyOnLogin) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
