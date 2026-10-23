import axiosClient from "../api/axiosClient";
import { NOTIFICATION_ENDPOINTS } from "../api/endpoints";

export const notificationService = {
  async list(params) {
    const { data } = await axiosClient.get(NOTIFICATION_ENDPOINTS.list, {
      params,
    });
    return data.data;
  },

  async get(notificationId) {
    const { data } = await axiosClient.get(
      NOTIFICATION_ENDPOINTS.get(notificationId)
    );
    return data.data;
  },

  async markAsRead(notificationId) {
    const { data } = await axiosClient.patch(
      NOTIFICATION_ENDPOINTS.read(notificationId)
    );
    return data.data;
  },

  async markAllAsRead() {
    const { data } = await axiosClient.patch(NOTIFICATION_ENDPOINTS.readAll);
    return data.data;
  },

  async unreadCount() {
    const { data } = await axiosClient.get(NOTIFICATION_ENDPOINTS.unreadCount);
    return data.data;
  },

  async delete(notificationId) {
    const { data } = await axiosClient.delete(
      NOTIFICATION_ENDPOINTS.delete(notificationId)
    );
    return data.data;
  },
};
